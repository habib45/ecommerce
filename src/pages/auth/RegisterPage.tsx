import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { signUpWithEmail } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUpWithEmail(email, password, fullName);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.verifyEmail')}</h1>
        <Link to={`/${locale}/login`} className="text-blue-600 hover:underline">{t('auth.login')}</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('auth.register')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder={t('address.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        <input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" required minLength={8} />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('common.loading') : t('auth.register')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link to={`/${locale}/login`} className="text-blue-600 hover:underline">{t('auth.login')}</Link>
      </p>
    </div>
  );
}
