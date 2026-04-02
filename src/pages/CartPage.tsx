import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";
import { useCartStore } from "@/stores/cartStore";
import { useDeliveryFee } from "@/hooks/useStoreSettings";
import { t as translate } from "@/lib/translate";
import { formatPrice } from "@/lib/format";

export function CartPage() {
  const { t } = useTranslation();
  const { locale, currency } = useLocale();
  const { items, loading, updateItemQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const { data: deliveryFees } = useDeliveryFee();
  const [stockError, setStockError] = useState<string | null>(null);

  const handleIncrement = (item: typeof items[0]) => {
    const stock = item.variant?.stock_quantity ?? 0;
    if (item.quantity + 1 > stock) {
      setStockError(`Only ${stock} unit${stock === 1 ? '' : 's'} available for this item.`);
      return;
    }
    setStockError(null);
    updateItemQuantity(item.id, item.quantity + 1);
  };

  const deliveryCharge = deliveryFees?.[currency] ?? 0;
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryCharge + serviceCharge;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("cart.title")}
        </h1>
        <p className="text-gray-500 mb-6">{t("cart.empty")}</p>
        <Link
          to={`/${locale}/products`}
          className="text-primary-600 hover:underline"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {t("cart.title")} ({t("cart.items", { count: items.length })})
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {stockError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              {stockError}
              <button onClick={() => setStockError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}
          {items.map((item) => {
            const variant = item.variant;
            const product = (variant as any)?.product ?? item.product;
            const name = translate(product?.name ?? {}, locale) || `Product #${item.variant_id?.slice(0, 8)}`;
            const variantName = variant ? translate(variant.name, locale) : 'Unknown variant';
            const price =
              variant?.sale_prices?.[currency] ??
              variant?.prices?.[currency] ??
              0;
            const image = product?.images?.sort(
              (a: any, b: any) => a.sort_order - b.sort_order,
            )[0];

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg"
              >
                {image ? (
                  <img
                    src={image.url}
                    alt={name}
                    className="w-20 h-20 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{name}</h3>
                  {variant && (
                    <p className="text-sm text-gray-500">
                      {variantName}
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-1">
                    {price > 0 ? formatPrice(price, currency, locale) : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => {
                        setStockError(null);
                        updateItemQuantity(item.id, item.quantity - 1);
                      }}
                      className="px-2 py-1 text-sm"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrement(item)}
                      className="px-2 py-1 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout Summary Sidebar */}
        <div className="bg-gray-50 p-6 rounded-lg h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {t("checkout.orderSummary") || "Order Summary"}
          </h2>

          {/* Subtotal */}
          <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
            <span className="text-gray-700">{t("cart.subtotal")}</span>
            <span className="font-medium text-gray-900">
              {formatPrice(subtotal, currency, locale)}
            </span>
          </div>

          {/* Delivery Charge */}
          <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
            <span className="text-gray-700">
              {t("checkout.deliveryCharge") || "Delivery Charge"}
            </span>
            <span className="font-medium text-gray-900">
              + {formatPrice(deliveryCharge, currency, locale)}
            </span>
          </div>

          {/* Service Charge */}
          <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
            <span className="text-gray-700">
              {t("checkout.serviceCharge") || "Website Service Charge"}
            </span>
            <span className="font-medium text-gray-900">
              + {formatPrice(serviceCharge, currency, locale)}
            </span>
          </div>

          {/* Total */}
          <div className="flex justify-between mb-6 pb-6 border-b border-gray-200">
            <span className="text-gray-700 font-semibold">{t("checkout.total") || "Total"}</span>
            <span className="font-bold text-lg text-gray-900">
              {formatPrice(total, currency, locale)}
            </span>
          </div>

          {/* Payable Total */}
          <div className="bg-primary-50 p-4 rounded-lg mb-6 border border-primary-200">
            <p className="text-xs text-gray-600 mb-1">
              {t("checkout.payableTotal") || "Payable Total"}
            </p>
            <p className="text-2xl font-bold text-primary-600">
              {formatPrice(total, currency, locale)}
            </p>
          </div>

          {/* Checkout Button */}
          <Link
            to={`/${locale}/checkout`}
            className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-medium hover:bg-primary-700 mb-3 transition-colors"
          >
            {t("cart.checkout")}
          </Link>

          <Link
            to={`/${locale}/products`}
            className="block text-center text-sm text-gray-500 hover:underline"
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
