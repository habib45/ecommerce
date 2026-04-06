import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { useCartStore } from '@/stores/cartStore';
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

  const prefix = `/${locale}`;

  if (!open) return null;

  const subtotal = getSubtotal();
  const count = getItemCount();

  return (
    <>
      {/* Backdrop */}
      <div className="overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 animate-slide-in-right shadow-drawer flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('cart.title')} ({count})
          </h2>
          <button onClick={onClose} className="btn-icon hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-500 text-sm mb-4">{t('cart.empty')}</p>
              <button onClick={onClose} className="btn-outline btn-sm">
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const product = item.product;
              const variant = item.variant;
              const name = product ? tr(product.name, locale) : '';
              const image = product?.images?.sort((a, b) => a.sort_order - b.sort_order)[0];
              const price = variant?.prices[currency] ?? 0;

              return (
                <div key={item.id} className="flex gap-4 animate-fade-in">
                  {/* Image */}
                  <div className="w-20 h-20 flex-shrink-0 bg-surface-100 rounded-xl overflow-hidden">
                    {image ? (
                      <img src={image.url} alt={name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{name}</h4>
                    {variant?.name && (
                      <p className="text-xs text-gray-500 mt-0.5">{tr(variant.name, locale)}</p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {formatPrice(price, currency, locale)}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateItemQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-sale-500 transition-colors ml-auto"
                        aria-label={t('cart.remove')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{t('cart.subtotal')}</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatPrice(subtotal, currency, locale)}
              </span>
            </div>
            <p className="text-xs text-gray-400">{t('cart.shippingNote', 'Shipping calculated at checkout')}</p>
            <div className="flex flex-col gap-2">
              <Link
                to={`${prefix}/checkout`}
                onClick={onClose}
                className="btn-accent w-full justify-center text-sm"
              >
                {t('cart.checkout')}
              </Link>
              <Link
                to={`${prefix}/cart`}
                onClick={onClose}
                className="btn-outline w-full justify-center text-sm"
              >
                {t('cart.viewCart', 'View Cart')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
