import { useLocale } from '@/hooks/useLocale';
import { LOCALE_CODES, type LocaleCode } from '@/types/domain';
import { useState, useRef, useEffect } from 'react';

const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: 'English',
  'bn-BD': 'বাংলা',
  sv: 'Svenska',
};

/**
 * BRD §3.2.2 — language switcher visible in header and footer on every page.
 * Switching locale preserves current page path without full-page reload.
 */
export function LanguageSwitcher() {
  const { locale, switchLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        aria-label="Change language"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
        </svg>
        {LOCALE_LABELS[locale]}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {LOCALE_CODES.map((code) => (
            <button
              key={code}
              onClick={() => { switchLocale(code); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                code === locale ? 'font-semibold text-primary-600' : 'text-gray-700'
              }`}
            >
              {LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
