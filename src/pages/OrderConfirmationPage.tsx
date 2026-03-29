import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';

export function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-green-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('checkout.orderConfirmed')}</h1>
      <p className="text-gray-600 mb-2">{t('checkout.thankYou')}</p>
      <p className="text-sm text-gray-500 mb-8">{t('checkout.orderNumber', { number: orderId?.slice(0, 8) })}</p>
      <Link to={`/${locale}/products`} className="text-primary-600 hover:underline">{t('checkout.continueShopping')}</Link>
    </div>
  );
}
