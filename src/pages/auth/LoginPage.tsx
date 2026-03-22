import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import toast from 'react-hot-toast';

export function LoginPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuthStore();
  const mergeGuestCart = useCartStore((s) => s.mergeGuestCart);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      const { user } = useAuthStore.getState();
      if (user) await mergeGuestCart(user.id);
      navigate(`/${locale}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('auth.login')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        <input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? t('common.loading') : t('auth.login')}
        </button>
      </form>
      <div className="mt-6">
        <p className="text-center text-sm text-gray-500 mb-4">{t('auth.orContinueWith')}</p>
        <div className="flex gap-3">
          <button onClick={signInWithGoogle} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">{t('auth.google')}</button>
          <button onClick={signInWithApple} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50">{t('auth.apple')}</button>
        </div>
      </div>
      <div className="mt-6 text-center text-sm">
        <Link to={`/${locale}/reset-password`} className="text-blue-600 hover:underline">{t('auth.forgotPassword')}</Link>
        <p className="mt-2 text-gray-500">
          {t('auth.dontHaveAccount')}{' '}
          <Link to={`/${locale}/register`} className="text-blue-600 hover:underline">{t('auth.register')}</Link>
        </p>
      </div>
    </div>
  );
}
