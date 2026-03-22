import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/hooks/useLocale';

interface ProductSearchProps {
  initialQuery?: string;
}

export function ProductSearch({ initialQuery = '' }: ProductSearchProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/${locale}/products?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/${locale}/products`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('search.placeholder')}
        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
      />
      <button
        type="submit"
        className="absolute right-2 text-gray-400 hover:text-blue-600"
        aria-label="Search"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}
