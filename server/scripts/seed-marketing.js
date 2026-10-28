import { Banner } from '../src/models/Banner.js';
import { Offer } from '../src/models/Offer.js';
import { Coupon } from '../src/models/Coupon.js';
import { connectDatabase } from '../src/config/database.js';

async function seedMarketing() {
  try {
    console.log('Connecting to MongoDB for marketing seeding...');
    await connectDatabase();
    console.log('Connected to MongoDB.');

    // 1. Seed Banners
    await Banner.deleteMany({});
    console.log('Cleared existing banners.');

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 90);

    const banners = [
      {
        title: 'Autumn / Winter Atelier Drop',
        subtitle: 'Atelier Collection 2026',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
        cta: 'Explore Collection',
        targetType: 'Page',
        targetId: 'shop',
        targetUrl: '/shop',
        startDate: now,
        endDate: futureDate,
        displayOrder: 1,
        status: 'Active',
      },
      {
        title: 'The Tailored Edit',
        subtitle: 'Sculpted Silhouettes in Virgin Wool',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1287&auto=format&fit=crop',
        cta: 'Discover Outerwear',
        targetType: 'Category',
        targetId: 'outerwear',
        targetUrl: '/categories/outerwear',
        startDate: now,
        endDate: futureDate,
        displayOrder: 2,
        status: 'Active',
      },
      {
        title: 'The Weekend Edit',
        subtitle: 'Up to 40% Off Select Styles',
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop',
        cta: 'Shop The Edit',
        targetType: 'Offer',
        targetId: 'weekend-edit',
        targetUrl: '/offers',
        startDate: now,
        endDate: futureDate,
        displayOrder: 3,
        status: 'Active',
      },
    ];

    await Banner.insertMany(banners);
    console.log(`Seeded ${banners.length} marketing banners.`);

    // 2. Seed Offers
    await Offer.deleteMany({});
    console.log('Cleared existing offers.');

    const offers = [
      {
        title: 'Mid-Season Atelier Privilege',
        description: 'Complimentary 15% reduction across signature tailoring.',
        discount: 15,
        discountType: 'percentage',
        badgeText: '15% OFF',
        startDate: now,
        endDate: futureDate,
        status: 'active',
      },
      {
        title: 'Weekend Outerwear Courtesy',
        description: 'Selected wool and trench coats tailored for seasonal layering.',
        discount: 25,
        discountType: 'percentage',
        badgeText: '25% OFF',
        startDate: now,
        endDate: futureDate,
        status: 'active',
      },
    ];

    await Offer.insertMany(offers);
    console.log(`Seeded ${offers.length} promotional offers.`);

    // 3. Seed Coupons
    await Coupon.deleteMany({});
    console.log('Cleared existing coupons.');

    const expiredDate = new Date();
    expiredDate.setDate(now.getDate() - 2);

    const pastStart = new Date();
    pastStart.setDate(now.getDate() - 10);

    const coupons = [
      {
        couponCode: 'URBANFIRST',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrder: 3000,
        maximumDiscount: 1500,
        usageLimit: 1000,
        perUserLimit: 2,
        usedCount: 14,
        startDate: pastStart,
        endDate: futureDate,
        status: 'active',
      },
      {
        couponCode: 'ATELIER15',
        discountType: 'percentage',
        discountValue: 15,
        minimumOrder: 10000,
        maximumDiscount: 4000,
        usageLimit: 500,
        perUserLimit: 1,
        usedCount: 38,
        startDate: pastStart,
        endDate: futureDate,
        status: 'active',
      },
      {
        couponCode: 'FLAT500',
        discountType: 'fixed',
        discountValue: 500,
        minimumOrder: 4000,
        maximumDiscount: 500,
        usageLimit: 250,
        perUserLimit: 1,
        usedCount: 9,
        startDate: pastStart,
        endDate: futureDate,
        status: 'active',
      },
      {
        couponCode: 'EXPIRED20',
        discountType: 'percentage',
        discountValue: 20,
        minimumOrder: 2000,
        usageLimit: 100,
        perUserLimit: 1,
        usedCount: 4,
        startDate: pastStart,
        endDate: expiredDate, // Expired!
        status: 'active',
      },
      {
        couponCode: 'OVERUSED50',
        discountType: 'fixed',
        discountValue: 500,
        minimumOrder: 1000,
        usageLimit: 5,
        perUserLimit: 1,
        usedCount: 5, // Fully consumed!
        startDate: pastStart,
        endDate: futureDate,
        status: 'active',
      },
    ];

    await Coupon.insertMany(coupons);
    console.log(`Seeded ${coupons.length} coupons.`);

    console.log('Marketing seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('Marketing seed failed:', err);
    process.exit(1);
  }
}

seedMarketing();
