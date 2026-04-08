import { useState, useEffect } from "react";
import {
  useDeliveryFee,
  useUpdateDeliveryFee,
  useFreeShippingThreshold,
  useUpdateFreeShippingThreshold,
  useAnnouncementBar,
  useUpdateAnnouncementBar,
} from "@/hooks/useStoreSettings";
import type { AnnouncementBar } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/format";
import type { CurrencyCode, LocaleCode } from "@/types/domain";

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; locale: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en" },
  { code: "BDT", label: "Bangladeshi Taka", symbol: "৳", locale: "bn-BD" },
  { code: "SEK", label: "Swedish Krona", symbol: "kr", locale: "sv" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en" },
];

function localeForCurrency(code: CurrencyCode): LocaleCode {
  return code === "BDT" ? "bn-BD" : code === "SEK" ? "sv" : "en";
}

export function AdminSettings() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="space-y-8">
        <AnnouncementBarSection />
        <DeliveryFeeSection />
        <FreeShippingSection />
      </div>
    </div>
  );
}

// ─── Announcement Bar ─────────────────────────────────────────

const LOCALES = [
  { code: "en" as const, label: "English" },
  { code: "bn-BD" as const, label: "Bangla" },
  { code: "sv" as const, label: "Swedish" },
];

function AnnouncementBarSection() {
  const { data: bar, isLoading } = useAnnouncementBar();
  const update = useUpdateAnnouncementBar();

  const [enabled, setEnabled] = useState(true);
  const [texts, setTexts] = useState<Record<string, string>>({
    en: "", "bn-BD": "", sv: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (bar) {
      setEnabled(bar.enabled);
      setTexts({
        en: bar.text?.en ?? "",
        "bn-BD": bar.text?.["bn-BD"] ?? "",
        sv: bar.text?.sv ?? "",
      });
    }
  }, [bar]);

  const handleSave = async () => {
    const payload: AnnouncementBar = {
      enabled,
      text: {
        en: texts.en,
        "bn-BD": texts["bn-BD"],
        sv: texts.sv,
      },
    };
    await update.mutateAsync(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-900">Announcement Bar</h2>
        <p className="text-sm text-gray-500 mt-1">
          The banner shown at the top of the storefront. Toggle visibility and set text per language.
        </p>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="px-6 py-6 space-y-5">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Show announcement bar</p>
              <p className="text-xs text-gray-400 mt-0.5">When disabled, the bar is hidden on all pages.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? "bg-primary-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Text per locale */}
          <div className="space-y-3">
            {LOCALES.map(({ code, label }) => (
              <div key={code}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label} <span className="text-gray-400 text-xs">({code})</span>
                </label>
                <input
                  type="text"
                  value={texts[code]}
                  onChange={(e) => setTexts((v) => ({ ...v, [code]: e.target.value }))}
                  placeholder={`Announcement text in ${label}…`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>

          <SaveButton
            isPending={update.isPending}
            saved={saved}
            isError={update.isError}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  );
}

// ─── Delivery Fee ──────────────────────────────────────────────

function DeliveryFeeSection() {
  const { data: fees, isLoading } = useDeliveryFee();
  const update = useUpdateDeliveryFee();

  const [values, setValues] = useState<Record<CurrencyCode, string>>({
    USD: "", BDT: "", SEK: "", EUR: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (fees) {
      setValues({
        USD: (fees.USD / 100).toFixed(2),
        BDT: (fees.BDT / 100).toFixed(2),
        SEK: (fees.SEK / 100).toFixed(2),
        EUR: (fees.EUR / 100).toFixed(2),
      });
    }
  }, [fees]);

  const handleSave = async () => {
    const parsed: Record<CurrencyCode, number> = {
      USD: Math.round(parseFloat(values.USD || "0") * 100),
      BDT: Math.round(parseFloat(values.BDT || "0") * 100),
      SEK: Math.round(parseFloat(values.SEK || "0") * 100),
      EUR: Math.round(parseFloat(values.EUR || "0") * 100),
    };
    await update.mutateAsync(parsed);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-900">Delivery Fee</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set the flat delivery fee per currency shown to customers at checkout.
        </p>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="px-6 py-6 space-y-4">
          {CURRENCIES.map(({ code, label, symbol }) => (
            <div key={code} className="flex items-center gap-4">
              <div className="w-48">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{code}</p>
              </div>
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values[code]}
                  onChange={(e) => setValues((v) => ({ ...v, [code]: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {fees && (
                <span className="text-xs text-gray-400">
                  currently {formatPrice(fees[code], code, localeForCurrency(code))}
                </span>
              )}
            </div>
          ))}

          <SaveButton
            isPending={update.isPending}
            saved={saved}
            isError={update.isError}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  );
}

// ─── Free Shipping Threshold ───────────────────────────────────

function FreeShippingSection() {
  const { data: thresholds, isLoading } = useFreeShippingThreshold();
  const update = useUpdateFreeShippingThreshold();

  const [values, setValues] = useState<Record<CurrencyCode, string>>({
    USD: "", BDT: "", SEK: "", EUR: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (thresholds) {
      setValues({
        USD: (thresholds.USD / 100).toFixed(2),
        BDT: (thresholds.BDT / 100).toFixed(2),
        SEK: (thresholds.SEK / 100).toFixed(2),
        EUR: (thresholds.EUR / 100).toFixed(2),
      });
    }
  }, [thresholds]);

  const handleSave = async () => {
    const parsed: Record<CurrencyCode, number> = {
      USD: Math.round(parseFloat(values.USD || "0") * 100),
      BDT: Math.round(parseFloat(values.BDT || "0") * 100),
      SEK: Math.round(parseFloat(values.SEK || "0") * 100),
      EUR: Math.round(parseFloat(values.EUR || "0") * 100),
    };
    await update.mutateAsync(parsed);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-900">Free Shipping Threshold</h2>
        <p className="text-sm text-gray-500 mt-1">
          Orders above this amount qualify for free shipping. Customers see a progress bar in the cart drawer. Set to 0 to disable.
        </p>
      </div>

      {isLoading ? (
        <div className="px-6 py-8 text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="px-6 py-6 space-y-4">
          {CURRENCIES.map(({ code, label, symbol }) => (
            <div key={code} className="flex items-center gap-4">
              <div className="w-48">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{code}</p>
              </div>
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values[code]}
                  onChange={(e) => setValues((v) => ({ ...v, [code]: e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {thresholds && (
                <span className="text-xs text-gray-400">
                  currently {formatPrice(thresholds[code], code, localeForCurrency(code))}
                </span>
              )}
            </div>
          ))}

          <SaveButton
            isPending={update.isPending}
            saved={saved}
            isError={update.isError}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  );
}

// ─── Shared Save Button ────────────────────────────────────────

function SaveButton({
  isPending,
  saved,
  isError,
  onSave,
}: {
  isPending: boolean;
  saved: boolean;
  isError: boolean;
  onSave: () => void;
}) {
  return (
    <div className="pt-4 flex items-center gap-4 border-t">
      <button
        onClick={onSave}
        disabled={isPending}
        className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving…" : "Save Changes"}
      </button>
      {saved && (
        <span className="text-sm text-green-600 font-medium">
          Saved successfully
        </span>
      )}
      {isError && (
        <span className="text-sm text-red-600">
          Failed to save. Try again.
        </span>
      )}
    </div>
  );
}
