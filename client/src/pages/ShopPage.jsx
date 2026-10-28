import React from 'react';
import { ProductListingView } from '../components/catalog/ProductListingView';

export const ShopPage = () => {
  return (
    <ProductListingView
      title="The Atelier Catalog"
      subtitle="Architectural tailoring, relaxed silhouettes, and luxury textiles crafted for enduring distinction."
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Catalog', path: '/shop' },
      ]}
    />
  );
};
