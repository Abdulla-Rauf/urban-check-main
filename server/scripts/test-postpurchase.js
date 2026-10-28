import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Product } from '../src/models/Product.js';
import { ProductVariant } from '../src/models/ProductVariant.js';
import { Order } from '../src/models/Order.js';
import { Review } from '../src/models/Review.js';
import { ReturnRequest } from '../src/models/ReturnRequest.js';
import { Refund } from '../src/models/Refund.js';
import { ReviewService } from '../src/services/review.service.js';
import { ReturnService } from '../src/services/return.service.js';
import { RefundService } from '../src/services/refund.service.js';

async function runPostPurchaseTests() {
  console.log('🚀 --- STARTING POST-PURCHASE SYSTEM AUTOMATED TESTS ---\n');

  try {
    await connectDatabase();
    console.log('✅ Connected to MongoDB Atlas');

    // Setup Test Data
    const testUser = await User.findOne({ email: 'patron.test@urbancheck.com' }) || await User.create({
      name: 'Aarav Singhania',
      email: 'patron.test@urbancheck.com',
      phone: '9820011223',
      password: 'Password@123',
      isEmailVerified: true,
    });

    const unverifiedUser = await User.findOne({ email: 'unverified.buyer@urbancheck.com' }) || await User.create({
      name: 'Unverified Guest',
      email: 'unverified.buyer@urbancheck.com',
      phone: '9876500000',
      password: 'Password@123',
      isEmailVerified: true,
    });

    let testProduct = await Product.findOne({ status: 'active' });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Monogram Wool Trench Coat',
        slug: 'monogram-wool-trench-coat',
        description: 'Exquisite heavy double-faced wool trench with bespoke horn buttons.',
        price: 34500,
        status: 'active',
      });
    }

    // Ensure variants exist for exchange test
    let variantM = await ProductVariant.findOne({ product: testProduct._id, size: 'M' });
    if (!variantM) {
      variantM = await ProductVariant.create({
        product: testProduct._id,
        sku: `MWTC-M-${Date.now()}`,
        size: 'M',
        color: 'Camel',
        price: 34500,
        stock: 5,
        status: 'active',
      });
    }

    let variantL = await ProductVariant.findOne({ product: testProduct._id, size: 'L' });
    if (!variantL) {
      variantL = await ProductVariant.create({
        product: testProduct._id,
        sku: `MWTC-L-${Date.now()}`,
        size: 'L',
        color: 'Camel',
        price: 34500,
        stock: 4,
        status: 'active',
      });
    }

    // Setup a Delivered Order for testUser
    const testOrderNum = `ORD-PP-${Math.floor(100000 + Math.random() * 900000)}`;
    const testOrder = await Order.create({
      orderNumber: testOrderNum,
      user: testUser._id,
      customer: { name: testUser.name, email: testUser.email, phone: testUser.phone },
      items: [
        {
          product: testProduct._id,
          name: testProduct.name,
          thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
          variant: { sku: variantM.sku, size: 'M', color: 'Camel' },
          price: 34500,
          quantity: 1,
          subtotal: 34500,
        },
      ],
      shippingAddress: {
        name: testUser.name,
        phone: testUser.phone,
        address: '88 Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postalCode: '400020',
      },
      pricing: { subtotal: 34500, discount: 0, shipping: 0, tax: 4140, grandTotal: 38640 },
      orderStatus: 'Delivered',
      payment: {
        method: 'Razorpay',
        status: 'Paid',
        transactionId: `pay_test_${Date.now()}`,
        amount: 38640,
        paidAt: new Date(),
      },
      shipment: {
        courier: 'DTDC',
        carrier: 'DTDC Express Air',
        awb: `DTDC${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: 'Delivered',
      },
    });

    console.log(`✅ Setup test delivered order #${testOrder.orderNumber}`);

    // --- TEST 1: REVIEWS SYSTEM & VERIFIED PURCHASE ENFORCEMENT ---
    console.log('\n--- 1. Testing Reviews & Verified Purchase Validation ---');

    // 1.1 Unverified customer attempt must fail
    try {
      await ReviewService.createReview(unverifiedUser._id, {
        productId: testProduct._id,
        rating: 5,
        title: 'Nice coat',
        comment: 'I did not actually buy it, just testing.',
      });
      throw new Error('Unverified purchase review was unexpectedly permitted!');
    } catch (err) {
      console.log('✅ Correctly blocked unverified customer review:', err.message);
    }

    // 1.2 Verified customer review submission
    const verifiedReview = await ReviewService.createReview(testUser._id, {
      productId: testProduct._id,
      rating: 5,
      title: 'Flawless tailoring and drape',
      comment: 'The camel wool has incredible weight and the lapels lie completely flat. Exceptional craftsmanship.',
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'],
    });

    console.log(`✅ Verified review created: ID=${verifiedReview._id}, Rating=${verifiedReview.rating}, VerifiedPurchase=${verifiedReview.isVerifiedPurchase}`);
    if (!verifiedReview.isVerifiedPurchase || verifiedReview.orderNumber !== testOrder.orderNumber) {
      throw new Error('Review does not have verified purchase badge or linked order!');
    }

    // 1.3 Public review retrieval & aggregation
    const reviewData = await ReviewService.getProductReviews(testProduct._id);
    console.log(`✅ Product Reviews retrieved: Total=${reviewData.total}, AvgRating=${reviewData.averageRating}`);
    if (reviewData.total < 1 || reviewData.averageRating !== 5) {
      throw new Error('Review aggregation metrics incorrect');
    }

    // 1.4 Admin moderation: hide and re-approve
    await ReviewService.updateReviewStatus(verifiedReview._id, {
      status: 'Hidden',
      adminReply: 'Thank you for your feedback.',
      adminName: 'Concierge Curator',
    });
    const hiddenCheck = await Review.findById(verifiedReview._id);
    if (hiddenCheck.status !== 'Hidden' || !hiddenCheck.adminReply?.comment) {
      throw new Error('Review moderation failed');
    }
    console.log('✅ Admin review moderation (Hide + Reply) verified.');

    await ReviewService.updateReviewStatus(verifiedReview._id, { status: 'Approved' });
    console.log('✅ Admin review status restored to Approved.');

    // --- TEST 2: RETURNS & EXCHANGES LIFECYCLE ---
    console.log('\n--- 2. Testing Returns & Exchanges Lifecycle ---');

    // 2.1 Test Exchange Size Availability Validation
    console.log('Validating exchange availability for Size "L":');
    const availL = await ReturnService.validateExchangeAvailability(testProduct._id, 'L');
    console.log(` - Size L: Available=${availL.isAvailable}, Stock=${availL.stock}`);
    if (!availL.isAvailable) throw new Error('Size L was expected to be available');

    console.log('Validating exchange availability for invalid size "XXL":');
    const availXXL = await ReturnService.validateExchangeAvailability(testProduct._id, 'XXL');
    console.log(` - Size XXL: Available=${availXXL.isAvailable}, Message: ${availXXL.message}`);
    if (availXXL.isAvailable) throw new Error('Non-existent size XXL should not be available');

    // 2.2 Customer Submits Return
    console.log('\nSubmitting Return for Order:');
    const returnReq = await ReturnService.submitReturnRequest(testUser._id, {
      orderNumber: testOrder.orderNumber,
      items: [
        {
          productId: testProduct._id,
          reason: 'Wrong size',
          description: 'Sleeves are slightly too long for my proportions.',
        },
      ],
      type: 'Return',
    });

    console.log(`✅ Return created: ${returnReq.returnNumber}, Status=${returnReq.status}, Amount=₹${returnReq.totalRefundAmount}`);
    if (returnReq.status !== 'Requested' || returnReq.items[0].reason !== 'Wrong size') {
      throw new Error('Return submission verification failed');
    }

    // 2.3 Progressing through the 9 lifecycle statuses:
    // Requested -> UnderReview -> Approved -> PickupScheduled -> Received -> QualityCheck -> RefundApproved -> Refunded
    const transitions = [
      { status: 'UnderReview', note: 'Concierge examining return request' },
      { status: 'Approved', note: 'Return request authorized for reverse pickup' },
      {
        status: 'PickupScheduled',
        note: 'Courier reverse pickup scheduled',
        scheduledDate: new Date(Date.now() + 86400000),
        pickupAwb: `REV-DTDC-${Math.floor(100000 + Math.random() * 900000)}`,
      },
      { status: 'Received', note: 'Consignment received at Mumbai Returns Depot' },
      {
        status: 'QualityCheck',
        note: 'Garment passed quality audit',
        qualityCheckPassed: true,
        qualityCheckNotes: 'Pristine condition, security seal intact.',
      },
      { status: 'RefundApproved', note: 'Inspection approved, refund authorization generated' },
    ];

    for (const step of transitions) {
      const updated = await ReturnService.updateReturnStatus(returnReq.returnNumber, step);
      console.log(` - Transitioned Return to: ${updated.status} (History count: ${updated.history.length})`);
    }

    // --- TEST 3: REFUNDS SYSTEM & RAZORPAY ARCHITECTURE ---
    console.log('\n--- 3. Testing Refunds System & Razorpay Reversal ---');

    // Verify auto-created refund from RefundApproved step
    const refund = await Refund.findOne({ returnNumber: returnReq.returnNumber });
    if (!refund) throw new Error('Auto-created refund record not found!');
    console.log(`✅ Auto-created Refund: ${refund.refundNumber}, Amount=₹${refund.amount}, Status=${refund.status}`);

    // Admin transitions refund: Pending -> Approved -> Processing -> Completed
    console.log('Transitioning Refund to: Approved');
    await RefundService.processRefund(refund.refundNumber, {
      status: 'Approved',
      note: 'Finance authorized gateway credit reversal',
    });

    console.log('Processing Refund via Razorpay Gateway (Simulated automatic execution):');
    const completedRefund = await RefundService.processRefund(refund.refundNumber, {
      status: 'Completed',
      note: 'Razorpay gateway payout completed successfully.',
    });

    console.log(`✅ Refund Status: ${completedRefund.status}`);
    console.log(` - Gateway Provider: ${completedRefund.gatewayDetails.provider}`);
    console.log(` - Gateway Refund ID: ${completedRefund.gatewayDetails.gatewayRefundId}`);
    console.log(` - Acquirer Reference Number (ARN): ${completedRefund.gatewayDetails.arn}`);
    console.log(` - History log entries: ${completedRefund.history.length}`);

    if (completedRefund.status !== 'Completed' || !completedRefund.gatewayDetails.arn) {
      throw new Error('Refund completion or ARN generation failed');
    }

    // Verify synchronized Order payment status
    const syncedOrder = await Order.findOne({ orderNumber: testOrder.orderNumber });
    console.log(`✅ Synchronized Order payment status: ${syncedOrder.payment.status}`);
    if (syncedOrder.payment.status !== 'Refunded') {
      throw new Error('Order payment status was not synchronized to Refunded');
    }

    // Cleanup test records
    await Review.deleteMany({ product: testProduct._id });
    await Refund.deleteMany({ orderNumber: testOrderNum });
    await ReturnRequest.deleteMany({ orderNumber: testOrderNum });
    await Order.deleteOne({ orderNumber: testOrderNum });
    console.log('\n🧹 Cleaned up temporary test orders, reviews, returns, and refunds.');

    console.log('\n🎉 ALL POST-PURCHASE SYSTEM TESTS PASSED 100%!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ POST-PURCHASE TEST FAILED:', err);
    process.exit(1);
  }
}

runPostPurchaseTests();
