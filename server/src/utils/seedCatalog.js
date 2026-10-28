import { Brand } from '../models/Brand.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';

export const seedCatalogIfEmpty = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount > 0) {
      return; // Catalog already established
    }

    console.log('🏛️ Initializing Urban Check Luxury Fashion Catalog...');

    // 1. Seed Brands
    const brandDocs = [
      {
        name: 'Urban Check Atelier',
        slug: 'urban-check-atelier',
        description: 'Bespoke tailoring, architectural structure, and virgin wool blends.',
        status: 'active',
      },
      {
        name: 'Urban Check Minimal',
        slug: 'urban-check-minimal',
        description: 'Stripped-back silhouettes, clean lines, and elevated essentials.',
        status: 'active',
      },
      {
        name: 'Urban Check Studio',
        slug: 'urban-check-studio',
        description: 'Experimental cuts, luxury streetwear proportions, and mercerized cottons.',
        status: 'active',
      },
    ];

    const createdBrands = await Brand.insertMany(brandDocs);
    const brandMap = createdBrands.reduce((acc, b) => {
      acc[b.slug] = b._id;
      return acc;
    }, {});

    // 2. Seed Root Categories
    const rootCategories = [
      {
        name: 'Men',
        slug: 'men',
        description: 'Precision tailoring, relaxed trousers, and structured outerwear.',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop',
        order: 1,
        parent: null,
      },
      {
        name: 'Women',
        slug: 'women',
        description: 'Fluid drape dresses, sculpted blazers, and luxury knitwear.',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop',
        order: 2,
        parent: null,
      },
      {
        name: 'Kids',
        slug: 'kids',
        description: 'Thoughtfully constructed minimal everyday clothing for young ones.',
        image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?q=80&w=1000&auto=format&fit=crop',
        order: 3,
        parent: null,
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Full-grain calfskin leather bags, belts, and artisanal eyewear.',
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
        order: 4,
        parent: null,
      },
    ];

    const createdRoots = await Category.insertMany(rootCategories);
    const rootMap = createdRoots.reduce((acc, c) => {
      acc[c.slug] = c;
      return acc;
    }, {});

    // 3. Seed Nested Subcategories
    const subCategories = [
      {
        name: 'Outerwear',
        slug: 'outerwear',
        parent: rootMap['men']._id,
        ancestors: [{ _id: rootMap['men']._id, name: 'Men', slug: 'men' }],
        description: 'Structured wool blazers, trench coats, and technical bombers.',
      },
      {
        name: 'Tailoring',
        slug: 'tailoring',
        parent: rootMap['men']._id,
        ancestors: [{ _id: rootMap['men']._id, name: 'Men', slug: 'men' }],
        description: 'Italian virgin wool half-canvas suiting and trousers.',
      },
      {
        name: 'Knitwear',
        slug: 'knitwear',
        parent: rootMap['women']._id,
        ancestors: [{ _id: rootMap['women']._id, name: 'Women', slug: 'women' }],
        description: 'Mongolian cashmere cardigans, rib turtlenecks, and wraps.',
      },
      {
        name: 'Trousers',
        slug: 'trousers',
        parent: rootMap['men']._id,
        ancestors: [{ _id: rootMap['men']._id, name: 'Men', slug: 'men' }],
        description: 'Pleated wide-leg trousers, tailored chinos, and raw denim.',
      },
      {
        name: 'Tops',
        slug: 'tops',
        parent: rootMap['men']._id,
        ancestors: [{ _id: rootMap['men']._id, name: 'Men', slug: 'men' }],
        description: 'Double-mercerized Egyptian cotton t-shirts and relaxed poplin shirts.',
      },
      {
        name: 'Leather Goods',
        slug: 'leather-goods',
        parent: rootMap['accessories']._id,
        ancestors: [{ _id: rootMap['accessories']._id, name: 'Accessories', slug: 'accessories' }],
        description: 'Tuscan calfskin leather messenger bags, cardholders, and belts.',
      },
    ];

    const createdSubs = await Category.insertMany(subCategories);
    const catMap = createdSubs.reduce((acc, c) => {
      acc[c.slug] = c;
      return acc;
    }, {});

    // 4. Curated Luxury Wardrobe Products
    const productsSeed = [
      {
        name: 'Tailored Structured Wool Blazer',
        slug: 'tailored-structured-blazer',
        brand: brandMap['urban-check-atelier'],
        category: catMap['outerwear']._id,
        categories: [rootMap['men']._id, catMap['outerwear']._id],
        gender: 'Men',
        price: 8990,
        originalPrice: 11990,
        discountPercent: 25,
        popularity: 98,
        rating: 4.9,
        reviewsCount: 42,
        featured: true,
        newArrival: true,
        inStock: true,
        images: [
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
        secondaryImage: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop',
        description: 'An architectural single-breasted blazer woven from Italian virgin wool blend with a sculpted waistline and tonal horn buttons.',
        shortDescription: 'Italian virgin wool single-breasted structured blazer.',
        material: '90% Italian Virgin Wool, 10% Mulberry Silk. Lining: 100% Cupro.',
        details: [
          'Italian virgin wool & silk blend canvas',
          'Structured padded shoulders with half-canvas chest piece',
          'Tonal cupro lining with two internal jet pockets',
          'Dual rear vents for natural posture drape',
        ],
        tags: ['blazer', 'wool', 'tailored', 'atelier', 'outerwear', 'jacket'],
        seo: {
          metaTitle: 'Tailored Structured Wool Blazer — Urban Check Atelier',
          metaDescription: 'Architectural single-breasted blazer woven from Italian virgin wool blend.',
          keywords: ['tailored blazer', 'wool blazer', 'luxury fashion', 'urban check'],
        },
        variants: [
          {
            sku: 'UC-JKT-TG-XS',
            size: 'XS',
            color: 'Teal Green',
            colorHex: '#2F6F68',
            price: 8990,
            salePrice: 8990,
            stock: 4,
            images: [
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=1000&auto=format&fit=crop',
            ],
          },
          {
            sku: 'UC-JKT-TG-S',
            size: 'S',
            color: 'Teal Green',
            colorHex: '#2F6F68',
            price: 8990,
            salePrice: 8990,
            stock: 9,
            images: [
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
            ],
          },
          {
            sku: 'UC-JKT-TG-M',
            size: 'M',
            color: 'Teal Green',
            colorHex: '#2F6F68',
            price: 8990,
            salePrice: 8990,
            stock: 15,
            images: [
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
            ],
          },
          {
            sku: 'UC-JKT-TG-L',
            size: 'L',
            color: 'Teal Green',
            colorHex: '#2F6F68',
            price: 8990,
            salePrice: 8990,
            stock: 2,
            images: [
              'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
            ],
          },
          {
            sku: 'UC-JKT-BK-M',
            size: 'M',
            color: 'Black',
            colorHex: '#111111',
            price: 8990,
            salePrice: 8990,
            stock: 8,
            images: [
              'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
            ],
          },
          {
            sku: 'UC-JKT-BK-L',
            size: 'L',
            color: 'Black',
            colorHex: '#111111',
            price: 8990,
            salePrice: 8990,
            stock: 3,
            images: [
              'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
            ],
          },
        ],
      },
      {
        name: 'Pleated Wool Wide-Leg Trousers',
        slug: 'pleated-wool-wide-leg-trousers',
        brand: brandMap['urban-check-minimal'],
        category: catMap['trousers']._id,
        categories: [rootMap['men']._id, catMap['trousers']._id],
        gender: 'Men',
        price: 5490,
        originalPrice: 6990,
        discountPercent: 21,
        popularity: 92,
        rating: 4.8,
        reviewsCount: 31,
        featured: true,
        newArrival: true,
        inStock: true,
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        secondaryImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop',
        description: 'Relaxed high-rise trousers featuring deep front pleats, angled pockets, and a clean drape designed for effortless elegance.',
        shortDescription: 'High-rise pleated wool trousers with fluid drape silhouette.',
        material: '100% Fine Worsted Wool. Pocketing: 100% Organic Cotton.',
        details: [
          'Double forward pleats at waistband',
          'Concealed horn button tab closure',
          'Wide-leg silhouette with unfinished hems for tailoring',
        ],
        tags: ['trousers', 'wool', 'pleated', 'minimal', 'pants'],
        seo: {
          metaTitle: 'Pleated Wool Wide-Leg Trousers — Urban Check Minimal',
          metaDescription: 'Relaxed high-rise trousers with deep front pleats.',
          keywords: ['wool trousers', 'pleated pants', 'wide leg trousers'],
        },
        variants: [
          {
            sku: 'UC-TRS-WG-28',
            size: '28',
            color: 'Warm Grey',
            colorHex: '#6B6B65',
            price: 5490,
            salePrice: 5490,
            stock: 6,
            images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'],
          },
          {
            sku: 'UC-TRS-WG-30',
            size: '30',
            color: 'Warm Grey',
            colorHex: '#6B6B65',
            price: 5490,
            salePrice: 5490,
            stock: 12,
            images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'],
          },
          {
            sku: 'UC-TRS-WG-32',
            size: '32',
            color: 'Warm Grey',
            colorHex: '#6B6B65',
            price: 5490,
            salePrice: 5490,
            stock: 8,
            images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop'],
          },
        ],
      },
      {
        name: 'Raw Edge Sand Trench Coat',
        slug: 'raw-edge-sand-trench-coat',
        brand: brandMap['urban-check-atelier'],
        category: catMap['outerwear']._id,
        categories: [rootMap['women']._id, catMap['outerwear']._id],
        gender: 'Women',
        price: 14500,
        originalPrice: 17500,
        discountPercent: 17,
        popularity: 95,
        rating: 4.9,
        reviewsCount: 28,
        featured: true,
        newArrival: true,
        inStock: true,
        images: [
          'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop',
        secondaryImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1000&auto=format&fit=crop',
        description: 'A contemporary reinterpretation of the iconic trench in heavyweight organic cotton gabardine with storm flaps and belted cuffs.',
        shortDescription: 'Double-breasted trench coat in organic cotton gabardine.',
        material: '100% Water-repellent Cotton Gabardine.',
        details: [
          'Double-breasted storm flap front',
          'Removable waist tie with calfskin buckle',
          'Deep storm vent and inverted rear pleat',
        ],
        tags: ['trench', 'coat', 'sand', 'gabardine', 'outerwear'],
        variants: [
          {
            sku: 'UC-TRN-BS-S',
            size: 'S',
            color: 'Biscuit',
            colorHex: '#D8C7AD',
            price: 14500,
            salePrice: 14500,
            stock: 5,
            images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop'],
          },
          {
            sku: 'UC-TRN-BS-M',
            size: 'M',
            color: 'Biscuit',
            colorHex: '#D8C7AD',
            price: 14500,
            salePrice: 14500,
            stock: 7,
            images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop'],
          },
        ],
      },
      {
        name: 'Monochrome Mercerized Cotton Tee',
        slug: 'monochrome-mercerized-cotton-tee',
        brand: brandMap['urban-check-studio'],
        category: catMap['tops']._id,
        categories: [rootMap['men']._id, catMap['tops']._id],
        gender: 'Men',
        price: 2490,
        originalPrice: 2490,
        discountPercent: 0,
        popularity: 88,
        rating: 4.8,
        reviewsCount: 64,
        featured: false,
        newArrival: false,
        inStock: true,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
        description: 'Crafted from ultra-soft double-mercerized Egyptian cotton for a subtle sheen and lasting shape.',
        shortDescription: 'Double-mercerized heavyweight crewneck t-shirt.',
        material: '100% Giza Double Mercerized Cotton.',
        details: [
          '280 GSM heavyweight jersey knit',
          'Ribbed collar with interior herringbone neck tape',
          'Blind stitched sleeve and hem construction',
        ],
        tags: ['tee', 'tshirt', 'cotton', 'studio', 'black'],
        variants: [
          {
            sku: 'UC-TEE-BK-S',
            size: 'S',
            color: 'Black',
            colorHex: '#111111',
            price: 2490,
            salePrice: 2490,
            stock: 14,
            images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
          },
          {
            sku: 'UC-TEE-BK-M',
            size: 'M',
            color: 'Black',
            colorHex: '#111111',
            price: 2490,
            salePrice: 2490,
            stock: 20,
            images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
          },
          {
            sku: 'UC-TEE-BK-L',
            size: 'L',
            color: 'Black',
            colorHex: '#111111',
            price: 2490,
            salePrice: 2490,
            stock: 10,
            images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'],
          },
        ],
      },
      {
        name: 'Cashmere Knit Turtleneck',
        slug: 'cashmere-knit-turtleneck',
        brand: brandMap['urban-check-atelier'],
        category: catMap['knitwear']._id,
        categories: [rootMap['women']._id, catMap['knitwear']._id],
        gender: 'Women',
        price: 9990,
        originalPrice: 12990,
        discountPercent: 23,
        popularity: 91,
        rating: 4.9,
        reviewsCount: 19,
        featured: true,
        newArrival: true,
        inStock: true,
        images: [
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
        description: 'Spun from pure Grade-A Inner Mongolian cashmere with a ribbed rollneck and seamless shoulder transitions.',
        shortDescription: 'Pure Mongolian 2-ply cashmere high neck sweater.',
        material: '100% Grade-A Mongolian Cashmere.',
        details: [
          '2-ply 12-gauge jersey knit construction',
          'Soft ribbed rollneck collar and cuff trims',
          'Naturally insulating with ultra-light featherweight feel',
        ],
        tags: ['cashmere', 'knitwear', 'turtleneck', 'winter', 'sweater'],
        variants: [
          {
            sku: 'UC-KNT-BS-S',
            size: 'S',
            color: 'Biscuit',
            colorHex: '#D8C7AD',
            price: 9990,
            salePrice: 9990,
            stock: 4,
            images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop'],
          },
          {
            sku: 'UC-KNT-BS-M',
            size: 'M',
            color: 'Biscuit',
            colorHex: '#D8C7AD',
            price: 9990,
            salePrice: 9990,
            stock: 6,
            images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop'],
          },
        ],
      },
      {
        name: 'Structured Calfskin Leather Messenger',
        slug: 'structured-calfskin-leather-messenger',
        brand: brandMap['urban-check-atelier'],
        category: catMap['leather-goods']._id,
        categories: [rootMap['accessories']._id, catMap['leather-goods']._id],
        gender: 'Unisex',
        price: 11990,
        originalPrice: 13990,
        discountPercent: 14,
        popularity: 87,
        rating: 4.8,
        reviewsCount: 15,
        featured: true,
        newArrival: false,
        inStock: true,
        images: [
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop',
        description: 'Constructed from vegetable-tanned full-grain calfskin leather with polished palladium hardware and interior laptop sleeve.',
        shortDescription: 'Full-grain Italian calfskin messenger briefcase.',
        material: '100% Full-grain Tuscan Calfskin Leather. Lining: Cotton Twill.',
        details: [
          'Padded protective compartment fitting up to 15-inch laptops',
          'Magnetic closure with concealed quick-release buckles',
          'Adjustable webbing shoulder strap with leather pad',
        ],
        tags: ['leather', 'bag', 'messenger', 'accessories', 'briefcase'],
        variants: [
          {
            sku: 'UC-BAG-BK-OS',
            size: 'One Size',
            color: 'Black',
            colorHex: '#111111',
            price: 11990,
            salePrice: 11990,
            stock: 8,
            images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1000&auto=format&fit=crop'],
          },
        ],
      },
    ];

    const createdProducts = await Product.insertMany(productsSeed);

    // Also populate ProductVariant standalone collection with product back-references
    const allVariants = [];
    createdProducts.forEach((p) => {
      p.variants.forEach((v) => {
        allVariants.push({
          product: p._id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex,
          price: v.price,
          salePrice: v.salePrice,
          stock: v.stock,
          images: v.images,
          status: 'active',
        });
      });
    });

    await ProductVariant.insertMany(allVariants);

    console.log(
      `✅ Luxury Catalog seeded: ${createdBrands.length} brands, ${createdRoots.length + createdSubs.length} categories, ${createdProducts.length} garments, ${allVariants.length} variants.`
    );
  } catch (error) {
    console.warn('⚠️ Note on seeding catalog:', error.message);
  }
};
