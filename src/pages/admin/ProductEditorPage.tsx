import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { t as tr } from "@/lib/translate";
import {
  LOCALE_CODES,
  type LocaleCode,
  type TranslationMap,
  type Category,
  type CurrencyCode,
} from "@/types/domain";
import toast from "react-hot-toast";

/**
 * BRD §3.9 — Product Editor with:
 * - Multi-language translations (EN, Bangla, Swedish)
 * - Image management
 * - Category selection
 * - Featured/Active toggles
 * - Basic variant management
 */
export function AdminProductEditor() {
  const { productId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !productId || productId === "new";
  const [activeTab, setActiveTab] = useState<LocaleCode>("en");

  // Translation fields
  const [name, setName] = useState<TranslationMap>({});
  const [shortDescription, setShortDescription] = useState<TranslationMap>({});
  const [description, setDescription] = useState<TranslationMap>({});
  const [slug, setSlug] = useState<TranslationMap>({});
  const [metaTitle, setMetaTitle] = useState<TranslationMap>({});
  const [metaDescription, setMetaDescription] = useState<TranslationMap>({});

  // Product settings
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [productType, setProductType] = useState<"physical" | "digital">(
    "physical",
  );

  // Images
  const [images, setImages] = useState<
    Array<{
      id?: string;
      url: string;
      alt_text: TranslationMap;
      sort_order: number;
    }>
  >([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Variants
  const [variants, setVariants] = useState<
    Array<{
      id?: string;
      sku: string;
      name: TranslationMap;
      prices: Record<CurrencyCode, number>;
      stock_quantity: number;
    }>
  >([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    sku: "",
    name: { en: "" },
    prices: { USD: 0, BDT: 0, SEK: 0, EUR: 0 },
    stock: 0,
  });

  // Categories for dropdown — separate key to avoid cache conflict with CategoriesPage
  const { data: categories } = useQuery({
    queryKey: ["admin-categories-dropdown"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("sort_order", { ascending: true });
      return (data ?? []) as Pick<Category, "id" | "name">[];
    },
  });

  // Load product data
  const { data: productData } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), product_variants(*)")
        .eq("id", productId)
        .single();
      return data;
    },
    enabled: !isNew,
  });

  // Populate form when data loads (works with cached data too)
  useEffect(() => {
    if (!productData) return;
    setName(productData.name as TranslationMap);
    setShortDescription(productData.short_description as TranslationMap);
    setDescription(productData.description as TranslationMap);
    setSlug(productData.slug as TranslationMap);
    setMetaTitle(productData.meta_title as TranslationMap);
    setMetaDescription(productData.meta_description as TranslationMap);
    setCategoryId(productData.category_id);
    setIsFeatured(productData.is_featured ?? false);
    setIsActive(productData.is_active);
    setProductType(productData.product_type);
    setImages(productData.product_images ?? []);
    setVariants(productData.product_variants ?? []);
  }, [productData]);

  const handleSave = async () => {
    if (!name.en) {
      toast.error("Product name (English) is required");
      return;
    }

    try {
      const productPayload = {
        name,
        short_description: shortDescription,
        description,
        slug,
        meta_title: metaTitle,
        meta_description: metaDescription,
        category_id: categoryId,
        is_featured: isFeatured,
        is_active: isActive,
        product_type: productType,
      };

      if (isNew) {
        const { data: newProduct, error: createError } = await supabase
          .from("products")
          .insert(productPayload)
          .select()
          .single();

        if (createError) {
          toast.error(createError.message);
          return;
        }

        // Add images if any
        if (images.length > 0) {
          const imagesToAdd = images.map((img, idx) => ({
            product_id: newProduct.id,
            url: img.url,
            alt_text: img.alt_text || { en: "Product image" },
            sort_order: idx,
          }));
          await supabase.from("product_images").insert(imagesToAdd);
        }

        // Add variants if any
        if (variants.length > 0) {
          const variantsToAdd = variants.map((v) => ({
            product_id: newProduct.id,
            sku: v.sku,
            name: v.name,
            prices: v.prices,
            stock_quantity: v.stock_quantity,
          }));
          await supabase.from("product_variants").insert(variantsToAdd);
        }

        toast.success("Product created successfully");
        await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        navigate("/admin/products");
        return;
      } else {
        const { error: updateError } = await supabase
          .from("products")
          .update(productPayload)
          .eq("id", productId);

        if (updateError) {
          toast.error(updateError.message);
          return;
        }

        // Delete removed images
        if (deletedImageIds.length > 0) {
          await supabase.from("product_images").delete().in("id", deletedImageIds);
        }

        // Upsert images
        for (const [idx, img] of images.entries()) {
          if (img.id) {
            await supabase
              .from("product_images")
              .update({ alt_text: img.alt_text || { en: "Product image" }, sort_order: idx })
              .eq("id", img.id);
          } else if (img.url) {
            await supabase.from("product_images").insert({
              product_id: productId,
              url: img.url,
              alt_text: img.alt_text || { en: "Product image" },
              sort_order: idx,
            });
          }
        }

        // Update variants
        for (const v of variants) {
          if (v.id) {
            await supabase
              .from("product_variants")
              .update({
                name: v.name,
                prices: v.prices,
                stock_quantity: v.stock_quantity,
              })
              .eq("id", v.id);
          } else if (v.sku) {
            await supabase.from("product_variants").insert({
              product_id: productId,
              sku: v.sku,
              name: v.name,
              prices: v.prices,
              stock_quantity: v.stock_quantity,
            });
          }
        }

        toast.success("Product updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        navigate("/admin/products");
      }
    } catch (err) {
      toast.error("Error saving product");
      console.error(err);
    }
  };

  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      setImages((prev) => [
        ...prev,
        { url: publicUrl, alt_text: { en: "" }, sort_order: prev.length },
      ]);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const addImage = () => {
    if (!newImageUrl) {
      toast.error("Image URL is required");
      return;
    }
    setImages([
      ...images,
      { url: newImageUrl, alt_text: { en: "" }, sort_order: images.length },
    ]);
    setNewImageUrl("");
  };

  const removeImage = (index: number) => {
    const img = images[index];
    if (img?.id) setDeletedImageIds((prev) => [...prev, img.id!]);
    setImages(images.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    const reordered = [...images];
    const moved = reordered.splice(from, 1)[0];
    if (!moved) return;
    reordered.splice(to, 0, moved);
    setImages(reordered.map((img, i) => ({ ...img, sort_order: i })));
  };

  const addVariant = () => {
    if (!newVariant.sku || !newVariant.name.en) {
      toast.error("SKU and variant name are required");
      return;
    }
    setVariants([
      ...variants,
      {
        sku: newVariant.sku,
        name: newVariant.name,
        prices: newVariant.prices,
        stock_quantity: newVariant.stock,
      },
    ]);
    setNewVariant({
      sku: "",
      name: { en: "" },
      prices: { USD: 0, BDT: 0, SEK: 0, EUR: 0 },
      stock: 0,
    });
    setShowVariantForm(false);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {isNew ? "New Product" : "Edit Product"}
      </h1>

      {/* Locale Tabs */}
      <div className="flex gap-1 border-b">
        {LOCALE_CODES.map((code) => (
          <button
            key={code}
            onClick={() => setActiveTab(code)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === code
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {code === "en" ? "English" : code === "bn-BD" ? "বাংলা" : "Svenska"}
            {code !== "en" && !name[code] && (
              <span className="ml-1 text-orange-500 text-xs">⚠</span>
            )}
          </button>
        ))}
      </div>

      {/* Basic Info Section */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Product Information
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name ({activeTab}) *
            {activeTab !== "en" && !name[activeTab] && (
              <span className="ml-2 text-orange-500 text-xs">Missing</span>
            )}
          </label>
          <input
            type="text"
            value={name[activeTab] ?? ""}
            onChange={(e) => setName({ ...name, [activeTab]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Premium Cotton T-Shirt"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug ({activeTab}) *
          </label>
          <input
            type="text"
            value={slug[activeTab] ?? ""}
            onChange={(e) => setSlug({ ...slug, [activeTab]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., premium-cotton-tshirt"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Description ({activeTab})
          </label>
          <textarea
            rows={2}
            value={shortDescription[activeTab] ?? ""}
            onChange={(e) =>
              setShortDescription({
                ...shortDescription,
                [activeTab]: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Brief description (shows in listings)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Description ({activeTab})
          </label>
          <textarea
            rows={6}
            value={description[activeTab] ?? ""}
            onChange={(e) =>
              setDescription({ ...description, [activeTab]: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Detailed product description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Title ({activeTab})
            </label>
            <input
              type="text"
              value={metaTitle[activeTab] ?? ""}
              onChange={(e) =>
                setMetaTitle({ ...metaTitle, [activeTab]: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="SEO title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description ({activeTab})
            </label>
            <input
              type="text"
              value={metaDescription[activeTab] ?? ""}
              onChange={(e) =>
                setMetaDescription({
                  ...metaDescription,
                  [activeTab]: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="SEO description"
            />
          </div>
        </div>
      </div>

      {/* Product Settings */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No Category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {tr(cat.name, "en") || "Untitled"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <select
              value={productType}
              onChange={(e) =>
                setProductType(e.target.value as "physical" | "digital")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              🌟 Featured Product (shows in homepage carousel)
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (visible to customers)
            </span>
          </label>
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Product Images</h2>

        {/* Upload area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            Array.from(e.dataTransfer.files).forEach(uploadImageFile);
          }}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <p className="text-sm text-gray-500 mb-2">Drag & drop images here, or</p>
          <label className={`inline-block cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 ${uploadingImage ? 'opacity-50 cursor-wait' : ''}`}>
            {uploadingImage ? 'Uploading…' : 'Choose Files'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingImage}
              onChange={(e) => Array.from(e.target.files ?? []).forEach(uploadImageFile)}
            />
          </label>
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Or paste an image URL…"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addImage()}
          />
          <button
            onClick={addImage}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
          >
            Add URL
          </button>
        </div>

        {/* Image grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="relative bg-gray-100 rounded-lg overflow-hidden group">
                <img src={img.url} alt="Product" className="w-full h-32 object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5">
                    Main image
                  </span>
                )}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={() => moveImage(idx, idx - 1)}
                      className="bg-white text-gray-700 rounded w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-gray-100"
                      title="Move left"
                    >←</button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      onClick={() => moveImage(idx, idx + 1)}
                      className="bg-white text-gray-700 rounded w-6 h-6 flex items-center justify-center text-xs shadow hover:bg-gray-100"
                      title="Move right"
                    >→</button>
                  )}
                  <button
                    onClick={() => removeImage(idx)}
                    className="bg-red-600 text-white rounded w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                    title="Remove"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No images added yet</p>
        )}
      </div>

      {/* Variants Section */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Variants & Pricing
          </h2>
          <button
            onClick={() => setShowVariantForm(!showVariantForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            {showVariantForm ? "Cancel" : "Add Variant"}
          </button>
        </div>

        {showVariantForm && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <input
              type="text"
              value={newVariant.sku}
              onChange={(e) =>
                setNewVariant({ ...newVariant, sku: e.target.value })
              }
              placeholder="SKU (e.g., SHIRT-RED-M)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newVariant.name.en ?? ""}
              onChange={(e) =>
                setNewVariant({
                  ...newVariant,
                  name: { ...newVariant.name, en: e.target.value },
                })
              }
              placeholder="Variant Name (e.g., Red - Medium)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={newVariant.prices.USD || 0}
                onChange={(e) =>
                  setNewVariant({
                    ...newVariant,
                    prices: {
                      ...newVariant.prices,
                      USD: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="USD Price (cents)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newVariant.prices.BDT || 0}
                onChange={(e) =>
                  setNewVariant({
                    ...newVariant,
                    prices: {
                      ...newVariant.prices,
                      BDT: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="BDT Price"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newVariant.prices.SEK || 0}
                onChange={(e) =>
                  setNewVariant({
                    ...newVariant,
                    prices: {
                      ...newVariant.prices,
                      SEK: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="SEK Price"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                value={newVariant.prices.EUR || 0}
                onChange={(e) =>
                  setNewVariant({
                    ...newVariant,
                    prices: {
                      ...newVariant.prices,
                      EUR: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="EUR Price"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <input
              type="number"
              value={newVariant.stock}
              onChange={(e) =>
                setNewVariant({
                  ...newVariant,
                  stock: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Stock Quantity"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={addVariant}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
            >
              Save Variant
            </button>
          </div>
        )}

        {variants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">SKU</th>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">
                    Prices (USD/BDT/SEK/EUR)
                  </th>
                  <th className="text-center px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {variants.map((v, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 font-mono text-xs">{v.sku}</td>
                    <td className="px-3 py-2">{v.name.en || "Unnamed"}</td>
                    <td className="px-3 py-2 text-xs">
                      ${v.prices.USD} / ৳{v.prices.BDT} / {v.prices.SEK}kr / €
                      {v.prices.EUR}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {v.stock_quantity}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeVariant(idx)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {variants.length === 0 && (
          <p className="text-sm text-gray-500">
            No variants added yet. You can have multiple variants per product
            (sizes, colors, etc.)
          </p>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          {isNew ? "Create Product" : "Save Changes"}
        </button>
        <p className="text-xs text-gray-500 py-3">* Required fields</p>
      </div>
    </div>
  );
}
