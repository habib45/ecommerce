import { useState, useEffect } from "react";
import { useDeliveryFee, useUpdateDeliveryFee } from "@/hooks/useStoreSettings";
import { formatPrice } from "@/lib/format";
import type { CurrencyCode } from "@/types/domain";

const CURRENCIES: { code: CurrencyCode; label: string; symbol: string; locale: string }[] = [
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en" },
  { code: "BDT", label: "Bangladeshi Taka", symbol: "৳", locale: "bn-BD" },
  { code: "SEK", label: "Swedish Krona", symbol: "kr", locale: "sv" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en" },
];

export function AdminSettings() {
  const { data: fees, isLoading } = useDeliveryFee();
  const update = useUpdateDeliveryFee();

  // Store as major units in the form (e.g. dollars, not cents)
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

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
                    currently {formatPrice(fees[code], code, code === "BDT" ? "bn-BD" : code === "SEK" ? "sv" : "en")}
                  </span>
                )}
              </div>
            ))}

            <div className="pt-4 flex items-center gap-4 border-t">
              <button
                onClick={handleSave}
                disabled={update.isPending}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {update.isPending ? "Saving…" : "Save Changes"}
              </button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ Saved successfully
                </span>
              )}
              {update.isError && (
                <span className="text-sm text-red-600">
                  Failed to save. Try again.
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
