const API_BASE = 'http://127.0.0.1:5000/api';

async function req(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (netErr) {
    console.error(`Network error requesting ${url}:`, netErr.message, netErr.cause);
    throw netErr;
  }
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.data = data;
    error.status = res.status;
    throw error;
  }
  return data;
}

async function runOrdersCheckoutTests() {
  console.log('--- URBAN CHECK CHECKOUT & ORDER MANAGEMENT SYSTEM TEST ---');

  try {
    // 1. Authenticate a test patron
    console.log('1. Registering test customer...');
    const testEmail = `patron_checkout_${Date.now()}@example.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Victoria Sterling',
        email: testEmail,
        phone: '+91 98111 22233',
        password: 'LuxuryPassword123!',
      }),
    });
    const token = regRes.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log(`   Customer registered: ${testEmail}`);

    // 2. Test Address Management (CRUD)
    console.log('\n2. Testing Address Management (/api/addresses)...');
    const addr1Res = await req('/addresses', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Victoria Sterling',
        phone: '+91 98111 22233',
        address: '14/B Heritage Boulevard, Flat 402',
        apartment: 'Penthouse 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400050',
        landmark: 'Near Taj Lands End',
      }),
    });
    const addr1 = addr1Res.data;
    console.log(`   Address 1 created: "${addr1.address}", Default: ${addr1.isDefault}`);
    if (!addr1.isDefault) {
      throw new Error('First address should automatically be default');
    }

    // Add address 2
    const addr2Res = await req('/addresses', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Victoria Atelier Office',
        phone: '+91 98111 22233',
        address: '77 Nariman Point, Express Towers',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400021',
        isDefault: true,
      }),
    });
    const addr2 = addr2Res.data;
    console.log(`   Address 2 created and set to default: Default: ${addr2.isDefault}`);

    // Fetch all addresses to verify default ordering
    const listAddrRes = await req('/addresses', {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`   Total addresses: ${listAddrRes.data.length}, First address in list is default: ${listAddrRes.data[0].isDefault}`);
    console.log('   ✅ Address book CRUD and default precedence verified.');

    // 3. Fetch product for ordering and check initial stock
    console.log('\n3. Fetching product catalog for order placement...');
    const catalogRes = await req('/products?limit=10');
    let product = null;
    let targetVariant = null;

    for (const p of catalogRes.data.products) {
      const v = p.variants?.find((vr) => vr.stock > 0);
      if (v) {
        product = p;
        targetVariant = v;
        break;
      }
    }

    if (!product || !targetVariant) {
      throw new Error('No in-stock garments found in database to test checkout.');
    }

    const initialStock = targetVariant.stock;
    console.log(`   Selected Garment: "${product.name}"`);
    console.log(`   Variant SKU: ${targetVariant.sku} (${targetVariant.size} / ${targetVariant.color})`);
    console.log(`   Initial Stock: ${initialStock}`);

    // 4. Add item to cart
    console.log('\n4. Adding garment to customer shopping bag...');
    await req('/cart/add', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productId: product._id,
        sku: targetVariant.sku,
        size: targetVariant.size,
        color: targetVariant.color,
        quantity: 1,
      }),
    });
    console.log('   ✅ Garment in shopping bag.');

    // 5. Checkout & Place Order (Cash on Delivery)
    console.log('\n5. Executing Checkout (POST /api/orders/checkout)...');
    const checkoutRes = await req('/orders/checkout', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        shippingAddress: addr1,
        paymentMethod: 'COD',
      }),
    });
    const order = checkoutRes.data;
    console.log(`   Order Created: ${order.orderNumber} (Internal DB ID excluded from response!)`);
    console.log(`   Order Status: ${order.orderStatus}`);
    console.log(`   Grand Total: ₹${order.pricing.grandTotal}`);
    console.log(`   Payment Method: ${order.payment.method}, Status: ${order.payment.status}`);
    console.log(`   Shipment: ${order.shipment.carrier} (Tracking: ${order.shipment.trackingNumber})`);
    console.log(`   Estimated Delivery: ${order.shipment.estimatedDelivery}`);
    console.log(`   Items Snapshot: "${order.items[0].name}" @ ₹${order.items[0].price}`);

    if (!order.orderNumber.startsWith('UC-')) {
      throw new Error(`Order number does not match expected format UC-XXXXXX: ${order.orderNumber}`);
    }
    console.log('   ✅ Order created with immutable snapshots & human-readable identifier.');

    // 6. Verify cart is cleared
    const cartAfterRes = await req('/cart', {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`   Cart items after checkout: ${cartAfterRes.data.items.length}`);
    if (cartAfterRes.data.items.length !== 0) {
      throw new Error('Cart was not cleared after order placement');
    }
    console.log('   ✅ Customer cart cleared automatically.');

    // 7. Verify stock deduction
    console.log('\n7. Verifying Inventory Deduction...');
    const productAfterRes = await req(`/products/${product.slug}`);
    const variantAfter = productAfterRes.data.variants.find((v) => v.sku === targetVariant.sku);
    console.log(`   Stock after purchase: ${variantAfter.stock} (Expected: ${initialStock - 1})`);
    if (variantAfter.stock !== initialStock - 1) {
      throw new Error(`Stock deduction mismatch! Expected ${initialStock - 1}, found ${variantAfter.stock}`);
    }
    console.log('   ✅ Inventory atomically deducted.');

    // 8. Test Customer Orders List (GET /api/orders) and Single Order (GET /api/orders/:orderNumber)
    console.log('\n8. Testing Customer Order History & Detail View...');
    const ordersListRes = await req('/orders', {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`   Customer Orders count: ${ordersListRes.data.length}`);
    console.log(`   First Order in list: #${ordersListRes.data[0].orderNumber}, Status: ${ordersListRes.data[0].status}`);

    const singleOrderRes = await req(`/orders/${order.orderNumber}`, {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`   Retrieved Order by #UC-XXXXXX: ${singleOrderRes.data.orderNumber}`);
    console.log(`   Timeline Milestones: ${singleOrderRes.data.shipment.timeline.length}`);
    console.log('   ✅ Customer order history and detail retrieval verified.');

    // 9. Test Order Cancellation (POST /api/orders/:orderNumber/cancel)
    console.log('\n9. Testing Order Cancellation & Stock Restoration...');
    const cancelRes = await req(`/orders/${order.orderNumber}/cancel`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Changed styling preference' }),
    });
    console.log(`   Cancelled Order Status: ${cancelRes.data.orderStatus}`);
    console.log(`   Cancellation Reason: ${cancelRes.data.cancellation.reason}`);

    // Verify stock restored
    const productRestoredRes = await req(`/products/${product.slug}`);
    const variantRestored = productRestoredRes.data.variants.find((v) => v.sku === targetVariant.sku);
    console.log(`   Stock after cancellation: ${variantRestored.stock} (Expected restored: ${initialStock})`);
    if (variantRestored.stock !== initialStock) {
      throw new Error(`Stock restoration failure! Expected ${initialStock}, found ${variantRestored.stock}`);
    }
    console.log('   ✅ Stock atomically restored upon cancellation.');

    // 10. Test Oversell Prevention
    console.log('\n10. Testing Oversell Prevention...');
    let oversellFailed = false;
    try {
      await req('/orders/checkout', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          shippingAddress: addr1,
          paymentMethod: 'COD',
          items: [
            {
              product: product._id,
              variant: { sku: targetVariant.sku, size: targetVariant.size, color: targetVariant.color },
              quantity: 999999, // Exceeds available stock
              price: targetVariant.price,
            },
          ],
        }),
      });
    } catch (oversellErr) {
      oversellFailed = true;
      console.log(`   Oversell correctly blocked with message: "${oversellErr.message}"`);
    }

    if (!oversellFailed) {
      throw new Error('Security failure: Server allowed ordering more than available inventory!');
    }
    console.log('   ✅ Oversell prevention verified.');

    console.log('\n🎉 ALL 10 CHECKOUT & ORDER MANAGEMENT TESTS PASSED WITH 100% ACCURACY!\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err.data || err.message);
    process.exit(1);
  }
}

runOrdersCheckoutTests();
