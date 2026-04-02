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
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.prices[currency];
  const salePrice = firstVariant?.sale_prices?.[currency];
  const outOfStock = firstVariant ? (firstVariant.stock_quantity ?? 0) === 0 : false;
  const inCart = firstVariant ? cartItems.some((i) => i.variant_id === firstVariant.id) : false;

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
      className="group block bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage.url}
            alt={t(firstImage.alt_text, locale) || name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{name}</h3>
        <div className="mt-2 flex items-center justify-between gap-1">
          {/* Price — min-w-0 allows text to truncate rather than push button off screen */}
          <div className="flex flex-col min-w-0 gap-0.5">
            {salePrice != null && salePrice > 0 ? (
              <>
                <span className="text-sm font-semibold text-red-600 truncate">{formatPrice(salePrice, currency, locale)}</span>
                {price != null && <span className="text-xs text-gray-400 line-through truncate">{formatPrice(price, currency, locale)}</span>}
              </>
            ) : price != null ? (
              <span className="text-sm font-semibold text-gray-900 truncate">{formatPrice(price, currency, locale)}</span>
            ) : null}
          </div>

          {/* Add to cart — min 44×44px touch target */}
          {firstVariant && (
            <button
              onClick={handleAddToCart}
              disabled={adding || outOfStock || inCart}
              className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full transition-colors
                ${outOfStock
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : inCart
                    ? 'bg-green-100 text-green-600 cursor-default'
                    : adding
                      ? 'bg-primary-100 text-primary-400 cursor-wait'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              title={outOfStock ? 'Out of stock' : inCart ? 'Added to cart' : 'Add to cart'}
            >
              {adding ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : inCart ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
