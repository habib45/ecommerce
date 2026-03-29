import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useProduct, useRelatedProducts } from '@/hooks/useProducts';
import { t as translate } from '@/lib/translate';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/stores/cartStore';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import toast from 'react-hot-toast';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { locale, currency } = useLocale();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const { data: product, isLoading, error } = useProduct(slug ?? '', locale);
  const { data: related } = useRelatedProducts(product?.id ?? '', product?.category_id ?? null, locale);

  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-16 text-center">{t('common.loading')}</div>;
  if (error || !product) return <div className="max-w-7xl mx-auto px-4 py-16 text-center">{t('common.error')}</div>;

  const name = translate(product.name, locale);
  const description = translate(product.description, locale);
  const metaTitle = translate(product.meta_title, locale) || name;
  const metaDesc = translate(product.meta_description, locale) || description?.slice(0, 160);
  const variant = product.variants?.[selectedVariant];
  const price = variant?.prices[currency] ?? 0;
  const salePrice = variant?.sale_prices?.[currency];
  const inStock = (variant?.stock_quantity ?? 0) > 0;
  const inCart = variant ? cartItems.some((i) => i.variant_id === variant.id) : false;
  const images = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  const handleAddToCart = async () => {
    if (!variant || adding || inCart || !inStock) return;
    setAdding(true);
    try {
      await addItem(variant.id, quantity);
      toast.success(t('cart.itemAdded'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        {product.category && (
          <nav className="text-sm text-gray-500 mb-6">
            <Link to={`/${locale}`} className="hover:text-gray-700">{t('nav.home')}</Link>
            {' / '}
            <Link to={`/${locale}/categories/${translate(product.category.slug, locale)}`} className="hover:text-gray-700">
              {translate(product.category.name, locale)}
            </Link>
            {' / '}
            <span className="text-gray-900">{name}</span>
          </nav>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <ProductImageGallery images={images} productName={name} />
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{name}</h1>

            <div className="mt-4 flex items-center gap-3">
              {salePrice != null && salePrice > 0 ? (
                <>
                  <span className="text-2xl font-bold text-red-600">{formatPrice(salePrice, currency, locale)}</span>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(price, currency, locale)}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">{formatPrice(price, currency, locale)}</span>
              )}
            </div>

            <p className={`mt-2 text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>
              {inStock ? t('product.inStock') : t('product.outOfStock')}
              {inStock && variant && variant.stock_quantity <= 5 && (
                <span className="ml-2 text-orange-500">
                  — {t('product.stockLeft', { count: variant.stock_quantity })}
                </span>
              )}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700">{t('product.variants')}</label>
                <div className="flex gap-2 mt-2">
                  {product.variants.map((v, i) => (
                    <button key={v.id} onClick={() => setSelectedVariant(i)}
                      className={`px-4 py-2 rounded-lg text-sm border ${i === selectedVariant ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-300'}`}>
                      {translate(v.name, locale) || v.sku}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50">−</button>
                <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock || adding || inCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed
                  ${inCart
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : adding
                      ? 'bg-primary-100 text-primary-400 cursor-wait'
                      : !inStock
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
              >
                {inCart ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('cart.itemAdded', 'Added to cart')}
                  </>
                ) : adding ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    {t('product.addToCart')}
                  </>
                )}
              </button>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('product.description')}</h2>
              <div className="text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: description }} />
            </div>

            {variant && <p className="mt-4 text-xs text-gray-400">{t('product.sku')}: {variant.sku}</p>}
          </div>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('product.relatedProducts')}</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}
