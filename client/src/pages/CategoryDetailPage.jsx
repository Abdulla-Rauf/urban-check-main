import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductListingView } from '../components/catalog/ProductListingView';
import { productService } from '../services/productService';

export const CategoryDetailPage = () => {
  const { slug } = useParams();
  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;
    productService.getCategories().then((res) => {
      const list = res?.data || res;
      if (isMounted && Array.isArray(list)) {
        const found = list.find((c) => c.slug?.toLowerCase() === slug?.toLowerCase());
        if (found) setCategoryInfo(found);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const formattedSlugName = slug
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const categoryName = categoryInfo?.name || formattedSlugName;

  return (
    <ProductListingView
      title={categoryName}
      subtitle={
        categoryInfo?.description ||
        `Curated collection of handcrafted pieces within the ${categoryName} edit.`
      }
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Categories', path: '/categories' },
        { label: categoryName },
      ]}
      preSelectedCategory={categoryName}
    />
  );
};
