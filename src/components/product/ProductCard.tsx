import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '@/hooks/useLocale';
import { t } from '@/lib/translate';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types/domain';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, currency } = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const [adding, setAdding] = useState(false);

  const name = t(product.name, locale);
  const slug = t(product.slug, locale);
  const firstImage = product.images?.sort((a, b) => a.sort_order - b.sort_order)[0];
  const secondImage = product.images?.sort((a, b) => a.sort_order - b.sort_order)[1];
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.prices[currency];
  const salePrice = firstVariant?.sale_prices?.[currency];
  const outOfStock = firstVariant ? (firstVariant.stock_quantity ?? 0) === 0 : false;
  const inCart = firstVariant ? cartItems.some((i) => i.variant_id === firstVariant.id) : false;

  const discountPercent = salePrice && price && price > salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const isNew = product.created_at
    ? (Date.now() - new Date(product.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || adding || outOfStock || inCart) return;
    setAdding(true);
    try {
      await addItem(firstVariant.id, 1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/${locale}/products/${slug}`} className="product-card group">
      {/* Image container */}
      <div className="product-image">
        {/* Primary image */}
        {firstImage ? (
          <img
            src={firstImage.url}
            alt={t(firstImage.alt_text, locale) || name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Secondary image on hover */}
        {secondImage && (
          <img
            src={secondImage.url}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            loading="lazy"
          />
        )}

        {/* Overlay */}
        <div className="product-overlay" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="badge-sale">-{discountPercent}%</span>
          )}
          {isNew && !discountPercent && (
            <span className="badge-new">New</span>
          )}
          {outOfStock && (
            <span className="badge-out">Sold out</span>
          )}
        </div>

        {/* Quick actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {firstVariant && !outOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={adding || inCart}
              className="w-full py-3 px-4 bg-white/90 backdrop-blur-sm text-foreground font-medium rounded-xl transition-all duration-200 hover:bg-white active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                  <span className="text-sm">Adding...</span>
                </div>
              ) : inCart ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Added to Cart</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-sm">Add to Cart</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-3 right-3 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
          aria-label="Add to wishlist"
        >
          <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Product info */}
      <div className="p-4">
        {/* Category tag */}
        {product.category?.name && (
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
            {t(product.category.name, locale)}
          </p>
        )}

        {/* Name */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          {salePrice != null && salePrice > 0 ? (
            <>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(salePrice, currency, locale)}
              </span>
              {price != null && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(price, currency, locale)}
                </span>
              )}
            </>
          ) : price != null ? (
            <span className="text-lg font-bold text-foreground">
              {formatPrice(price, currency, locale)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
