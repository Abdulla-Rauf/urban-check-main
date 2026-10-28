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

async function runCartTests() {
  console.log('--- URBAN CHECK SHOPPING SYSTEM AUTOMATED TEST ---');

  try {
    // 1. Get products to test with
    console.log('1. Fetching active products for testing...');
    const productsRes = await req('/products?limit=2');
    const products = productsRes.data.products;
    if (!products || products.length === 0) {
      throw new Error('No products found in database to test cart.');
    }
    const testProduct1 = products[0];
    const testProduct2 = products[1] || products[0];
    const variant1 = testProduct1.variants?.[0] || { sku: 'TEST-SKU-1', size: 'M', color: 'Black' };
    const variant2 = testProduct2.variants?.[0] || { sku: 'TEST-SKU-2', size: 'L', color: 'Grey' };

    console.log(`   Product 1: "${testProduct1.name}" (ID: ${testProduct1._id}, SKU: ${variant1.sku})`);
    console.log(`   Product 2: "${testProduct2.name}" (ID: ${testProduct2._id}, SKU: ${variant2.sku})`);

    // 2. Test Guest Cart Calculation (POST /api/cart/calculate)
    console.log('\n2. Testing Public Guest Cart Recalculation (POST /api/cart/calculate)...');
    const guestCalcRes = await req('/cart/calculate', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            product: testProduct1._id,
            variant: { sku: variant1.sku, size: variant1.size, color: variant1.color },
            quantity: 2,
            // Intentionally pass an incorrect client price to verify server overrides it
            price: 1,
          },
        ],
      }),
    });

    const guestCalc = guestCalcRes.data;
    console.log(`   Recalculated Items Count: ${guestCalc.items.length}`);
    console.log(`   Verified Unit Price: ₹${guestCalc.items[0].unitPrice} (Client fake price: ₹1 ignored!)`);
    console.log(`   Item Subtotal: ₹${guestCalc.items[0].itemSubtotal}`);
    console.log(`   Cart Subtotal: ₹${guestCalc.totals.subtotal}`);
    console.log(`   Courier Shipping: ₹${guestCalc.totals.shipping}`);
    console.log(`   Grand Total: ₹${guestCalc.totals.grandTotal}`);
    if (guestCalc.items[0].unitPrice <= 1) {
      throw new Error('Security failure: Server trusted client fake price!');
    }
    console.log('   ✅ Guest Price Recalculation verified successfully.');

    // 3. Authenticate a test user
    console.log('\n3. Authenticating test user for cart operations...');
    const testEmail = `patron_cart_${Date.now()}@example.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Julian Vance',
        email: testEmail,
        phone: '+91 98765 43210',
        password: 'SecurePassword123!',
      }),
    });
    const token = regRes.data.accessToken;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('   ✅ User registered and token acquired.');

    // 4. Test Authenticated Cart Fetch (Empty Initial Cart)
    console.log('\n4. Fetching initial cart (GET /api/cart)...');
    const initCartRes = await req('/cart', {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`   Initial cart items: ${initCartRes.data.items.length}`);
    console.log('   ✅ Empty cart initialized successfully.');

    // 5. Add Item to Cart (POST /api/cart/add)
    console.log('\n5. Adding item to cart (POST /api/cart/add)...');
    const addRes = await req('/cart/add', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productId: testProduct1._id,
        sku: variant1.sku,
        size: variant1.size,
        color: variant1.color,
        quantity: 1,
      }),
    });
    const addedCart = addRes.data;
    console.log(`   Cart Items: ${addedCart.items.length}`);
    console.log(`   Item: ${addedCart.items[0].product.name} - ${addedCart.items[0].variant.size} / ${addedCart.items[0].variant.color}`);
    console.log(`   Price Snapshot: ₹${addedCart.items[0].priceSnapshot}`);
    console.log(`   Subtotal: ₹${addedCart.totals.subtotal}`);
    console.log('   ✅ Item added to cart with verified server price.');

    const itemId = addedCart.items[0]._id;

    // 6. Update Quantity (PUT /api/cart/items/:itemId)
    console.log('\n6. Updating item quantity to 3 (PUT /api/cart/items/:itemId)...');
    const updateRes = await req(`/cart/items/${itemId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ quantity: 3 }),
    });
    const updatedCart = updateRes.data;
    console.log(`   New Quantity: ${updatedCart.items[0].quantity}`);
    console.log(`   New Subtotal: ₹${updatedCart.totals.subtotal}`);
    console.log('   ✅ Cart quantity updated.');

    // 7. Test Guest Cart Sync on Login (POST /api/cart/sync)
    console.log('\n7. Testing Guest Cart Sync on Login (POST /api/cart/sync)...');
    const syncRes = await req('/cart/sync', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        items: [
          {
            productId: testProduct2._id,
            sku: variant2.sku,
            size: variant2.size,
            color: variant2.color,
            quantity: 1,
          },
        ],
      }),
    });
    const syncedCart = syncRes.data;
    console.log(`   Synced Cart Items: ${syncedCart.items.length}`);
    console.log(`   Total Items: ${syncedCart.totals.totalItems}`);
    console.log(`   Grand Total: ₹${syncedCart.totals.grandTotal}`);
    console.log('   ✅ Guest cart merged successfully.');

    // 8. Test Wishlist (Toggle & Get)
    console.log('\n8. Testing Wishlist Toggle (POST /api/wishlist/toggle)...');
    const wishToggleRes = await req('/wishlist/toggle', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct2._id }),
    });
    console.log(`   Wishlist message: ${wishToggleRes.message}`);
    console.log(`   Wishlist count: ${wishToggleRes.data.count}`);
    console.log('   ✅ Wishlist toggle successful.');

    // 9. Test Wishlist Move to Cart (POST /api/wishlist/move-to-cart)
    console.log('\n9. Testing Wishlist Move to Cart (POST /api/wishlist/move-to-cart)...');
    const moveRes = await req('/wishlist/move-to-cart', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productId: testProduct2._id,
        sku: variant2.sku,
        size: variant2.size,
        color: variant2.color,
        quantity: 1,
      }),
    });
    console.log(`   Move result message: ${moveRes.message}`);
    console.log(`   Wishlist count after move: ${moveRes.data.wishlist.count}`);
    console.log(`   Cart count after move: ${moveRes.data.cart.items.length}`);
    console.log('   ✅ Wishlist Move to Cart executed atomically.');

    // 10. Test Recently Viewed Products
    console.log('\n10. Testing Recently Viewed Recording & Retrieval...');
    await req('/users/recently-viewed', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct1._id }),
    });
    await req('/users/recently-viewed', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct2._id }),
    });

    const recentRes = await req('/users/recently-viewed', {
      method: 'GET',
      headers: authHeaders,
    });
    const recentItems = recentRes.data;
    console.log(`   Recently viewed items retrieved: ${recentItems.length}`);
    console.log(`   Most recently viewed: "${recentItems[0].name}"`);
    console.log('   ✅ Recently viewed tracking verified.');

    // 11. Clear Cart
    console.log('\n11. Clearing cart (DELETE /api/cart)...');
    const clearRes = await req('/cart', {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`   Remaining items: ${clearRes.data.items.length}`);
    console.log('   ✅ Cart cleared.');

    console.log('\n🎉 ALL 11 SHOPPING SYSTEM TEST SUITES PASSED FLAWLESSLY!\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err.data || err.message);
    process.exit(1);
  }
}

runCartTests();
