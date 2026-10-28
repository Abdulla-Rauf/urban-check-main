import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product } from '../src/models/Product.js';
import { InventoryLedger } from '../src/models/InventoryLedger.js';

import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urban-check';

async function seedLedger() {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected.');

  const existingCount = await InventoryLedger.countDocuments({});
  console.log(`Current ledger entries count: ${existingCount}`);

  if (existingCount < 5) {
    const products = await Product.find({ status: { $ne: 'archived' } });
    console.log(`Found ${products.length} catalog products.`);

    for (const p of products) {
      for (const v of p.variants || []) {
        const stock = v.stock ?? 10;
        await InventoryLedger.create({
          sku: v.sku,
          product: p._id,
          productName: p.name,
          transaction: 'Initial Seed',
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          reference: 'Opening Stock Balance',
          admin: 'System',
          note: `Atelier initialization for ${p.name} (${v.size}/${v.color})`,
        });
        console.log(`Seeded ledger for SKU: ${v.sku}`);
      }
    }
  }

  const finalCount = await InventoryLedger.countDocuments({});
  console.log(`Final ledger entries count: ${finalCount}`);
  await mongoose.disconnect();
}

seedLedger().catch((err) => {
  console.error(err);
  process.exit(1);
});
