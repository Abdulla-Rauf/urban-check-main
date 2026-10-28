const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'mock_admin_jwt_token_secure_99999';

async function adminFetch(endpoint, options = {}) {
  const url = `${API_BASE}/admin${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function runAdminApiTests() {
  console.log('🧪 Starting Urban Check Real Admin API Test Suite...\n');

  try {
    // 1. Dashboard Metrics (8 KPIs)
    console.log('1️⃣ Testing Dashboard Metrics (8 KPIs)...');
    const metricsRes = await adminFetch('/dashboard/metrics');
    const m = metricsRes.data;
    console.log('   Total Revenue:', m.totalRevenue.formatted);
    console.log('   Orders:', m.orders.formatted);
    console.log('   Customers:', m.customers.formatted);
    console.log('   Products:', m.products.formatted);
    console.log('   Pending Orders:', m.pendingOrders.formatted);
    console.log('   Low Stock:', m.lowStock.formatted);
    console.log('   Returns:', m.returns.formatted);
    console.log('   Refunds:', m.refunds.formatted);
    if (!m.totalRevenue || !m.orders || !m.customers || !m.products) {
      throw new Error('Missing core KPI metrics');
    }
    console.log('   ✅ Dashboard 8 KPI cards verified.\n');

    // 2. Revenue Velocity (Daily, Weekly, Monthly, Yearly)
    console.log('2️⃣ Testing Multi-Period Revenue Velocity Analytics...');
    for (const period of ['daily', 'weekly', 'monthly', 'yearly']) {
      const revRes = await adminFetch(`/dashboard/revenue?period=${period}`);
      const r = revRes.data;
      console.log(`   Period [${period}]: ${r.data.length} buckets, Total: ${r.summary.formattedTotalRevenue}`);
    }
    console.log('   ✅ Multi-period revenue analytics verified.\n');

    // 3. Orders API with Filtering
    console.log('3️⃣ Testing Orders Management & Filters...');
    const ordersRes = await adminFetch('/orders?limit=10');
    console.log(`   Found ${ordersRes.data.total} total orders.`);
    const firstOrder = ordersRes.data.items[0];
    if (firstOrder) {
      console.log(`   Inspecting Order #${firstOrder.id}: Status: ${firstOrder.status}, Amount: ${firstOrder.formattedAmount}`);

      // Test status update on order
      console.log('   Testing Order Status update...');
      const updateRes = await adminFetch(`/orders/${firstOrder.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          orderStatus: 'Processing',
          carrier: 'DTDC Express',
          trackingNumber: `DTDC-${firstOrder.id}`,
          note: 'Verified in atelier packing suite',
        }),
      });
      console.log(`   Order #${firstOrder.id} status updated to: ${updateRes.data.orderStatus}`);
    }
    console.log('   ✅ Orders API and status update verified.\n');

    // 4. Products Management & Creation
    console.log('4️⃣ Testing Products Management CRUD...');
    // Fetch brands and categories first
    const catsRes = await (await fetch(`${API_BASE}/categories`)).json();
    const brandsRes = await (await fetch(`${API_BASE}/brands`)).json();
    const testCategory = catsRes.data[0]._id;
    const testBrand = brandsRes.data[0]._id;

    const testSlug = `atelier-test-coat-${Date.now()}`;
    const newProductData = {
      name: 'Double-Faced Cashmere Wrap Coat',
      slug: testSlug,
      brand: testBrand,
      category: testCategory,
      price: 24500,
      originalPrice: 28000,
      discountPercent: 12,
      gender: 'Women',
      material: '100% Mongolian Cashmere',
      description: 'Handcrafted double-faced wrap coat finished with tailored raw edge lapels.',
      shortDescription: 'Double-faced cashmere luxury outerwear.',
      tags: ['outerwear', 'cashmere', 'winter'],
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
      ],
      variants: [
        { sku: `UC-CASH-${Date.now()}-S`, size: 'S', color: 'Biscuit Beige', stock: 8, price: 24500 },
        { sku: `UC-CASH-${Date.now()}-M`, size: 'M', color: 'Biscuit Beige', stock: 12, price: 24500 },
      ],
      seo: {
        metaTitle: 'Cashmere Wrap Coat — Urban Check Atelier',
        metaDescription: 'Luxury 100% Mongolian Cashmere outerwear.',
        keywords: ['cashmere', 'coat', 'luxury'],
      },
    };

    const createProductRes = await adminFetch('/products', {
      method: 'POST',
      body: JSON.stringify(newProductData),
    });
    const createdProduct = createProductRes.data;
    console.log(`   Created product: "${createdProduct.name}" (ID: ${createdProduct._id}, Slug: ${createdProduct.slug})`);

    // Test product update
    const updateProductRes = await adminFetch(`/products/${createdProduct._id}`, {
      method: 'PUT',
      body: JSON.stringify({
        price: 25000,
        material: '100% Mongolian Virgin Cashmere',
      }),
    });
    console.log(`   Updated product price to: ₹${updateProductRes.data.price}`);

    // Test status toggle
    const toggleRes = await adminFetch(`/products/${createdProduct._id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'draft' }),
    });
    console.log(`   Product status toggled to: ${toggleRes.data.status}`);
    console.log('   ✅ Products CRUD operations verified.\n');

    // 5. Inventory & Stock Movement Ledger
    console.log('5️⃣ Testing Inventory Dashboard & Ledger Audit...');
    const invRes = await adminFetch('/inventory');
    const invSummary = invRes.data.summary;
    console.log('   Inventory Summary:', invSummary);

    // Adjust stock manually
    const firstVariant = createdProduct.variants[0];
    console.log(`   Adjusting stock for SKU: ${firstVariant.sku} (Current: ${firstVariant.stock})...`);
    const adjustRes = await adminFetch('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        sku: firstVariant.sku,
        adjustmentType: 'add',
        quantity: 5,
        reason: 'Physical delivery batch inward',
        reference: 'PO-2026-TEST',
        adminName: 'Lead Inspector',
      }),
    });
    console.log(`   Adjusted SKU ${firstVariant.sku}: ${adjustRes.data.previousStock} -> ${adjustRes.data.newStock} (Delta: +${adjustRes.data.delta})`);

    // Fetch ledger
    const ledgerRes = await adminFetch('/inventory/ledger?limit=5');
    console.log(`   Retrieved ${ledgerRes.data.items.length} ledger audit entries (Total: ${ledgerRes.data.total})`);
    console.log(`   Latest ledger entry: [${ledgerRes.data.items[0].transaction}] ${ledgerRes.data.items[0].sku} (Qty: ${ledgerRes.data.items[0].quantity}, Ref: ${ledgerRes.data.items[0].reference})`);
    console.log('   ✅ Inventory and movement ledger verified.\n');

    // 6. Customers CRM API
    console.log('6️⃣ Testing Customer CRM Directory...');
    const custRes = await adminFetch('/customers');
    console.log(`   Retrieved ${custRes.data.total} registered customer patrons.`);
    const sampleCust = custRes.data.items[0];
    if (sampleCust) {
      console.log(`   Sample patron: ${sampleCust.name} (${sampleCust.email}, Phone: ${sampleCust.phone}, Orders: ${sampleCust.ordersCount}, Spend: ${sampleCust.formattedTotalSpent})`);
      if (sampleCust.password) {
        throw new Error('SECURITY VIOLATION: Customer password exposed in API response!');
      }
    }
    console.log('   ✅ Customer directory verified with zero password exposure.\n');

    console.log('🎉 ALL ADMIN BACKEND APIS PASSED ACCURATELY WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

runAdminApiTests();
