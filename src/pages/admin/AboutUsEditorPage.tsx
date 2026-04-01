import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  useContentBlocks,
  useCreateContentBlock,
  useUpdateContentBlock,
  useDeleteContentBlock,
} from '@/hooks/useContentBlocks';
import type { ContentBlock, TranslationMap, LocaleCode } from '@/types/domain';
import { LOCALE_CODES } from '@/types/domain';

type SectionInsert = Omit<ContentBlock, 'id'>;

const BLANK: SectionInsert = {
  type: 'about_us',
  name: { en: '', 'bn-BD': '', sv: '' },
  body: { en: '', 'bn-BD': '', sv: '' },
  cta_label: {},
  cta_url: {},
  image_url: null,
  sort_order: 0,
  is_active: true,
};

const LOCALE_LABELS: Record<LocaleCode, string> = {
  en: 'English',
  'bn-BD': 'Bangla',
  sv: 'Swedish',
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, 4, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link', 'image'],
    [{ align: [] }],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'blockquote', 'link', 'image', 'align',
];

interface SectionFormProps {
  initial: SectionInsert;
  onSave: (data: SectionInsert) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}

function SectionForm({ initial, onSave, onCancel, saving, submitLabel }: SectionFormProps) {
  const [form, setForm] = useState<SectionInsert>(initial);
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('en');

  const modules = useMemo(() => QUILL_MODULES, []);

  function setTranslation(field: 'name' | 'body', locale: LocaleCode, value: string) {
    setForm((f) => ({
      ...f,
      [field]: { ...(f[field] as TranslationMap), [locale]: value },
    }));
  }

  return (
    <div className="space-y-5">
      {/* Section titles per locale */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">Section Title</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {LOCALE_CODES.map((lc) => (
            <div key={lc}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {LOCALE_LABELS[lc]}
              </label>
              <input
                type="text"
                value={(form.name as TranslationMap)[lc] ?? ''}
                onChange={(e) => setTranslation('name', lc, e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder={`Title (${LOCALE_LABELS[lc]})`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Body content — rich text editor with locale tabs */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">Content</p>
        <div className="flex gap-1 mb-2">
          {LOCALE_CODES.map((lc) => (
            <button
              key={lc}
              type="button"
              onClick={() => setActiveLocale(lc)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t border border-b-0 transition ${
                activeLocale === lc
                  ? 'bg-white text-primary-700 border-gray-300'
                  : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
              }`}
            >
              {LOCALE_LABELS[lc]}
            </button>
          ))}
        </div>
        {LOCALE_CODES.map((lc) => (
          <div key={lc} className={activeLocale === lc ? '' : 'hidden'}>
            <ReactQuill
              theme="snow"
              value={(form.body as TranslationMap)[lc] ?? ''}
              onChange={(value) => setTranslation('body', lc, value)}
              modules={modules}
              formats={QUILL_FORMATS}
              placeholder={`Content (${LOCALE_LABELS[lc]})`}
              className="bg-white [&_.ql-editor]:min-h-[160px]"
            />
          </div>
        ))}
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
        <input
          type="url"
          value={form.image_url ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value || null }))}
          placeholder="https://example.com/image.jpg"
          className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        />
        {form.image_url && (
          <img
            src={form.image_url}
            alt="preview"
            className="mt-2 h-32 w-full object-cover rounded border"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Sort order + Active */}
      <div className="flex items-end gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <input
            type="number"
            min={0}
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            className="w-28 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none pb-2">
          <button
            type="button"
            role="switch"
            aria-checked={form.is_active}
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.is_active ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_active ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">Active</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={saving}
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

export function AdminAboutUs() {
  const { data: sections = [], isLoading } = useContentBlocks('about_us');
  const createBlock = useCreateContentBlock();
  const updateBlock = useUpdateContentBlock();
  const deleteBlock = useDeleteContentBlock();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async (data: SectionInsert) => {
    try {
      await createBlock.mutateAsync(data);
      toast.success('Section created');
      setShowAddForm(false);
    } catch {
      toast.error('Failed to create section');
    }
  };

  const handleUpdate = async (id: string, data: SectionInsert) => {
    try {
      await updateBlock.mutateAsync({ id, ...data });
      toast.success('Section updated');
      setEditingId(null);
    } catch {
      toast.error('Failed to update section');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    try {
      await deleteBlock.mutateAsync(id);
      toast.success('Section deleted');
    } catch {
      toast.error('Failed to delete section');
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Us Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage sections displayed on the About Us page. Each section supports all three languages.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition"
          >
            + Add Section
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Section</h2>
          <SectionForm
            initial={BLANK}
            onSave={handleCreate}
            onCancel={() => setShowAddForm(false)}
            saving={createBlock.isPending}
            submitLabel="Create Section"
          />
        </div>
      )}

      {/* Sections list */}
      {isLoading ? (
        <div className="text-gray-500 text-sm">Loading sections…</div>
      ) : sections.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
          No sections yet. Click <strong>+ Add Section</strong> to create the first one.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                {/* Thumbnail */}
                {section.image_url && (
                  <img
                    src={section.image_url}
                    alt=""
                    className="w-20 h-14 object-cover rounded border flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {(section.name as TranslationMap).en || <span className="text-gray-400 italic">Untitled</span>}
                  </p>
                  <div
                    className="text-xs text-gray-500 truncate mt-0.5"
                    dangerouslySetInnerHTML={{
                      __html: ((section.body as TranslationMap).en ?? '').replace(/<[^>]*>/g, '').slice(0, 120) || '—',
                    }}
                  />
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400">
                      Order: <strong>{section.sort_order}</strong>
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      section.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {section.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {/* Translation completeness */}
                    {LOCALE_CODES.map((lc) => {
                      const hasName = !!((section.name as TranslationMap)[lc]);
                      const hasBody = !!((section.body as TranslationMap)[lc]);
                      const complete = hasName && hasBody;
                      return (
                        <span key={lc} className={`text-xs ${complete ? 'text-green-600' : 'text-amber-500'}`}>
                          {lc}: {complete ? '✓' : '!'}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                  >
                    {editingId === section.id ? 'Close' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === section.id && (
                <div className="border-t p-6 bg-gray-50">
                  <SectionForm
                    initial={{
                      type: 'about_us',
                      name: section.name,
                      body: section.body,
                      cta_label: section.cta_label,
                      cta_url: section.cta_url,
                      image_url: section.image_url,
                      sort_order: section.sort_order,
                      is_active: section.is_active,
                    }}
                    onSave={(data) => handleUpdate(section.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={updateBlock.isPending}
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
