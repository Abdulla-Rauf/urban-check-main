import React from 'react';
import { ProductListingView } from '../components/catalog/ProductListingView';

export const NewArrivalsPage = () => {
  return (
    <ProductListingView
      title="Autumn / Winter New Drops"
      subtitle="Recently released atelier garments engineered for elevated silhouette, innovative textiles, and contemporary luxury."
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'New Arrivals' },
      ]}
      isNewArrivalOnly={true}
    />
  );
};
