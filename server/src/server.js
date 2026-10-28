import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { seedInitialRolesAndPermissions } from './utils/seedData.js';
import { seedCatalogIfEmpty } from './utils/seedCatalog.js';

const PORT = config.port;

const startServer = async () => {
  try {
    // Initialize Database
    await connectDatabase();
    
    // Seed initial system roles and permissions if connected
    if (mongoose.connection.readyState === 1) {
      await seedInitialRolesAndPermissions();
      await seedCatalogIfEmpty();
    }

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`✨ Urban Check API server active in [${config.nodeEnv}] mode`);
      console.log(`🔗 API Base URL:  http://localhost:${PORT}/api`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🛍️  Customer URL: ${config.cors.clientUrl}`);
      console.log(`🛡️  Admin URL:    ${config.cors.adminUrl}`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (err) {
    console.error('❌ Server startup failure:', err);
    process.exit(1);
  }
};

startServer();
