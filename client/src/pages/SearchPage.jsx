import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductListingView } from '../components/catalog/ProductListingView';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <ProductListingView
      title={query ? `Search: "${query}"` : 'Search Wardrobe'}
      subtitle={
        query
          ? `Discover pieces tailored to "${query}" across atelier garments, fabrics, and styles.`
          : 'Explore the full urban aesthetic catalog.'
      }
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Search Results' },
      ]}
      searchQuery={query}
    />
  );
};
