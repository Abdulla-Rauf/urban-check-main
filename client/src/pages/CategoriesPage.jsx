import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productService } from '../services/productService';

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    productService.getCategories()
      .then((res) => {
        const data = res?.data || res;
        if (isMounted && Array.isArray(data)) {
          const formatted = data.map((cat, idx) => ({
            id: cat._id || cat.id || `cat-${idx}`,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || 'Architectural silhouettes crafted in limited numbers.',
            itemCount: cat.productsCount !== undefined ? cat.productsCount : 0,
          }));
          setCategories(formatted);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="border-b border-urban-border pb-8 mb-12">
        <span className="text-[11px] uppercase tracking-widest text-urban-teal font-semibold">
          Taxonomy
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-urban-black font-light mt-1">
          Wardrobe Categories
        </h1>
        <p className="text-xs text-urban-warm-grey mt-2">
          Discover silhouettes curated by functional elegance and architectural form.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-urban-light-grey border border-urban-border" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.slug || category.id}`}
              className="group block p-8 bg-urban-light-grey border border-urban-border hover:border-urban-teal transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs uppercase tracking-widest text-urban-warm-grey">
                  {category.itemCount} Designs
                </span>
                <span className="p-2 rounded-full bg-white group-hover:bg-urban-teal group-hover:text-white transition-colors">
                  <ArrowRight size={16} />
                </span>
              </div>

              <h3 className="font-serif text-2xl font-semibold text-urban-black mb-2">
                {category.name}
              </h3>
              <p className="text-xs text-urban-warm-grey leading-relaxed max-w-md">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-urban-border p-8 bg-urban-light-grey/50">
          <p className="text-xs text-urban-warm-grey">No categories currently published in the catalog.</p>
        </div>
      )}
    </div>
  );
};
