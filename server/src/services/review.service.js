import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';

export class ReviewService {
  /**
   * Verified review submission
   * Strictly enforces that only customers who purchased the product can post.
   */
  static async createReview(userId, { productId, rating, title, comment, images = [] }) {
    if (!productId || !rating || !title || !comment) {
      throw new Error('Product, rating, title, and comment are required.');
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }

    // 1. Verify that customer purchased this product
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: { $in: ['Delivered', 'Confirmed', 'Packed', 'Shipped', 'OutForDelivery', 'Processing'] },
    }).sort({ createdAt: -1 });

    if (!order) {
      throw new Error('Only patrons who have purchased this garment may submit an appraisal.');
    }

    // 2. Fetch User name
    const user = await User.findById(userId).select('name');
    const authorName = user?.name || 'Verified Patron';

    // 3. Create or update review
    let review = await Review.findOne({ user: userId, product: productId });
    if (review) {
      review.rating = numRating;
      review.title = title.trim();
      review.comment = comment.trim();
      review.images = Array.isArray(images) ? images : [];
      review.order = order._id;
      review.orderNumber = order.orderNumber;
      review.status = 'Approved'; // Auto-publish verified reviews
      await review.save();
    } else {
      review = await Review.create({
        product: productId,
        user: userId,
        order: order._id,
        orderNumber: order.orderNumber,
        authorName,
        rating: numRating,
        title: title.trim(),
        comment: comment.trim(),
        images: Array.isArray(images) ? images : [],
        isVerifiedPurchase: true,
        status: 'Approved',
      });
    }

    // 4. Update Product aggregate rating statistics
    await this.recalculateProductRatings(productId);

    return review;
  }

  /**
   * Recalculates average rating and review counts on Product
   */
  static async recalculateProductRatings(productId) {
    try {
      const stats = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId), status: 'Approved' } },
        {
          $group: {
            _id: '$product',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ]);

      const avg = stats.length > 0 ? Math.round(stats[0].averageRating * 10) / 10 : 5;
      const count = stats.length > 0 ? stats[0].reviewCount : 0;

      await Product.findByIdAndUpdate(productId, {
        rating: avg,
        reviewCount: count,
      });
    } catch (err) {
      console.warn('Failed to update product rating aggregate:', err.message);
    }
  }

  /**
   * Check if authenticated customer is eligible to review product
   */
  static async canUserReview(userId, productId) {
    if (!userId || !productId) return { canReview: false, reason: 'Unauthenticated or invalid product' };

    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: { $ne: 'Cancelled' },
    }).select('orderNumber createdAt orderStatus');

    if (!order) {
      return {
        canReview: false,
        reason: 'Requires verified purchase history for this garment.',
      };
    }

    const existingReview = await Review.findOne({ user: userId, product: productId });

    return {
      canReview: true,
      hasReviewed: Boolean(existingReview),
      orderNumber: order.orderNumber,
      existingReview,
    };
  }

  /**
   * Public: Retrieve approved reviews for a product with breakdown
   */
  static async getProductReviews(productIdOrSlug, { page = 1, limit = 10 } = {}) {
    let productDoc;
    if (String(productIdOrSlug).match(/^[0-9a-fA-F]{24}$/)) {
      productDoc = await Product.findById(productIdOrSlug).select('_id name');
    } else {
      productDoc = await Product.findOne({ slug: productIdOrSlug }).select('_id name');
    }

    if (!productDoc) {
      return { reviews: [], total: 0, averageRating: 5, breakdown: {} };
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const [reviews, total, aggregate] = await Promise.all([
      Review.find({ product: productDoc._id, status: 'Approved' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Review.countDocuments({ product: productDoc._id, status: 'Approved' }),
      Review.aggregate([
        { $match: { product: productDoc._id, status: 'Approved' } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    aggregate.forEach((item) => {
      breakdown[item._id] = item.count;
      sum += item._id * item.count;
    });

    const averageRating = total > 0 ? Math.round((sum / total) * 10) / 10 : 5;

    return {
      reviews: reviews.map((r) => ({
        id: r._id,
        author: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images || [],
        isVerifiedPurchase: r.isVerifiedPurchase,
        createdAt: r.createdAt,
        adminReply: r.adminReply?.comment ? r.adminReply : null,
      })),
      total,
      averageRating,
      breakdown,
      page: Math.max(1, parseInt(page, 10)),
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  /**
   * Customer: Get my reviews
   */
  static async getCustomerReviews(userId) {
    const reviews = await Review.find({ user: userId })
      .populate('product', 'name slug thumbnail images price')
      .sort({ createdAt: -1 })
      .lean();

    return reviews.map((r) => ({
      id: r._id,
      product: r.product,
      orderNumber: r.orderNumber,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: r.images,
      status: r.status,
      createdAt: r.createdAt,
      adminReply: r.adminReply?.comment ? r.adminReply : null,
    }));
  }

  /**
   * Admin: Paginated review list with moderation filters
   */
  static async getAdminReviews({ page = 1, limit = 15, status = 'all', rating = 'all', search = '' }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const take = Math.max(1, parseInt(limit, 10));

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (rating && rating !== 'all') {
      query.rating = Number(rating);
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { comment: regex }, { authorName: regex }, { orderNumber: regex }];
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('product', 'name thumbnail price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Review.countDocuments(query),
    ]);

    return {
      reviews: reviews.map((r) => ({
        id: r._id,
        product: r.product?.name || 'Garment Item',
        productId: r.product?._id,
        customer: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        isVerifiedPurchase: r.isVerifiedPurchase,
        orderNumber: r.orderNumber,
        status: r.status,
        date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
        adminReply: r.adminReply,
      })),
      pagination: {
        page: Math.max(1, parseInt(page, 10)),
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Admin: Approve, Hide, or Moderate review
   */
  static async updateReviewStatus(reviewId, { status, adminReply = '', adminName = 'Concierge Moderator' }) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found.');

    if (status) {
      if (!['Approved', 'Hidden', 'Pending'].includes(status)) {
        throw new Error('Invalid review status.');
      }
      review.status = status;
    }

    if (adminReply && adminReply.trim()) {
      review.adminReply = {
        comment: adminReply.trim(),
        repliedAt: new Date(),
        repliedBy: adminName,
      };
    }

    await review.save();
    await this.recalculateProductRatings(review.product);

    return review;
  }

  /**
   * Admin: Delete review
   */
  static async deleteReview(reviewId) {
    const review = await Review.findById(reviewId);
    if (!review) throw new Error('Review not found.');

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);
    await this.recalculateProductRatings(productId);

    return { success: true, message: 'Review deleted successfully.' };
  }

  /**
   * Upvote a review as helpful
   */
  static async voteHelpful(reviewId) {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulVotes: 1 } },
      { new: true }
    );
    if (!review) throw new Error('Review not found.');
    return { helpfulVotes: review.helpfulVotes };
  }
}

