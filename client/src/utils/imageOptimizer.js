/**
 * Optimizes image URLs with modern formats (WebP/AVIF) and responsive sizing.
 * Supports Unsplash, Cloudinary, and standard CDN images while preserving originals safely.
 */
export const optimizeImageUrl = (url, { width = 800, quality = 80, format = 'webp' } = {}) => {
  if (!url || typeof url !== 'string') return '';

  // Unsplash CDN auto-format to WebP/AVIF with specified width
  if (url.includes('images.unsplash.com')) {
    const cleanUrl = url.split('?')[0];
    return `${cleanUrl}?auto=format&fit=crop&w=${width}&q=${quality}&fm=${format}`;
  }

  // Cloudinary CDN transform
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/f_${format},q_${quality},w_${width}/`);
  }

  return url;
};
