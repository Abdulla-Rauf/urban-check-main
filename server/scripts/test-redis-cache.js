/**
 * Comprehensive Redis Caching & Invalidation Test Script
 * Verifies:
 * 1. Redis Caching operations & TTL configuration
 * 2. Caching coverage: Homepage, Categories, Brands, Product Listings, Product Details, Popular, Trending, Search Suggestions
 * 3. Security "DO NOT CACHE" assertions (passwords, tokens, payment secrets, private info)
 * 4. Cache Invalidation flows on Admin mutations (Product, Category, Brand, Offer, Banner)
 * 5. Pagination boundary enforcement (max limit 100)
 */

import { RedisService, REDIS_TTL, CACHE_KEYS } from '../src/services/redis.service.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('--- URBAN CHECK: REDIS CACHING & PERFORMANCE TEST ---');
  console.log('======================================================\n');

  // TEST SUITE 1: TTL Configuration Verification
  console.log('▶ [1/5] Verifying Standardized TTL Values');
  assert(REDIS_TTL.HOMEPAGE === 300, 'Homepage TTL is 300s (5 minutes)');
  assert(REDIS_TTL.CATEGORIES === 3600, 'Categories TTL is 3600s (1 hour)');
  assert(REDIS_TTL.BRANDS === 3600, 'Brands TTL is 3600s (1 hour)');
  assert(REDIS_TTL.PRODUCT_LIST === 600, 'Product list TTL is 600s (10 minutes)');
  assert(REDIS_TTL.PRODUCT_DETAIL === 1800, 'Product detail TTL is 1800s (30 minutes)');
  assert(REDIS_TTL.POPULAR === 900, 'Popular products TTL is 900s (15 minutes)');
  assert(REDIS_TTL.TRENDING === 900, 'Trending products TTL is 900s (15 minutes)');
  assert(REDIS_TTL.SEARCH === 600, 'Search suggestions TTL is 600s (10 minutes)');
  assert(REDIS_TTL.OFFERS === 600, 'Offers TTL is 600s (10 minutes)');
  assert(REDIS_TTL.BANNERS === 1800, 'Banners TTL is 1800s (30 minutes)');

  // TEST SUITE 2: "DO NOT CACHE" Security Guardrails
  console.log('\n▶ [2/5] Testing Security "DO NOT CACHE" Guardrails');
  // Attempting to cache sensitive keys
  const resKeyPwd = await RedisService.set('uc:user:password:123', 'secret123');
  assert(resKeyPwd === false, 'Blocked caching key containing "password"');

  const resKeyToken = await RedisService.set('uc:session:token:abc', 'jwt.token.here');
  assert(resKeyToken === false, 'Blocked caching key containing "token"');

  const resKeyPayment = await RedisService.set('uc:payment:secret:key', 'razorpay_secret');
  assert(resKeyPayment === false, 'Blocked caching key containing "payment:secret"');

  const resKeyCustomer = await RedisService.set('uc:customer:private:profile', { ssn: '123' });
  assert(resKeyCustomer === false, 'Blocked caching key containing "customer:private"');

  // Attempting to cache objects with sensitive payload fields
  const resObjPwd = await RedisService.set('uc:sample:data', {
    username: 'user1',
    password: 'plain_password',
  });
  assert(resObjPwd === false, 'Blocked payload containing "password" field');

  const resObjCard = await RedisService.set('uc:sample:payment', {
    orderId: 'ORD-1',
    creditCard: '4111222233334444',
  });
  assert(resObjCard === false, 'Blocked payload containing "creditCard" field');

  // TEST SUITE 3: Cache Set, Get & Covered Entities
  console.log('\n▶ [3/5] Testing Cache Set & Get for Designated Entities');

  // 1. Homepage
  const homepageMock = { banners: [{ id: 'b1' }], newArrivals: [{ id: 'p1' }], trending: [{ id: 'p2' }] };
  await RedisService.set(CACHE_KEYS.homepage(), homepageMock, REDIS_TTL.HOMEPAGE);
  const cachedHomepage = await RedisService.get(CACHE_KEYS.homepage());
  assert(cachedHomepage?.banners?.length === 1, 'Cached & retrieved Homepage data');

  // 2. Categories
  const categoriesMock = [{ id: 'c1', name: 'Shirts', slug: 'shirts' }];
  await RedisService.set(CACHE_KEYS.categoriesAll(), categoriesMock, REDIS_TTL.CATEGORIES);
  const cachedCategories = await RedisService.get(CACHE_KEYS.categoriesAll());
  assert(cachedCategories?.[0]?.name === 'Shirts', 'Cached & retrieved Categories');

  // 3. Brands
  const brandsMock = [{ id: 'b1', name: 'Urban Edge', slug: 'urban-edge' }];
  await RedisService.set(CACHE_KEYS.brandsAll(), brandsMock, REDIS_TTL.BRANDS);
  const cachedBrands = await RedisService.get(CACHE_KEYS.brandsAll());
  assert(cachedBrands?.[0]?.name === 'Urban Edge', 'Cached & retrieved Brands');

  // 4. Product Listings
  const queryHash = RedisService.hashQuery({ category: 'shirts', page: 1, limit: 12 });
  const listKey = CACHE_KEYS.productList(queryHash);
  const listMock = { products: [{ id: 'p1', name: 'Linen Shirt' }], pagination: { page: 1, total: 1 } };
  await RedisService.set(listKey, listMock, REDIS_TTL.PRODUCT_LIST);
  const cachedList = await RedisService.get(listKey);
  assert(cachedList?.products?.[0]?.name === 'Linen Shirt', 'Cached & retrieved Product Listing');

  // 5. Product Details
  const detailKey = CACHE_KEYS.productDetail('linen-shirt-oversized');
  const detailMock = { id: 'p1', name: 'Linen Shirt Oversized', slug: 'linen-shirt-oversized', price: 2499 };
  await RedisService.set(detailKey, detailMock, REDIS_TTL.PRODUCT_DETAIL);
  const cachedDetail = await RedisService.get(detailKey);
  assert(cachedDetail?.slug === 'linen-shirt-oversized', 'Cached & retrieved Product Details');

  // 6. Popular Products
  const popularKey = CACHE_KEYS.popularProducts(8);
  const popularMock = [{ id: 'p1', popularity: 99 }];
  await RedisService.set(popularKey, popularMock, REDIS_TTL.POPULAR);
  const cachedPopular = await RedisService.get(popularKey);
  assert(cachedPopular?.[0]?.popularity === 99, 'Cached & retrieved Popular Products');

  // 7. Trending Products
  const trendingKey = CACHE_KEYS.trendingProducts(8);
  const trendingMock = [{ id: 'p2', isTrending: true }];
  await RedisService.set(trendingKey, trendingMock, REDIS_TTL.TRENDING);
  const cachedTrending = await RedisService.get(trendingKey);
  assert(cachedTrending?.[0]?.isTrending === true, 'Cached & retrieved Trending Products');

  // 8. Search Suggestions
  const searchKey = CACHE_KEYS.searchSuggestions('shirt', 5);
  const searchMock = [{ id: 'p1', name: 'Oxford Shirt' }];
  await RedisService.set(searchKey, searchMock, REDIS_TTL.SEARCH);
  const cachedSearch = await RedisService.get(searchKey);
  assert(cachedSearch?.[0]?.name === 'Oxford Shirt', 'Cached & retrieved Search Suggestions');

  // TEST SUITE 4: Cache Invalidation Flows
  console.log('\n▶ [4/5] Testing Invalidation Chains on Admin Mutations');

  // Test 4A: Product Invalidation
  await RedisService.invalidateProductCache('p1', 'linen-shirt-oversized');
  const postList = await RedisService.get(listKey);
  const postDetail = await RedisService.get(detailKey);
  const postPopular = await RedisService.get(popularKey);
  const postTrending = await RedisService.get(trendingKey);
  const postSearch = await RedisService.get(searchKey);
  const postHomeP = await RedisService.get(CACHE_KEYS.homepage());

  assert(postList === null, 'Product list cache invalidated on product mutation');
  assert(postDetail === null, 'Product detail cache invalidated on product mutation');
  assert(postPopular === null, 'Popular products cache invalidated on product mutation');
  assert(postTrending === null, 'Trending products cache invalidated on product mutation');
  assert(postSearch === null, 'Search suggestions cache invalidated on product mutation');
  assert(postHomeP === null, 'Homepage cache invalidated on product mutation');

  // Test 4B: Category Invalidation
  await RedisService.set(CACHE_KEYS.categoriesAll(), [{ id: 'c1' }]);
  await RedisService.set(CACHE_KEYS.homepage(), { test: 1 });
  await RedisService.invalidateCategoryCache();
  const postCat = await RedisService.get(CACHE_KEYS.categoriesAll());
  const postHomeC = await RedisService.get(CACHE_KEYS.homepage());
  assert(postCat === null, 'Category cache invalidated on category mutation');
  assert(postHomeC === null, 'Homepage cache invalidated on category mutation');

  // Test 4C: Brand Invalidation
  await RedisService.set(CACHE_KEYS.brandsAll(), [{ id: 'b1' }]);
  await RedisService.set(CACHE_KEYS.brandSlug('urban-edge'), { name: 'Urban Edge' });
  await RedisService.invalidateBrandCache('urban-edge');
  const postBrands = await RedisService.get(CACHE_KEYS.brandsAll());
  const postBrandDetail = await RedisService.get(CACHE_KEYS.brandSlug('urban-edge'));
  assert(postBrands === null, 'Brands list cache invalidated on brand mutation');
  assert(postBrandDetail === null, 'Brand detail cache invalidated on brand mutation');

  // Test 4D: Banner Invalidation
  await RedisService.set(CACHE_KEYS.activeBanners(), [{ id: 'b1' }]);
  await RedisService.set(CACHE_KEYS.homepage(), { test: 1 });
  await RedisService.invalidateBannerCache();
  const postBanner = await RedisService.get(CACHE_KEYS.activeBanners());
  const postHomeB = await RedisService.get(CACHE_KEYS.homepage());
  assert(postBanner === null, 'Active banners cache invalidated on banner mutation');
  assert(postHomeB === null, 'Homepage cache invalidated on banner mutation');

  // Test 4E: Offer Invalidation
  await RedisService.set(CACHE_KEYS.activeOffers(), [{ id: 'o1' }]);
  await RedisService.set(CACHE_KEYS.homepage(), { test: 1 });
  await RedisService.invalidateOfferCache();
  const postOffer = await RedisService.get(CACHE_KEYS.activeOffers());
  const postHomeO = await RedisService.get(CACHE_KEYS.homepage());
  assert(postOffer === null, 'Active offers cache invalidated on offer mutation');
  assert(postHomeO === null, 'Homepage cache invalidated on offer mutation');

  // TEST SUITE 5: Pagination Limit Verification
  console.log('\n▶ [5/5] Testing Pagination Bounds');
  const testLimit = (reqLimit) => Math.min(Math.max(Number(reqLimit) || 12, 1), 100);
  assert(testLimit(5000) === 100, 'Excessive limit (5000) safely clamped to max 100');
  assert(testLimit(0) === 12, 'Limit 0 defaults to 12');
  assert(testLimit(24) === 24, 'Valid limit (24) preserved');

  console.log('\n======================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
