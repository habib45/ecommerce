import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };

  if (sent) return <div className="max-w-md mx-auto px-4 py-16 text-center"><p>{t('auth.passwordResetSent')}</p></div>;

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t('auth.resetPassword')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        <button type="submit" className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700">
          {t('auth.sendResetLink')}
        </button>
      </form>
    </div>
  );
}
