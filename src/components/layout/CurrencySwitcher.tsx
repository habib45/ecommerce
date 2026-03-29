import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import type { CurrencyCode } from '@/types/domain';
import { useState, useRef, useEffect } from 'react';

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'BDT', label: 'Taka', symbol: '৳' },
  { code: 'SEK', label: 'Krona', symbol: 'kr' },
];

// BRD §3.3 — currency stored independently from language preference
export function CurrencySwitcher() {
  const { currency } = useLocale();
  const updateCurrencyPref = useAuthStore((s) => s.updateCurrencyPref);
  const setCurrency = useCartStore((s) => s.setCurrency);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = async (code: CurrencyCode) => {
    setCurrency(code);
    await updateCurrencyPref(code).catch(() => {});
    setOpen(false);
  };

  const current = CURRENCIES.find((c) => c.code === currency);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        {current?.symbol} {current?.code}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => handleChange(c.code)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                c.code === currency ? 'font-semibold text-primary-600' : 'text-gray-700'
              }`}
            >
              {c.symbol} {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
