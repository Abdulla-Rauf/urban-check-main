import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'urban_check_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'urban_check_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    adminSecret: process.env.ADMIN_JWT_SECRET || 'urban_check_admin_jwt_secret',
    adminExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1d',
  },
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/urban_check',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'Urban Check Concierge <concierge@urbancheck.com>',
  },
  payment: {
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || '',
      keySecret: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
  },
  shipping: {
    dtdc: {
      apiKey: process.env.DTDC_API_KEY || '',
      customerId: process.env.DTDC_CUSTOMER_ID || '',
      apiUrl: process.env.DTDC_API_URL || 'https://api.dtdc.in/v1',
    },
    delhivery: {
      apiKey: process.env.DELHIVERY_API_KEY || '',
      clientId: process.env.DELHIVERY_CLIENT_ID || '',
      apiUrl: process.env.DELHIVERY_API_URL || 'https://track.delhivery.com/api',
    },
  },
};

// Security assertion in production
if (config.nodeEnv === 'production') {
  if (
    config.jwt.secret === 'urban_check_jwt_secret' ||
    config.jwt.adminSecret === 'urban_check_admin_jwt_secret'
  ) {
    console.warn(
      '⚠️  [SECURITY WARNING] Production environment detected with default JWT secrets. Please set strong unique secrets in environment variables.'
    );
  }
}

