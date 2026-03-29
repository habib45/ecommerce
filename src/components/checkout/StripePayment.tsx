import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';
import { getStripe } from '@/lib/stripe/client';
import { callEdgeFunction } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/useLocale';

interface StripePaymentProps {
  cartId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({ onSuccess, onError }: { onSuccess: (id: string) => void; onError: (err: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? t('common.error'));
      setProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? t('checkout.processing') : t('checkout.placeOrder')}
      </button>
    </form>
  );
}

/**
 * BRD §3.6.1 — Stripe Payment Element initialised with customer locale.
 * BRD §3.6.2 — PaymentIntent created via Edge Function; secret key never in frontend.
 */
export function StripePayment({ cartId, onSuccess, onError }: StripePaymentProps) {
  const { locale, currency } = useLocale();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    async function createIntent() {
      try {
        const { clientSecret } = await callEdgeFunction<{ clientSecret: string }>(
          'create-payment-intent',
          { cartId, currency, locale },
        );
        setClientSecret(clientSecret);
      } catch (err: any) {
        onError(err.message);
      }
    }
    createIntent();
  }, [cartId, currency, locale, onError]);

  if (!clientSecret) return <div className="animate-pulse h-40 bg-gray-100 rounded-lg" />;

  return (
    <Elements stripe={getStripe(locale)} options={{ clientSecret, locale: (locale === 'bn-BD' ? 'bn' : locale) as any }}>
      <PaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
