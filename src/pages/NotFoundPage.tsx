import { Link } from 'react-router-dom';
import { useLocale } from '@/hooks/useLocale';

export function NotFoundPage() {
  const { locale } = useLocale();
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Page not found</p>
      <Link to={`/${locale}`} className="text-primary-600 hover:underline">Go home</Link>
    </div>
  );
}
