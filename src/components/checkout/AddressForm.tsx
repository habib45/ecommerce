import { useTranslation } from 'react-i18next';
import type { Address } from '@/types/domain';
import { useLocale } from '@/hooks/useLocale';

interface AddressFormProps {
  address: Partial<Address>;
  onChange: (address: Partial<Address>) => void;
  country?: string;
}

/**
 * BRD §3.4 — address form adapted for Bangladesh (division/district/thana)
 * vs Sweden (postort/postnummer) vs standard international.
 */
export function AddressForm({ address, onChange, country }: AddressFormProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const detectedCountry = country ?? (locale === 'bn-BD' ? 'BD' : locale === 'sv' ? 'SE' : 'US');

  const update = (field: keyof Address, value: string) =>
    onChange({ ...address, [field]: value });

  return (
    <div className="space-y-4">
      <input type="text" placeholder={t('address.fullName')} value={address.full_name ?? ''}
        onChange={(e) => update('full_name', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />

      <input type="text" placeholder={t('address.addressLine1')} value={address.line1 ?? ''}
        onChange={(e) => update('line1', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />

      <input type="text" placeholder={t('address.addressLine2')} value={address.line2 ?? ''}
        onChange={(e) => update('line2', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />

      {detectedCountry === 'BD' ? (
        // Bangladesh: division → district → thana
        <>
          <input type="text" placeholder={t('address.division')} value={address.state_province ?? ''}
            onChange={(e) => update('state_province', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder={t('address.district')} value={address.district ?? ''}
              onChange={(e) => update('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            <input type="text" placeholder={t('address.thana')} value={address.thana ?? ''}
              onChange={(e) => update('thana', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          </div>
        </>
      ) : detectedCountry === 'SE' ? (
        // Sweden: postort + postnummer
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder={t('address.postnummer')} value={address.postal_code ?? ''}
            onChange={(e) => update('postal_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          <input type="text" placeholder={t('address.postort')} value={address.postort ?? ''}
            onChange={(e) => update('postort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        </div>
      ) : (
        // International
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder={t('address.city')} value={address.city ?? ''}
            onChange={(e) => update('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
          <input type="text" placeholder={t('address.postalCode')} value={address.postal_code ?? ''}
            onChange={(e) => update('postal_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        </div>
      )}

      <input type="tel" placeholder={t('address.phone')} value={address.phone ?? ''}
        onChange={(e) => update('phone', e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
    </div>
  );
}
