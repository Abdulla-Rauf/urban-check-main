import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_STORE = {
  products: [],
  categories: [],
  brands: [],
  banners: [],
  offers: [],
  orders: [],
};

class LocalStore {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(STORE_FILE)) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_STORE, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('LocalStore init warning:', e.message);
    }
  }

  read() {
    try {
      this.ensureInitialized();
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    } catch {
      return { ...INITIAL_STORE };
    }
  }

  write(data) {
    try {
      this.ensureInitialized();
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('LocalStore write error:', e.message);
      return false;
    }
  }

  getCollection(name) {
    const data = this.read();
    return data[name] || [];
  }

  saveItem(collectionName, item) {
    const data = this.read();
    data[collectionName] = data[collectionName] || [];
    
    const id = item.id || item._id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const enriched = {
      ...item,
      id,
      _id: id,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = data[collectionName].findIndex(
      (it) => (it.id && it.id === id) || (it._id && it._id === id)
    );

    if (existingIdx >= 0) {
      data[collectionName][existingIdx] = { ...data[collectionName][existingIdx], ...enriched };
    } else {
      data[collectionName].unshift(enriched);
    }

    this.write(data);
    return enriched;
  }

  deleteItem(collectionName, id) {
    const data = this.read();
    if (!data[collectionName]) return false;
    data[collectionName] = data[collectionName].filter(
      (it) => it.id !== id && it._id !== id
    );
    this.write(data);
    return true;
  }
}

export const localStore = new LocalStore();
