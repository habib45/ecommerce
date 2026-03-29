import { LOCALE_CODES, type LocaleCode } from '@/types/domain';
import { useState } from 'react';

/**
 * BRD §3.2.6 — Translation Management section:
 * completeness indicators, XLIFF export/import, DeepL auto-translate.
 */
export function AdminTranslations() {
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('bn-BD');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Translation Management</h1>

      <div className="flex gap-4 mb-6">
        {LOCALE_CODES.filter((c) => c !== 'en').map((code) => (
          <button key={code} onClick={() => setActiveLocale(code)}
            className={`px-4 py-2 rounded-lg text-sm ${activeLocale === code ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {code === 'bn-BD' ? 'Bangla' : 'Swedish'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Products</p>
          <p className="text-2xl font-bold">73%</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold">100%</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Email Templates</p>
          <p className="text-2xl font-bold">66%</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          Export XLIFF ({activeLocale})
        </button>
        <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          Import XLIFF
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
          Auto-translate (DeepL)
        </button>
      </div>
    </div>
  );
}
