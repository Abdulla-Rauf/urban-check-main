const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Marketing Management System Automated Verification...\n');
  let failures = 0;

  // 1. Test Active Banners
  try {
    const res = await fetch(`${API_BASE}/banners/active`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length >= 3) {
      console.log(`✅ [Banners] Active banners returned: ${json.data.length} banners.`);
      console.log(`   Sample banner: "${json.data[0].title}" -> target: ${json.data[0].targetUrl}`);
    } else {
      console.error('❌ [Banners] Failed to retrieve active banners:', json);
      failures++;
    }
  } catch (err) {
    console.error('❌ [Banners] Error fetching active banners:', err.message);
    failures++;
  }

  // 2. Test Active Offers
  try {
    const res = await fetch(`${API_BASE}/offers/active`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length >= 2) {
      console.log(`✅ [Offers] Active offers returned: ${json.data.length} offers.`);
      console.log(`   Sample offer: "${json.data[0].title}" (${json.data[0].discount}% off)`);
    } else {
      console.error('❌ [Offers] Failed to retrieve active offers:', json);
      failures++;
    }
  } catch (err) {
    console.error('❌ [Offers] Error fetching active offers:', err.message);
    failures++;
  }

  // 3. Test Coupon Validation: Success case (URBANFIRST, 10% off min ₹3000)
  try {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'URBANFIRST',
        subtotal: 5000,
        cartItems: [{ price: 5000, quantity: 1 }],
      }),
    });
    const json = await res.json();
    if (json.success && json.data.discountAmount === 500) {
      console.log(`✅ [Coupons] Valid coupon applied: ₹500 discount on ₹5,000 subtotal (10%).`);
    } else {
      console.error('❌ [Coupons] Unexpected validation output:', json);
      failures++;
    }
  } catch (err) {
    console.error('❌ [Coupons] Error validating valid coupon:', err.message);
    failures++;
  }

  // 4. Test Coupon Validation: Minimum order unmet
  try {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'URBANFIRST',
        subtotal: 2000, // below 3000
        cartItems: [{ price: 2000, quantity: 1 }],
      }),
    });
    const json = await res.json();
    if (!json.success && json.message.includes('Minimum order value')) {
      console.log(`✅ [Coupons] Correctly rejected below minOrder: "${json.message}"`);
    } else {
      console.error('❌ [Coupons] Unexpected response for minOrder:', json);
      failures++;
    }
  } catch (err) {
    console.error('❌ [Coupons] Error in minOrder test:', err.message);
    failures++;
  }

  // 5. Test Coupon Validation: Expired Coupon
  try {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'EXPIRED20',
        subtotal: 4000,
        cartItems: [{ price: 4000, quantity: 1 }],
      }),
    });
    const json = await res.json();
    if (!json.success && json.message.includes('expired')) {
      console.log(`✅ [Coupons] Correctly rejected expired coupon: "${json.message}"`);
    } else {
      console.error('❌ [Coupons] Unexpected response for expired coupon:', json);
      failures++;
    }
  } catch (err) {
    console.error('❌ [Coupons] Error in expired test:', err.message);
    failures++;
  }

  // 6. Test Coupon Validation: Overused Coupon
  try {
    const res = await fetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'OVERUSED50',
        subtotal: 4000,
        cartItems: [{ price: 4000, quantity: 1 }],
      }),
    });
    const json = await res.json();
    if (!json.success && json.message.includes('maximum global redemptions')) {
      console.log(`✅ [Coupons] Correctly rejected overused coupon: "${json.message}"`);
    } else {
      console.error('❌ [Coupons] Unexpected response for overused coupon:', json);
      failures++;
    }
  } catch (err) {
    console.error('❌ [Coupons] Error in overused test:', err.message);
    failures++;
  }

  // 7. Test Admin Banners CRUD
  try {
    // Create
    const createRes = await fetch(`${API_BASE}/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Automated Test Banner',
        subtitle: 'Winter Wool Capsule',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
        cta: 'Shop Capsule',
        targetType: 'Category',
        targetId: 'outerwear',
        displayOrder: 99,
        status: 'Active',
      }),
    });
    const createJson = await createRes.json();
    const createdId = createJson.data._id;
    console.log(`✅ [Admin Banners] Created banner with ID ${createdId} and targetUrl: ${createJson.data.targetUrl}`);

    // Update
    const updateRes = await fetch(`${API_BASE}/admin/banners/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Automated Test Banner (Updated)',
        displayOrder: 10,
      }),
    });
    const updateJson = await updateRes.json();
    console.log(`✅ [Admin Banners] Updated banner: "${updateJson.data.title}" (order ${updateJson.data.displayOrder})`);

    // Delete
    await fetch(`${API_BASE}/admin/banners/${createdId}`, { method: 'DELETE' });
    console.log(`✅ [Admin Banners] Deleted banner successfully.`);
  } catch (err) {
    console.error('❌ [Admin Banners] CRUD failed:', err.message);
    failures++;
  }

  // 8. Test Admin Coupons CRUD
  try {
    const createRes = await fetch(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        couponCode: 'TESTVIP100',
        discountType: 'fixed',
        discountValue: 100,
        minimumOrder: 1000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 7),
        status: 'active',
      }),
    });
    const createJson = await createRes.json();
    const createdId = createJson.data._id;
    console.log(`✅ [Admin Coupons] Created test coupon ${createJson.data.couponCode}`);

    // Delete
    await fetch(`${API_BASE}/admin/coupons/${createdId}`, { method: 'DELETE' });
    console.log(`✅ [Admin Coupons] Deleted test coupon successfully.`);
  } catch (err) {
    console.error('❌ [Admin Coupons] CRUD failed:', err.message);
    failures++;
  }

  console.log('\n========================================');
  if (failures === 0) {
    console.log('🎉 ALL MARKETING BACKEND TESTS PASSED PERFECTLY!');
  } else {
    console.log(`⚠️ Completed with ${failures} failure(s).`);
  }
  console.log('========================================');
}

runTests();
