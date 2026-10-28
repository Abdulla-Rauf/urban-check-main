import { Permission } from '../models/Permission.js';
import { Role } from '../models/Role.js';

export const seedInitialRolesAndPermissions = async () => {
  try {
    const existingCount = await Role.countDocuments();
    if (existingCount > 0) {
      return; // Already initialized
    }

    console.log('🌱 Seeding initial roles and permissions...');

    const defaultPermissions = [
      { name: 'products:read', description: 'Browse and view products', module: 'products' },
      { name: 'products:write', description: 'Create and update products', module: 'products' },
      { name: 'products:delete', description: 'Remove or archive products', module: 'products' },
      { name: 'orders:read', description: 'View client orders and timelines', module: 'orders' },
      { name: 'orders:manage', description: 'Update order status and fulfillment', module: 'orders' },
      { name: 'users:read', description: 'View user client accounts', module: 'users' },
      { name: 'users:manage', description: 'Manage user credentials and roles', module: 'users' },
      { name: 'settings:manage', description: 'Manage system and store configuration', module: 'settings' },
    ];

    const createdPermissions = await Permission.insertMany(defaultPermissions);
    const permMap = createdPermissions.reduce((acc, p) => {
      acc[p.name] = p._id;
      return acc;
    }, {});

    const defaultRoles = [
      {
        name: 'customer',
        description: 'Standard atelier patron privileges',
        permissions: [permMap['products:read']],
        isDefault: true,
      },
      {
        name: 'editor',
        description: 'Product catalog curator and content editor',
        permissions: [
          permMap['products:read'],
          permMap['products:write'],
          permMap['orders:read'],
        ],
        isDefault: false,
      },
      {
        name: 'admin',
        description: 'Store manager with operations control',
        permissions: Object.values(permMap),
        isDefault: false,
      },
      {
        name: 'super_admin',
        description: 'Full system privileges and root security',
        permissions: Object.values(permMap),
        isDefault: false,
      },
    ];

    await Role.insertMany(defaultRoles);
    console.log('✅ Initial roles and permissions successfully established.');
  } catch (error) {
    console.warn('⚠️ Note on seeding roles & permissions:', error.message);
  }
};
