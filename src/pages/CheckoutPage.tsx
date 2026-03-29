import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useLocale } from '@/hooks/useLocale';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useShippingAddresses } from '@/hooks/useShippingAddresses';
import { AddressForm } from '@/components/checkout/AddressForm';
import { StripePayment } from '@/components/checkout/StripePayment';
import { callEdgeFunction } from '@/lib/supabase/client';
import type { Address } from '@/types/domain';
import toast from 'react-hot-toast';

export function CheckoutPage() {
  const { t } = useTranslation();
  const { locale, currency } = useLocale();
  const navigate = useNavigate();
  const { cartId, items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { addresses, isLoading: loadingAddresses, defaultAddress, addAddress } = useShippingAddresses();

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new' | null>(null);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({});
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');

  // Auto-select default address once loaded
  useEffect(() => {
    if (!loadingAddresses && selectedAddressId === null) {
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (addresses.length === 0 || !user) {
        setSelectedAddressId('new');
      }
    }
  }, [loadingAddresses, defaultAddress, addresses.length, user]);

  const activeAddress: Partial<Address> | null =
    selectedAddressId === 'new'
      ? newAddress
      : addresses.find((a) => a.id === selectedAddressId) ?? null;

  const handleContinueToPayment = async () => {
    if (!activeAddress?.full_name || !activeAddress?.line1) {
      toast.error('Please fill in your shipping address');
      return;
    }
    if (selectedAddressId === 'new' && saveNewAddress && user) {
      await addAddress.mutateAsync({ ...newAddress, label: newAddressLabel, is_default: addresses.length === 0 });
    }
    setStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      await callEdgeFunction('confirm-order', {
        paymentIntentId,
        cartId,
        shippingAddress: activeAddress,
        locale,
        currency,
      });
    } catch (err: any) {
      console.warn('confirm-order:', err.message);
    }
    await clearCart();
    navigate(`/${locale}/order-confirmation/${paymentIntentId}`);
  };

  return (
    <>
      <Helmet><title>{t('checkout.title')}</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          <span className={`text-sm font-medium ${step === 'address' ? 'text-blue-600' : 'text-gray-400'}`}>
            1. {t('checkout.shippingAddress')}
          </span>
          <span className="text-gray-300">→</span>
          <span className={`text-sm font-medium ${step === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
            2. {t('checkout.payment')}
          </span>
        </div>

        {step === 'address' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">{t('checkout.shippingAddress')}</h2>

            {/* Saved addresses (logged-in only) */}
            {user && !loadingAddresses && addresses.length > 0 && (
              <div className="space-y-3 mb-5">
                {addresses.map((addr) => (
                  <label key={addr.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="address" value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-blue-600" />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{addr.full_name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      <p className="text-gray-500 mt-0.5">{addr.phone}</p>
                      <p className="text-gray-600 mt-1">
                        {[addr.line1, addr.city, addr.state_province, addr.postal_code, addr.country]
                          .filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}

                {/* Use a new address option */}
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="address" value="new"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                    className="mt-1 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Use a different address</span>
                </label>
              </div>
            )}

            {/* New address form */}
            {(selectedAddressId === 'new' || !user || addresses.length === 0) && (
              <div className="space-y-4">
                <AddressForm address={newAddress} onChange={setNewAddress} />

                {user && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-600">Save this address to my account</span>
                    </label>
                    {saveNewAddress && (
                      <div className="flex gap-2 ml-6">
                        {['Home', 'Office', 'Other'].map((l) => (
                          <button key={l} onClick={() => setNewAddressLabel(l)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              newAddressLabel === l
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-300'
                            }`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={handleContinueToPayment}
              className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
              {t('common.next')}
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div>
            {/* Address summary */}
            {activeAddress && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{activeAddress.full_name}</p>
                    <p className="text-gray-500 mt-0.5">
                      {[activeAddress.line1, activeAddress.city, activeAddress.country]
                        .filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <button onClick={() => setStep('address')}
                    className="text-blue-600 text-xs hover:underline shrink-0 ml-4">
                    Change
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold mb-4">{t('checkout.payment')}</h2>
            {!cartId ? (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
                {t('checkout.loginRequired', 'Please log in to complete your purchase.')}
              </div>
            ) : items.length === 0 ? (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">
                Your cart is empty.{' '}
                <a href={`/${locale}/products`} className="underline">Continue shopping</a>
              </div>
            ) : (
              <StripePayment cartId={cartId} onSuccess={handlePaymentSuccess}
                onError={(err) => toast.error(err)} />
            )}
            <button onClick={() => setStep('address')} className="mt-4 text-sm text-gray-500 hover:underline">
              ← {t('common.back')}
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400 text-center">
          {t('checkout.termsOfService')} · {t('checkout.privacyPolicy')}
        </p>
      </div>
    </>
  );
}
