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

  // Calculate discount percentage
  const discountPercent = salePrice && price && price > salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  // Check if product is new (within last 14 days)
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
    <Link
      to={`/${locale}/products/${slug}`}
      className="group block"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] bg-surface-100 rounded-2xl overflow-hidden mb-3">
        {/* Primary image */}
        {firstImage ? (
          <img
            src={firstImage.url}
            alt={t(firstImage.alt_text, locale) || name}
            className={`w-full h-full object-cover transition-all duration-500 ${
              secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Secondary image on hover */}
        {secondImage && (
          <img
            src={secondImage.url}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
          />
        )}

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
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {firstVariant && !outOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={adding || inCart}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                inCart
                  ? 'bg-success-500/90 text-white cursor-default'
                  : adding
                    ? 'bg-white/90 text-gray-400 cursor-wait'
                    : 'bg-white/90 text-gray-900 hover:bg-white active:scale-[0.97]'
              }`}
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                </span>
              ) : inCart ? (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </span>
              )}
            </button>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110"
          aria-label="Add to wishlist"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Product info */}
      <div className="space-y-1.5 px-1">
        {/* Category tag */}
        {product.category?.name && (
          <p className="text-2xs uppercase tracking-wider text-gray-400 font-medium">
            {t(product.category.name, locale)}
          </p>
        )}

        {/* Name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-accent-600 transition-colors">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          {salePrice != null && salePrice > 0 ? (
            <>
              <span className="text-sm font-bold text-sale-600">
                {formatPrice(salePrice, currency, locale)}
              </span>
              {price != null && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(price, currency, locale)}
                </span>
              )}
            </>
          ) : price != null ? (
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(price, currency, locale)}
            </span>
          ) : null}
        </div>

        {/* Mobile add-to-cart (touch target) — visible only on mobile where hover doesn't work */}
        {firstVariant && (
          <button
            onClick={handleAddToCart}
            disabled={adding || outOfStock || inCart}
            className={`mt-2 w-full py-2 rounded-xl text-xs font-medium transition-all sm:hidden ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : inCart
                  ? 'bg-success-50 text-success-600 cursor-default'
                  : adding
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'bg-primary-900 text-white active:scale-[0.97]'
            }`}
          >
            {adding ? '...' : outOfStock ? 'Sold Out' : inCart ? 'Added' : 'Add to Cart'}
          </button>
        )}
      </div>
    </Link>
  );
}
