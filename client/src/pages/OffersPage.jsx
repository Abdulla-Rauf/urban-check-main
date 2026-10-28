import React from 'react';
import { Tag, Sparkles } from 'lucide-react';
import { ProductListingView } from '../components/catalog/ProductListingView';

export const OffersPage = () => {
  return (
    <div>
      {/* Campaign Courtesy Banners */}
      <div className="bg-urban-light-grey/60 border-b border-urban-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-urban-teal text-white flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-urban-biscuit mb-3">
                  <Sparkles size={16} />
                  <span>Privilege Code</span>
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-2">URBANFIRST</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Enjoy 10% complimentary courtesy on your initial inaugural wardrobe acquisition over ₹3,000.
                </p>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-urban-biscuit mt-6 block font-medium">
                Apply at checkout
              </span>
            </div>

            <div className="p-8 bg-urban-black text-white flex flex-col justify-between border border-urban-border shadow-sm">
              <div>
                <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-urban-biscuit mb-3">
                  <Tag size={16} />
                  <span>Seasonal Courtesy</span>
                </div>
                <h3 className="font-serif text-2xl font-semibold mb-2">Complimentary Express Courier</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Every parcel exceeding ₹2,500 receives priority air express handling directly to your residence.
                </p>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-urban-biscuit mt-6 block font-medium">
                Automatically applied
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProductListingView
        title="Exclusive Archive & Offers"
        subtitle="Select atelier archival pieces made available with seasonal courtesies."
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Offers & Archival' },
        ]}
        isOffersOnly={true}
      />
    </div>
  );
};
