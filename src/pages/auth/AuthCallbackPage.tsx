import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const locale = session?.user?.user_metadata?.language_pref ?? 'en';
      navigate(`/${locale}`, { replace: true });
    });
  }, [navigate]);

  return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
}
