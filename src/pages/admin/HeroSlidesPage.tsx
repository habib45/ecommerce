import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useAllHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  HeroSlide,
  HeroSlideInsert,
} from '@/hooks/useHeroSlides';

const OVERLAY_OPTIONS = [
  { label: 'Dark Blue',   value: 'from-primary-900/60 to-primary-900/40' },
  { label: 'Dark Purple', value: 'from-purple-900/60 to-indigo-900/40' },
  { label: 'Dark Pink',   value: 'from-pink-900/60 to-rose-900/40' },
  { label: 'Dark Green',  value: 'from-green-900/60 to-emerald-900/40' },
  { label: 'Dark Teal',   value: 'from-teal-900/60 to-cyan-900/40' },
  { label: 'Light Gray',  value: 'from-gray-900/30 to-gray-900/10' },
  { label: 'Dark Gray',   value: 'from-gray-900/70 to-gray-900/50' },
];

const BLANK: HeroSlideInsert = {
  title: '',
  description: '',
  image_url: '',
  bg_overlay: OVERLAY_OPTIONS[0]?.value || 'from-primary-900/60 to-indigo-900/40',
  cta_label: '',
  cta_href: '',
  show_text: true,
  show_button: true,
  is_active: true,
  height_px: 480,
  sort_order: 0,
};

interface SlideFormProps {
  initial: HeroSlideInsert;
  onSave: (data: HeroSlideInsert) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}

function SlideForm({ initial, onSave, onCancel, saving, submitLabel }: SlideFormProps) {
  const [form, setForm] = useState<HeroSlideInsert>(initial);

  const set = <K extends keyof HeroSlideInsert>(k: K, v: HeroSlideInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {/* Image URL + preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
        <input
          type="url"
          value={form.image_url}
          onChange={(e) => set('image_url', e.target.value)}
          placeholder="https://example.com/banner.jpg"
          className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          required
        />
        {form.image_url && (
          <img
            src={form.image_url}
            alt="preview"
            className="mt-2 h-32 w-full object-cover rounded border"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={form.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Welcome to Our Store"
          className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows={2}
          value={form.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Discover our exclusive collection..."
          className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Label</label>
          <input
            type="text"
            value={form.cta_label ?? ''}
            onChange={(e) => set('cta_label', e.target.value)}
            placeholder="Shop Now"
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
          <input
            type="text"
            value={form.cta_href ?? ''}
            onChange={(e) => set('cta_href', e.target.value)}
            placeholder="/en/products"
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Overlay + Height */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Color</label>
          <select
            value={form.bg_overlay}
            onChange={(e) => set('bg_overlay', e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {OVERLAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
          <input
            type="number"
            min={200}
            max={900}
            step={10}
            value={form.height_px}
            onChange={(e) => set('height_px', Number(e.target.value))}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Sort order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
        <input
          type="number"
          min={0}
          value={form.sort_order}
          onChange={(e) => set('sort_order', Number(e.target.value))}
          className="w-32 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">Lower numbers appear first.</p>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <Toggle
          label="Show text on slide"
          checked={form.show_text}
          onChange={(v) => set('show_text', v)}
        />
        <Toggle
          label="Show button on slide"
          checked={form.show_button}
          onChange={(v) => set('show_button', v)}
        />
        <Toggle
          label="Active (visible on homepage)"
          checked={form.is_active}
          onChange={(v) => set('is_active', v)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.image_url}
          className="px-5 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export function AdminHeroSlides() {
  const { data: slides = [], isLoading } = useAllHeroSlides();
  const createSlide = useCreateHeroSlide();
  const updateSlide = useUpdateHeroSlide();
  const deleteSlide = useDeleteHeroSlide();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async (data: HeroSlideInsert) => {
    try {
      await createSlide.mutateAsync(data);
      toast.success('Slide created');
      setShowAddForm(false);
    } catch {
      toast.error('Failed to create slide');
    }
  };

  const handleUpdate = async (id: string, data: HeroSlideInsert) => {
    try {
      await updateSlide.mutateAsync({ id, ...data });
      toast.success('Slide updated');
      setEditingId(null);
    } catch {
      toast.error('Failed to update slide');
    }
  };

  const handleToggle = async (slide: HeroSlide, field: 'is_active' | 'show_text' | 'show_button') => {
    try {
      await updateSlide.mutateAsync({ id: slide.id, [field]: !slide[field] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this slide? This cannot be undone.')) return;
    try {
      await deleteSlide.mutateAsync(id);
      toast.success('Slide deleted');
    } catch {
      toast.error('Failed to delete slide');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the banner slider shown on the homepage. Changes apply immediately.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition"
          >
            + Add Slide
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Slide</h2>
          <SlideForm
            initial={BLANK}
            onSave={handleCreate}
            onCancel={() => setShowAddForm(false)}
            saving={createSlide.isPending}
            submitLabel="Create Slide"
          />
        </div>
      )}

      {/* Slides list */}
      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading slides…</div>
      ) : slides.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
          No slides yet. Click <strong>+ Add Slide</strong> to create the first one.
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => (
            <div key={slide.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {/* Slide header row */}
              <div className="flex items-center gap-4 p-4">
                {/* Thumbnail */}
                <img
                  src={slide.image_url}
                  alt={slide.title ?? ''}
                  className="w-24 h-16 object-cover rounded border flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {slide.title || <span className="text-gray-400 italic">No title</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {slide.description || '—'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-400">
                      Order: <strong>{slide.sort_order}</strong>
                    </span>
                    <span className="text-xs text-gray-400">
                      Height: <strong>{slide.height_px}px</strong>
                    </span>
                    {slide.cta_label && (
                      <span className="text-xs text-gray-400 truncate max-w-xs">
                        CTA: <strong>{slide.cta_label}</strong> → {slide.cta_href}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick toggles */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <QuickToggle
                    label="Active"
                    checked={slide.is_active}
                    onChange={() => handleToggle(slide, 'is_active')}
                  />
                  <QuickToggle
                    label="Text"
                    checked={slide.show_text}
                    onChange={() => handleToggle(slide, 'show_text')}
                  />
                  <QuickToggle
                    label="Button"
                    checked={slide.show_button}
                    onChange={() => handleToggle(slide, 'show_button')}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingId(editingId === slide.id ? null : slide.id)}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                  >
                    {editingId === slide.id ? 'Close' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === slide.id && (
                <div className="border-t p-6 bg-gray-50">
                  <SlideForm
                    initial={{
                      title: slide.title,
                      description: slide.description,
                      image_url: slide.image_url,
                      bg_overlay: slide.bg_overlay,
                      cta_label: slide.cta_label,
                      cta_href: slide.cta_href,
                      show_text: slide.show_text,
                      show_button: slide.show_button,
                      is_active: slide.is_active,
                      height_px: slide.height_px,
                      sort_order: slide.sort_order,
                    }}
                    onSave={(data) => handleUpdate(slide.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={updateSlide.isPending}
                    submitLabel="Save Changes"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onChange}
        className={`w-8 h-4 rounded-full transition-colors relative ${
          checked ? 'bg-primary-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
