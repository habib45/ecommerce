import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';
import { useShippingAddresses, type SavedAddress } from '@/hooks/useShippingAddresses';
import { AddressForm } from '@/components/checkout/AddressForm';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/lib/format';
import type { Address, Order } from '@/types/domain';
import toast from 'react-hot-toast';

// ─── Sidebar Navigation Items ────────────────────────────────────
type Tab = 'dashboard' | 'orders' | 'addresses' | 'settings';

// ─── SVG Icon Components ─────────────────────────────────────────
function DashboardIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zm10-2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z" />
    </svg>
  );
}

function OrdersIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function AddressIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SignOutIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ShoppingIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function AdminIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

// ─── Order Status Badge ──────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  payment_confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-blue-100 text-blue-700',
  partially_shipped: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  refunded: 'bg-orange-100 text-orange-700',
  disputed: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {t(`order.status.${status}`)}
    </span>
  );
}

// ─── Profile Avatar ──────────────────────────────────────────────
function ProfileAvatar({ name, size = 'lg' }: { name: string | null; size?: 'sm' | 'lg' }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold shadow-md`}>
      {initials}
    </div>
  );
}

// ─── Address Card ────────────────────────────────────────────────
const LABELS = ['Home', 'Office', 'Other'];

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  deleting,
  settingDefault,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  deleting: boolean;
  settingDefault: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`relative border rounded-xl p-5 text-sm transition-all hover:shadow-md ${address.is_default ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-200' : 'border-gray-200 bg-white'}`}>
      {address.is_default && (
        <span className="absolute top-3 right-3 text-xs font-medium text-primary-600 bg-primary-100 px-2.5 py-0.5 rounded-full">
          {t('account.default')}
        </span>
      )}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{address.label}</p>
      <p className="font-semibold text-gray-900">{address.full_name}</p>
      {address.phone && <p className="text-gray-500 mt-0.5">{address.phone}</p>}
      <div className="mt-2 text-gray-600 space-y-0.5">
        {address.line1 && <p>{address.line1}</p>}
        {address.line2 && <p>{address.line2}</p>}
        {address.thana && <p>{address.thana}</p>}
        {address.district && <p>{address.district}</p>}
        <p>{[address.city, address.state_province, address.postort, address.postal_code].filter(Boolean).join(', ')}</p>
        {address.country && <p>{address.country}</p>}
      </div>
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
        <button onClick={onEdit} className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium">{t('common.edit')}</button>
        {!address.is_default && (
          <button onClick={onSetDefault} disabled={settingDefault}
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
            {t('account.setAsDefault')}
          </button>
        )}
        <button onClick={onDelete} disabled={deleting}
          className="text-xs text-red-500 hover:text-red-700 hover:underline ml-auto">
          {deleting ? t('account.removing') : t('account.remove')}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────────────
function DashboardTab({
  orders,
  ordersLoading,
  addressCount,
}: {
  orders: Order[];
  ordersLoading: boolean;
  addressCount: number;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <OrdersIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-500">{t('account.totalOrders')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
              <AddressIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{addressCount}</p>
              <p className="text-sm text-gray-500">{t('account.savedAddresses')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{t('account.recentOrders')}</h3>
          {orders.length > 0 && (
            <Link to={`/${locale}/account/orders`} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              {t('account.viewAllOrders')}
              <ChevronRightIcon />
            </Link>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {ordersLoading ? (
            <div className="px-5 py-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <Link key={order.id} to={`/${locale}/account/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                    #{order.order_number}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {t('account.orderPlaced')} {formatDate(order.created_at, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(order.total, order.currency, locale)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                </div>
              </Link>
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <ShoppingIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">{t('account.noRecentOrders')}</p>
              <Link to={`/${locale}/products`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700">
                {t('account.startShopping')}
                <ChevronRightIcon />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">{t('account.quickActions')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('account.orders'), icon: <OrdersIcon />, to: `/${locale}/account/orders` },
            { label: t('nav.products'), icon: <ShoppingIcon />, to: `/${locale}/products` },
            { label: t('account.addresses'), icon: <AddressIcon />, to: '#addresses' },
            { label: t('nav.contact'), icon: <SettingsIcon />, to: `/${locale}/contact` },
          ].map((action) => (
            <Link key={action.label} to={action.to}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-primary-200 transition-all text-center group">
              <div className="w-10 h-10 bg-gray-50 group-hover:bg-primary-50 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-primary-600 transition-colors">
                {action.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-primary-600">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Orders Tab ──────────────────────────────────────────────────
function OrdersTab({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
        <ShoppingIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">{t('account.noOrders')}</p>
        <Link to={`/${locale}/products`}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          {t('account.startShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
      {orders.map((order) => (
        <Link key={order.id} to={`/${locale}/account/orders/${order.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
          <div className="min-w-0">
            <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">#{order.order_number}</p>
            <p className="text-sm text-gray-500 mt-0.5">{t('account.orderPlaced')} {formatDate(order.created_at, locale)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatPrice(order.total, order.currency, locale)}</p>
              <StatusBadge status={order.status} />
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Addresses Tab ───────────────────────────────────────────────
type EditingState =
  | { mode: 'add' }
  | { mode: 'edit'; address: SavedAddress }
  | null;

function AddressesTab() {
  const { t } = useTranslation();
  const { addresses, isLoading, addAddress, updateAddress, deleteAddress, setDefault } = useShippingAddresses();

  const [editing, setEditing] = useState<EditingState>(null);
  const [draft, setDraft] = useState<Partial<Address>>({});
  const [label, setLabel] = useState('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const openAdd = () => {
    setDraft({});
    setLabel('Home');
    setIsDefault(addresses.length === 0);
    setEditing({ mode: 'add' });
  };

  const openEdit = (addr: SavedAddress) => {
    setDraft(addr);
    setLabel(addr.label);
    setIsDefault(addr.is_default);
    setEditing({ mode: 'edit', address: addr });
  };

  const handleSave = async () => {
    try {
      if (editing?.mode === 'add') {
        await addAddress.mutateAsync({ ...draft, label, is_default: isDefault });
        toast.success(t('account.addAddress'));
      } else if (editing?.mode === 'edit') {
        await updateAddress.mutateAsync({ ...draft, id: editing.address.id, label, is_default: isDefault });
        toast.success(t('account.saveChanges'));
      }
      setEditing(null);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddress.mutateAsync(id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefault.mutateAsync(id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const isSaving = addAddress.isPending || updateAddress.isPending;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <div>
          <h3 className="font-semibold text-gray-900">{t('account.shippingAddresses')}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{t('account.manageAddressesDesc')}</p>
        </div>
        {!editing && (
          <button onClick={openAdd}
            className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors">
            + {t('account.addAddress')}
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Add / Edit form */}
        {editing && (
          <div className="mb-6 p-5 border border-primary-200 bg-primary-50/50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editing.mode === 'add' ? t('account.newAddress') : t('account.editAddress')}
            </h3>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('account.labelField')}</label>
              <div className="flex gap-2">
                {LABELS.map((l) => (
                  <button key={l} onClick={() => setLabel(l)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      label === l ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}>
                    {l}
                  </button>
                ))}
                <input
                  type="text"
                  placeholder="Custom..."
                  value={LABELS.includes(label) ? '' : label}
                  onChange={(e) => setLabel(e.target.value || 'Home')}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-full w-24 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>

            <AddressForm address={draft} onChange={setDraft} />

            <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600" />
              <span className="text-sm text-gray-600">{t('account.setAsDefault')}</span>
            </label>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={isSaving}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {isSaving ? t('account.saving') : editing.mode === 'add' ? t('account.addAddressBtn') : t('account.saveChanges')}
              </button>
              <button onClick={() => setEditing(null)}
                className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Address list */}
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 && !editing ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <AddressIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {t('account.noAddresses')}{' '}
              <button onClick={openAdd} className="text-primary-600 hover:underline font-medium">{t('account.addOneNow')}</button>
              {' '}{t('account.speedUpCheckout')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => openEdit(addr)}
                onDelete={() => handleDelete(addr.id)}
                onSetDefault={() => handleSetDefault(addr.id)}
                deleting={deletingId === addr.id}
                settingDefault={settingDefaultId === addr.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────
function SettingsTab() {
  const { t } = useTranslation();
  const { profile } = useAuthStore();
  const { locale } = useLocale();

  const languageLabels: Record<string, string> = {
    en: 'English',
    'bn-BD': 'Bangla (Bengali)',
    sv: 'Swedish',
  };

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">{t('account.personalInfo')}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">{t('account.name')}</p>
              <p className="font-medium text-gray-900">{profile?.full_name ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">{t('account.email')}</p>
              <p className="font-medium text-gray-900">{profile?.email ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">{t('account.preferences')}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">{t('account.languagePref')}</p>
              <p className="font-medium text-gray-900">{languageLabels[profile?.language_pref ?? locale] ?? profile?.language_pref}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-gray-500">{t('account.currencyPref')}</p>
              <p className="font-medium text-gray-900">{profile?.currency_pref ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Account Page ───────────────────────────────────────────
export function AccountPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { profile, user, signOut } = useAuthStore();
  const { addresses } = useShippingAddresses();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data ?? []) as Order[];
    },
    enabled: !!user,
  });

  const memberSince = user?.created_at
    ? formatDate(user.created_at, locale, { dateStyle: 'long' })
    : '';

  const sidebarItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: t('account.dashboard'), icon: <DashboardIcon /> },
    { key: 'orders', label: t('account.orders'), icon: <OrdersIcon /> },
    { key: 'addresses', label: t('account.addresses'), icon: <AddressIcon /> },
    { key: 'settings', label: t('account.settings'), icon: <SettingsIcon /> },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Profile Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <ProfileAvatar name={profile?.full_name ?? null} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {t('account.welcome')}, {profile?.full_name ?? t('account.profile')}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
            {memberSince && (
              <p className="text-xs text-gray-400 mt-1">{t('account.memberSince', { date: memberSince })}</p>
            )}
          </div>
          {profile?.role === 'administrator' && (
            <Link to={`/${locale}/admin`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors">
              <AdminIcon className="w-4 h-4" />
              {t('account.adminPanel')}
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0">
          <nav className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Mobile admin link */}
            {profile?.role === 'administrator' && (
              <Link to={`/${locale}/admin`}
                className="flex sm:hidden items-center gap-3 px-4 py-3 text-sm font-medium text-primary-600 bg-primary-50 border-b border-primary-100">
                <AdminIcon className="w-5 h-5" />
                {t('account.adminPanel')}
              </Link>
            )}

            {/* Tab buttons */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {sidebarItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors w-full text-left ${
                    activeTab === item.key
                      ? 'text-primary-600 bg-primary-50 border-b-2 lg:border-b-0 lg:border-l-3 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 lg:border-b-0 lg:border-l-3 border-transparent'
                  }`}
                >
                  <span className={activeTab === item.key ? 'text-primary-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <SignOutIcon className="w-5 h-5" />
                {t('account.signOut')}
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardTab orders={orders} ordersLoading={ordersLoading} addressCount={addresses.length} />
          )}
          {activeTab === 'orders' && (
            <OrdersTab orders={orders} loading={ordersLoading} />
          )}
          {activeTab === 'addresses' && (
            <AddressesTab />
          )}
          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </main>
      </div>
    </div>
  );
}
