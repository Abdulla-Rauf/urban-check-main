import React, { useState, useEffect } from 'react';
import { ZoomIn } from 'lucide-react';
import { optimizeImageUrl } from '../../utils/imageOptimizer';

export const ProductGallery = ({ images = [], productName = 'Product' }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Reset to first image if image list changes (e.g. variant switched)
  useEffect(() => {
    setSelectedImageIndex(0);
  }, [images]);

  const activeImage = images[selectedImageIndex] || images[0] || '';
  const displayActiveImage = optimizeImageUrl(activeImage, { width: 1200, format: 'webp' });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails Column */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[600px] flex-shrink-0 py-1">
          {images.map((img, idx) => {
            const isSelected = selectedImageIndex === idx;
            const thumbUrl = optimizeImageUrl(img, { width: 200, format: 'webp' });
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 bg-urban-light-grey overflow-hidden border transition-all ${
                  isSelected
                    ? 'border-urban-black ring-1 ring-urban-black'
                    : 'border-urban-border opacity-70 hover:opacity-100 hover:border-urban-warm-grey'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Showcase with Zoom */}
      <div className="relative flex-1 bg-urban-light-grey border border-urban-border overflow-hidden aspect-[3/4] group">
        <div
          className="w-full h-full cursor-crosshair relative overflow-hidden"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <img
            src={displayActiveImage}
            alt={productName}
            decoding="async"
            className={`w-full h-full object-cover object-center transition-transform duration-300 ease-out ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                  }
                : undefined
            }
          />
        </div>

        {/* Hover zoom hint indicator */}
        <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-wider text-urban-black flex items-center space-x-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={12} />
          <span className="hidden sm:inline">Hover to zoom</span>
        </div>
      </div>
    </div>
  );
};
