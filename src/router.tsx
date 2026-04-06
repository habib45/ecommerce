import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LOCALE_CODES, DEFAULT_LOCALE } from '@/types/domain';
import { LocaleLayout } from '@/components/layout/LocaleLayout';
import { HomePage } from '@/pages/HomePage';
import { ProductListPage } from '@/pages/ProductListPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage';
import { AccountPage } from '@/pages/AccountPage';
import { OrderHistoryPage } from '@/pages/OrderHistoryPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { ReturnRequestPage } from '@/pages/ReturnRequestPage';
import { CategoriesListPage } from '@/pages/CategoriesListPage';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/DashboardPage';
import { AdminProducts } from '@/pages/admin/ProductsPage';
import { AdminProductEditor } from '@/pages/admin/ProductEditorPage';
import { AdminOrders } from '@/pages/admin/OrdersPage';
import { AdminOrderDetail } from '@/pages/admin/OrderDetailPage';
import { AdminSettings } from '@/pages/admin/SettingsPage';
import { AdminCustomers } from '@/pages/admin/CustomersPage';
import { AdminTranslations } from '@/pages/admin/TranslationPage';
import { AdminReturns } from '@/pages/admin/ReturnsPage';
import { AdminCategories } from '@/pages/admin/CategoriesPage';
import { AdminCategoryEditor } from '@/pages/admin/CategoryEditorPage';
import { AdminHeroSlides } from '@/pages/admin/HeroSlidesPage';
import { AdminAboutUs } from '@/pages/admin/AboutUsEditorPage';
import { AdminMediaLibrary } from '@/pages/admin/MediaLibraryPage';
import { AdminVisitorAnalytics } from '@/pages/admin/VisitorAnalyticsPage';
import { AboutUsPage } from '@/pages/AboutUsPage';
import { ContactUsPage } from '@/pages/ContactUsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { FAQPage } from '@/pages/FAQPage';

/**
 * BRD §3.2.2 — locale detection order:
 * 1. URL path prefix (/en/, /bn-BD/, /sv/)
 * 2. User profile language_pref
 * 3. Browser Accept-Language
 * 4. Default (en)
 */
function detectLocale(): string {
  // Check cookie first (BRD §3.2.2 — NEXT_LOCALE with 1-year TTL)
  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith('NEXT_LOCALE='));
  if (cookie) {
    const val = cookie.split('=')[1];
    if (val && LOCALE_CODES.includes(val as typeof LOCALE_CODES[number])) return val;
  }

  // Browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('bn')) return 'bn-BD';
  if (browserLang.startsWith('sv')) return 'sv';

  return DEFAULT_LOCALE;
}

export const router = createBrowserRouter([
  // BRD §3.2.2 — root URL detects preferred locale and issues redirect
  {
    path: '/',
    element: <Navigate to={`/${detectLocale()}`} replace />,
  },

  // Auth callback (locale-independent)
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },

  // All locale-prefixed routes
  {
    path: '/:locale',
    element: <LocaleLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'categories', element: <CategoriesListPage /> },
      { path: 'categories/:categorySlug', element: <ProductListPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-confirmation/:orderId', element: <OrderConfirmationPage /> },

      // Auth
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },

      // Account
      { path: 'account', element: <AccountPage /> },
      { path: 'account/orders', element: <OrderHistoryPage /> },
      { path: 'account/orders/:orderId', element: <OrderDetailPage /> },
      { path: 'account/orders/:orderId/return', element: <ReturnRequestPage /> },

      // Informational pages
      { path: 'about', element: <AboutUsPage /> },
      { path: 'contact', element: <ContactUsPage /> },
      { path: 'faq', element: <FAQPage /> },

      //admin 
      { path: 'admin', element: <AdminLayout />, children: [
        { index: true, element: <AdminDashboard /> },
      ]},
      // Catch-all
      { path: '*', element: <NotFoundPage /> },
    ],
  },

  // Admin (English only per BRD §3.9)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'products/new', element: <AdminProductEditor /> },
      { path: 'products/:productId', element: <AdminProductEditor /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'orders/:orderId', element: <AdminOrderDetail /> },
      { path: 'customers', element: <AdminCustomers /> },
      { path: 'visitor-analytics', element: <AdminVisitorAnalytics /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'categories/new', element: <AdminCategoryEditor /> },
      { path: 'categories/:categoryId', element: <AdminCategoryEditor /> },
      { path: 'hero-slides', element: <AdminHeroSlides /> },
      { path: 'about-us', element: <AdminAboutUs /> },
      { path: 'media', element: <AdminMediaLibrary /> },
      { path: 'translations', element: <AdminTranslations /> },
      { path: 'returns', element: <AdminReturns /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
]);
