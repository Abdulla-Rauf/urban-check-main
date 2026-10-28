import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductListingView } from '../components/catalog/ProductListingView';
import { productService } from '../services/productService';

export const BrandDetailPage = () => {
  const { slug } = useParams();
  const [brandInfo, setBrandInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;
    productService.getBrandBySlug(slug).then((res) => {
      const data = res?.data || res;
      if (isMounted && data) {
        setBrandInfo(data);
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

  const brandName = brandInfo?.name || formattedSlugName;

  return (
    <ProductListingView
      title={brandName}
      subtitle={brandInfo?.description || "Exclusive aesthetic house, dedicated craft practices, and timeless signature design cues."}
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Shop', path: '/shop' },
        { label: brandName },
      ]}
      preSelectedBrand={brandName}
    />
  );
};
