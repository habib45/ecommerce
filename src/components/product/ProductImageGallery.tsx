import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { t as translate } from '@/lib/translate';
import type { ProductImage } from '@/types/domain';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const { locale } = useLocale();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const total = images.length;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((index: number) => {
    setLightboxIndex((index + total) % total);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [total]);

  // Keyboard: ESC to close, arrows to navigate
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goTo(lightboxIndex + 1);
      if (e.key === 'ArrowLeft') goTo(lightboxIndex - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, lightboxIndex, closeLightbox, goTo]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => {
      const next = prev - e.deltaY * 0.001;
      return Math.min(Math.max(next, 1), 4);
    });
    if (zoom <= 1) setPan({ x: 0, y: 0 });
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  // Click image: cycle zoom levels
  const handleImageClick = () => {
    if (isDragging) return;
    setZoom(prev => {
      const next = prev >= 3 ? 1 : prev + 1;
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
        No image
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <>
      {/* ── Main image ───────────────────────────────────────── */}
      <div
        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in group"
        onClick={() => openLightbox(activeIndex)}
      >
        <img
          src={active.url}
          alt={translate(active.alt_text, locale) || productName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0zm-6-3v6M8 11h6" />
          </svg>
          Click to zoom
        </div>
      </div>

      {/* ── Thumbnails ───────────────────────────────────────── */}
      {total > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-3">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActiveIndex(i)}
              className={`aspect-square rounded overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                ${i === activeIndex ? 'border-primary-600' : 'border-transparent hover:border-gray-300'}`}
            >
              <img
                src={img.url}
                alt={translate(img.alt_text, locale) || productName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={(e) => { if (e.target === lightboxRef.current) closeLightbox(); }}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
            <button
              onClick={() => { setZoom(prev => Math.max(1, prev - 0.5)); if (zoom <= 1.5) setPan({ x: 0, y: 0 }); }}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0zM8 11h6" />
              </svg>
            </button>
            <span className="text-white text-xs w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(4, prev + 0.5))}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0zm-6-3v6M8 11h6" />
              </svg>
            </button>
          </div>

          {/* Prev */}
          {total > 1 && (
            <button
              onClick={() => goTo(lightboxIndex - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full px-16 overflow-hidden"
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={images[lightboxIndex].url}
              alt={translate(images[lightboxIndex].alt_text, locale) || productName}
              draggable={false}
              onClick={handleImageClick}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
              }}
              className="w-full h-full object-contain max-h-[85vh] select-none"
            />
          </div>

          {/* Next */}
          {total > 1 && (
            <button
              onClick={() => goTo(lightboxIndex + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Thumbnail strip */}
          {total > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  onClick={() => goTo(i)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors flex-shrink-0
                    ${i === lightboxIndex ? 'border-white' : 'border-white/30 hover:border-white/60'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Counter */}
          {total > 1 && (
            <div className="absolute top-4 left-4 text-white/70 text-sm">
              {lightboxIndex + 1} / {total}
            </div>
          )}
        </div>
      )}
    </>
  );
}
