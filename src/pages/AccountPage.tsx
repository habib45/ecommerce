import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useLocale } from '@/hooks/useLocale';
import { useAuthStore } from '@/stores/authStore';
import { useShippingAddresses, type SavedAddress } from '@/hooks/useShippingAddresses';
import { AddressForm } from '@/components/checkout/AddressForm';
import type { Address } from '@/types/domain';
import toast from 'react-hot-toast';

type EditingState =
  | { mode: 'add' }
  | { mode: 'edit'; address: SavedAddress }
  | null;

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
  return (
    <div className={`relative border rounded-lg p-4 text-sm ${address.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      {address.is_default && (
        <span className="absolute top-3 right-3 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
          Default
        </span>
      )}
      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">{address.label}</p>
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
        <button onClick={onEdit} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
        {!address.is_default && (
          <button onClick={onSetDefault} disabled={settingDefault}
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline">
            Set as default
          </button>
        )}
        <button onClick={onDelete} disabled={deleting}
          className="text-xs text-red-500 hover:text-red-700 hover:underline ml-auto">
          {deleting ? 'Removing…' : 'Remove'}
        </button>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { profile } = useAuthStore();
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
        toast.success('Address added');
      } else if (editing?.mode === 'edit') {
        await updateAddress.mutateAsync({ ...draft, id: editing.address.id, label, is_default: isDefault });
        toast.success('Address updated');
      }
      setEditing(null);
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddress.mutateAsync(id);
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await setDefault.mutateAsync(id);
    } catch {
      toast.error('Failed to update default');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const isSaving = addAddress.isPending || updateAddress.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('account.title')}</h1>
      {/* if login admin then show this block */}
      {profile?.role === 'administrator' && (
        <div className='w-full text-center'>Visit Admin Panel <Link to={`/${locale}/admin`} className="text-blue-600 hover:underline">Dashboard</Link></div>
      )}
      <br />
      <div className="space-y-6">
        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to={`/${locale}/account/orders`}
            className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-gray-900">{t('account.orders')}</h2>
            <p className="text-sm text-gray-500 mt-1">View your order history</p>
          </Link>
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h2 className="font-semibold text-gray-900">{t('account.preferences')}</h2>
            <p className="text-sm text-gray-500 mt-2">{t('account.languagePref')}: {profile?.language_pref}</p>
            <p className="text-sm text-gray-500">{t('account.currencyPref')}: {profile?.currency_pref}</p>
          </div>
        </div>

        {/* Shipping Addresses */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
            <div>
              <h2 className="font-semibold text-gray-900">Shipping Addresses</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your saved addresses for faster checkout</p>
            </div>
            {!editing && (
              <button onClick={openAdd}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
                + Add address
              </button>
            )}
          </div>

          <div className="px-6 py-5">
            {/* Add / Edit form */}
            {editing && (
              <div className="mb-6 p-5 border border-blue-200 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {editing.mode === 'add' ? 'New Address' : 'Edit Address'}
                </h3>

                {/* Label selector */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                  <div className="flex gap-2">
                    {LABELS.map((l) => (
                      <button key={l} onClick={() => setLabel(l)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          label === l ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                        }`}>
                        {l}
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="Custom…"
                      value={LABELS.includes(label) ? '' : label}
                      onChange={(e) => setLabel(e.target.value || 'Home')}
                      className="px-3 py-1 text-xs border border-gray-300 rounded-full w-24 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <AddressForm address={draft} onChange={setDraft} />

                <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
                  <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                  <span className="text-sm text-gray-600">Set as default address</span>
                </label>

                <div className="flex gap-3 mt-5">
                  <button onClick={handleSave} disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? 'Saving…' : editing.mode === 'add' ? 'Add Address' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Address list */}
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading addresses…</p>
            ) : addresses.length === 0 && !editing ? (
              <div className="text-sm text-gray-400 py-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
                No saved addresses yet.{' '}
                <button onClick={openAdd} className="text-blue-600 hover:underline">Add one now</button>
                {' '}to speed up checkout.
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
      </div>
    </div>
  );
}
