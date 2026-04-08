import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { useCartStore } from '@/stores/cartStore';
import { useFreeShippingThreshold } from '@/hooks/useStoreSettings';
import { formatPrice } from '@/lib/format';
import { t as tr } from '@/lib/translate';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t } = useTranslation();
  const { locale, currency } = useLocale();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const { data: freeShippingThresholds } = useFreeShippingThreshold();

  const prefix = `/${locale}`;

  if (!open) return null;

  const subtotal = getSubtotal();
  const count = getItemCount();
  const threshold = freeShippingThresholds?.[currency] ?? 0;
  const shippingProgress = threshold > 0 ? Math.min((subtotal / threshold) * 100, 100) : 100;
  const amountToFreeShipping = threshold - subtotal;

  return (
    <>
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 animate-slide-in-right shadow-drawer flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary-600 text-white text-2xs font-bold rounded-full flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('cart.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free shipping progress bar — hidden when threshold is 0 (disabled) */}
        {items.length > 0 && threshold > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            {amountToFreeShipping > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  <p className="text-xs text-gray-600">
                    {t('cart.freeShippingProgress', {
                      defaultValue: `Add {{amount}} more for free shipping!`,
                      amount: formatPrice(amountToFreeShipping, currency, locale),
                    })}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium text-success-600">
                  {t('cart.freeShippingUnlocked', 'You\'ve unlocked free shipping!')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">{t('cart.emptyTitle', 'Your cart is empty')}</p>
              <p className="text-gray-400 text-sm mb-6">{t('cart.emptyDescription', 'Looks like you haven\'t added anything yet.')}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100">
              {items.map((item) => {
                const variant = item.variant;
                const product = (variant as any)?.product ?? item.product;
                const name = product ? tr(product.name, locale) : t('cart.unknownProduct', 'Unknown product');
                const image = product?.images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
                const salePrice = variant?.sale_prices?.[currency];
                const regularPrice = variant?.prices[currency] ?? 0;
                const price = salePrice ?? regularPrice;
                const lineTotal = price * item.quantity;

                return (
                  <div key={item.id} className="flex gap-4 py-4 animate-fade-in group">
                    {/* Image */}
                    <Link
                      to={product?.slug ? `${prefix}/products/${tr(product.slug, locale)}` : '#'}
                      onClick={onClose}
                      className="w-20 h-24 flex-shrink-0 bg-surface-100 rounded-xl overflow-hidden"
                    >
                      {image ? (
                        <img src={image.url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={product?.slug ? `${prefix}/products/${tr(product.slug, locale)}` : '#'}
                          onClick={onClose}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors truncate block"
                        >
                          {name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-sale-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                          aria-label={t('cart.remove')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {variant?.name && (
                        <p className="text-xs text-gray-500 mt-0.5">{tr(variant.name, locale)}</p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(price, currency, locale)}
                        </span>
                        {salePrice && salePrice < regularPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(regularPrice, currency, locale)}
                          </span>
                        )}
                      </div>

                      {/* Quantity + line total */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateItemQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-lg transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center text-sm font-medium select-none">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-lg transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>

                        {item.quantity > 1 && (
                          <span className="text-sm font-semibold text-gray-700">
                            {formatPrice(lineTotal, currency, locale)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-5 bg-white space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{t('cart.subtotal')}</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(subtotal, currency, locale)}
              </span>
            </div>
            <p className="text-xs text-gray-400">{t('cart.shippingNote', 'Shipping & taxes calculated at checkout')}</p>

            {/* Actions */}
            <Link
              to={`${prefix}/checkout`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('cart.checkout')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to={`${prefix}/cart`}
              onClick={onClose}
              className="flex items-center justify-center w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('cart.viewCart', 'View Cart')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
