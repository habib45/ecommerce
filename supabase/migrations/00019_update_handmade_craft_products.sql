-- Migration 00019: Full replacement of all products with handmade craft items
-- Fixes product_type 'simple' → 'physical', adds 4-5 images per product
-- Full en / bn-BD / sv translations on every field

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Wipe existing product data in dependency order
--    order_items.variant_id → product_variants (no CASCADE), must clear first
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove order items that reference variants of existing products
DELETE FROM public.order_items
WHERE variant_id IN (
  SELECT pv.id FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
);

-- Remove return_requests referencing orders that will become empty
DELETE FROM public.return_requests
WHERE order_id IN (
  SELECT DISTINCT o.id FROM public.orders o
  WHERE o.id NOT IN (
    SELECT DISTINCT order_id FROM public.order_items
    WHERE order_id IS NOT NULL
  )
);

-- Remove orders that are now empty (no remaining items)
DELETE FROM public.orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM public.order_items);

-- Remove cart items referencing the same variants
DELETE FROM public.cart_items
WHERE variant_id IN (
  SELECT pv.id FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
);

-- Now safe to delete products (cascades to product_variants and product_images)
DELETE FROM public.products;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Upsert "Handmade Crafts" category
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.categories (id, name, slug, description, is_active, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Handmade Crafts',
    'bn-BD', 'হস্তনির্মিত শিল্পকর্ম',
    'sv',    'Hantverksprodukter'
  ),
  jsonb_build_object(
    'en',    'handmade-crafts',
    'bn-BD', 'hastanirmita-shilpakarma',
    'sv',    'hantverksprodukter'
  ),
  jsonb_build_object(
    'en',    'Unique handmade items crafted with care and tradition.',
    'bn-BD', 'যত্ন ও ঐতিহ্যের সাথে তৈরি অনন্য হস্তনির্মিত আইটেম।',
    'sv',    'Unika handgjorda föremål tillverkade med omsorg och tradition.'
  ),
  true, 1
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      slug        = EXCLUDED.slug,
      description = EXCLUDED.description,
      is_active   = EXCLUDED.is_active,
      sort_order  = EXCLUDED.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Products
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Product 1: Handmade Ceramic Mug ─────────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Handmade Ceramic Mug',
    'bn-BD', 'হস্তনির্মিত সিরামিক মগ',
    'sv',    'Handgjord keramikmugg'
  ),
  jsonb_build_object(
    'en',    'handmade-ceramic-mug',
    'bn-BD', 'hastanirmita-ceramic-mag',
    'sv',    'handgjord-keramikmugg'
  ),
  jsonb_build_object(
    'en',    'Each mug is wheel-thrown and hand-glazed by our studio potter, giving it a truly one-of-a-kind appearance. The food-safe glaze is lead-free, microwave-safe, and dishwasher-safe. Made from high-fire stoneware clay that retains heat beautifully. No two mugs are identical — slight variations in glaze pooling and texture are hallmarks of authentic studio pottery.',
    'bn-BD', 'প্রতিটি মগ আমাদের স্টুডিও কুম্ভকার দ্বারা চাকায় তৈরি এবং হাতে গ্লেজ করা হয়েছে, এটিকে সত্যিকারের অনন্য চেহারা দেয়। ফুড-সেফ গ্লেজ সীসামুক্ত, মাইক্রোওয়েভ-নিরাপদ এবং ডিশওয়াশার-নিরাপদ। উচ্চ-তাপমাত্রায় ফায়ার করা স্টোনওয়্যার মাটি থেকে তৈরি যা সুন্দরভাবে তাপ ধরে রাখে। কোনো দুটি মগ অভিন্ন নয়।',
    'sv',    'Varje mugg är hjulkastad och handglaserad av vår studiokrukiare, vilket ger den ett unikt utseende. Den livsmedelssäkra glasyrn är blyfri, mikrovågssäker och diskmaskinsäker. Tillverkad av högbränd stengodslera som håller värmen utmärkt. Inga två muggar är identiska.'
  ),
  jsonb_build_object(
    'en',    'Wheel-thrown stoneware mug, hand-glazed and food-safe. Each piece unique.',
    'bn-BD', 'চাকায় তৈরি স্টোনওয়্যার মগ, হাতে গ্লেজ করা এবং ফুড-সেফ। প্রতিটি টুকরো অনন্য।',
    'sv',    'Hjulkastad stengods-mugg, handglaserad och livsmedelssäker. Varje stycke unikt.'
  ),
  jsonb_build_object(
    'en',    'Handmade Ceramic Mug | Studio Pottery',
    'bn-BD', 'হস্তনির্মিত সিরামিক মগ | স্টুডিও পটারি',
    'sv',    'Handgjord keramikmugg | Studiokeramik'
  ),
  jsonb_build_object(
    'en',    'Unique wheel-thrown ceramic mug, hand-glazed in our studio. Microwave and dishwasher safe.',
    'bn-BD', 'আমাদের স্টুডিওতে হাতে গ্লেজ করা অনন্য চাকায় তৈরি সিরামিক মগ।',
    'sv',    'Unik hjulkastad keramikmugg, handglaserad i vårt studio. Mikrovågs- och diskmaskinsäker.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'CER-MUG-SM',
   jsonb_build_object('en','Small (8 oz / 240 ml)','bn-BD','ছোট (৮ আউন্স / ২৪০ মিলি)','sv','Liten (8 oz / 240 ml)'),
   jsonb_build_object('USD',1800,'BDT',198000,'SEK',22000), 40, true),
  ('a1000000-0000-0000-0000-000000000001', 'CER-MUG-LG',
   jsonb_build_object('en','Large (12 oz / 350 ml)','bn-BD','বড় (১২ আউন্স / ৩৫০ মিলি)','sv','Stor (12 oz / 350 ml)'),
   jsonb_build_object('USD',2400,'BDT',264000,'SEK',29000), 35, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
   jsonb_build_object('en','Handmade ceramic mug in earthy tones on wooden surface','bn-BD','কাঠের পৃষ্ঠে মাটির রঙে হস্তনির্মিত সিরামিক মগ','sv','Handgjord keramikmugg i jordtoner på träunderlag'), 0),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
   jsonb_build_object('en','Close-up of hand-applied glaze detail on ceramic mug','bn-BD','সিরামিক মগে হাতে লাগানো গ্লেজ বিবরণের ক্লোজ-আপ','sv','Närbild på handapplicerad glasyrtextur på keramikmugg'), 1),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
   jsonb_build_object('en','Ceramic mug with coffee on rustic wooden table','bn-BD','গ্রামীণ কাঠের টেবিলে কফি সহ সিরামিক মগ','sv','Keramikmugg med kaffe på rustikt träbord'), 2),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
   jsonb_build_object('en','Studio pottery collection featuring handmade mugs and bowls','bn-BD','হস্তনির্মিত মগ ও বাটি সহ স্টুডিও পটারি সংগ্রহ','sv','Studiokeramikkollektion med handgjorda muggar och skålar'), 3),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1565024144485-d0076966fe6b?w=800&q=80',
   jsonb_build_object('en','Potter shaping clay on wheel in studio','bn-BD','স্টুডিওতে চাকায় মাটি আকার দিচ্ছেন কুম্ভকার','sv','Krukmakare formar lera på hjul i studio'), 4);

-- ── Product 2: Hand-woven Wall Hanging ──────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-woven Wall Hanging',
    'bn-BD', 'হাতে বোনা ওয়াল হ্যাঙ্গিং',
    'sv',    'Handvävd väggdekoration'
  ),
  jsonb_build_object(
    'en',    'hand-woven-wall-hanging',
    'bn-BD', 'hate-bona-wall-hanging',
    'sv',    'handvavd-vaggdekoration'
  ),
  jsonb_build_object(
    'en',    'Artisan wall hanging woven from natural cotton and wool on a driftwood rod. Each piece is completely unique — hand-dyed with natural plant pigments in earthy tones of terracotta, sage, and oatmeal. Features fringe detailing and a wrapped driftwood hanger. Hanging hardware included. Suitable for living rooms, bedrooms, and nurseries.',
    'bn-BD', 'ড্রিফটউড রডে প্রাকৃতিক তুলা এবং উলের তৈরি কারিগর ওয়াল হ্যাঙ্গিং। প্রতিটি টুকরো সম্পূর্ণ অনন্য — টেরাকোটা, সেজ এবং ওটমিলের মাটির টোনে প্রাকৃতিক উদ্ভিদ রঞ্জক দিয়ে হাতে রং করা। ফ্রিঞ্জ বিস্তারিত এবং মোড়ানো ড্রিফটউড হ্যাঙ্গার। লিভিং রুম, বেডরুম এবং নার্সারির জন্য উপযুক্ত।',
    'sv',    'Hantverksmässig väggdekoration vävd av naturlig bomull och ull på en drivvedspinne. Varje stycke är helt unikt — handkryddad med naturliga växtpigment i jordiga toner av terrakotta, salvia och havremjöl. Har fransmönster och en lindat drivvedshängare. Upphängningsbeslag ingår.'
  ),
  jsonb_build_object(
    'en',    'Hand-woven cotton and wool wall hanging on driftwood. Natural plant dyes, unique every piece.',
    'bn-BD', 'ড্রিফটউড-এ হাতে বোনা তুলা ও উলের ওয়াল হ্যাঙ্গিং। প্রাকৃতিক রং, প্রতিটি টুকরো অনন্য।',
    'sv',    'Handvävd väggdekoration av bomull och ull på drivved. Naturliga färger, unikt varje stycke.'
  ),
  jsonb_build_object(
    'en',    'Hand-woven Wall Hanging | Boho Home Decor',
    'bn-BD', 'হাতে বোনা ওয়াল হ্যাঙ্গিং | বোহো হোম ডেকোর',
    'sv',    'Handvävd väggdekoration | Boho heminredning'
  ),
  jsonb_build_object(
    'en',    'Unique hand-woven wall hanging in natural cotton and wool. Plant-dyed, boho home decor.',
    'bn-BD', 'প্রাকৃতিক তুলা ও উলে অনন্য হাতে বোনা ওয়াল হ্যাঙ্গিং। উদ্ভিদ-রঞ্জিত বোহো হোম ডেকোর।',
    'sv',    'Unik handvävd väggdekoration i naturlig bomull och ull. Växtfärgad boho heminredning.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'WALL-SM',
   jsonb_build_object('en','Small (30×40 cm)','bn-BD','ছোট (৩০×৪০ সেমি)','sv','Liten (30×40 cm)'),
   jsonb_build_object('USD',3500,'BDT',385000,'SEK',42000), 20, true),
  ('a1000000-0000-0000-0000-000000000002', 'WALL-MD',
   jsonb_build_object('en','Medium (50×70 cm)','bn-BD','মাঝারি (৫০×৭০ সেমি)','sv','Medium (50×70 cm)'),
   jsonb_build_object('USD',5500,'BDT',605000,'SEK',65000), 15, true),
  ('a1000000-0000-0000-0000-000000000002', 'WALL-LG',
   jsonb_build_object('en','Large (70×100 cm)','bn-BD','বড় (৭০×১০০ সেমি)','sv','Stor (70×100 cm)'),
   jsonb_build_object('USD',7500,'BDT',825000,'SEK',88000), 10, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
   jsonb_build_object('en','Boho hand-woven wall hanging in natural tones','bn-BD','প্রাকৃতিক টোনে বোহো হাতে বোনা ওয়াল হ্যাঙ্গিং','sv','Boho handvävd väggdekoration i naturliga toner'), 0),
  ('a1000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
   jsonb_build_object('en','Macrame wall hanging texture and fringe detail','bn-BD','ম্যাক্রামে ওয়াল হ্যাঙ্গিং টেক্সচার ও ফ্রিঞ্জ বিবরণ','sv','Makrameé väggdekoration textur och fransdetalj'), 1),
  ('a1000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
   jsonb_build_object('en','Wall hanging displayed in bright Scandinavian living room','bn-BD','উজ্জ্বল স্ক্যান্ডিনেভিয়ান লিভিং রুমে প্রদর্শিত ওয়াল হ্যাঙ্গিং','sv','Väggdekoration visad i ljust skandinaviskt vardagsrum'), 2),
  ('a1000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
   jsonb_build_object('en','Driftwood rod detail with wrapped cotton threads','bn-BD','মোড়ানো তুলার সুতা সহ ড্রিফটউড রডের বিবরণ','sv','Drivvedspinnedetalj med lindade bomullstrådar'), 3),
  ('a1000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
   jsonb_build_object('en','Natural dye color palette used in wall hanging','bn-BD','ওয়াল হ্যাঙ্গিংয়ে ব্যবহৃত প্রাকৃতিক রঙের প্যালেট','sv','Naturlig färgpalett använd i väggdekoration'), 4);

-- ── Product 3: Natural Beeswax Candle Set ────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Natural Beeswax Candle Set',
    'bn-BD', 'প্রাকৃতিক মোম মোমবাতি সেট',
    'sv',    'Naturligt bivaxljusset'
  ),
  jsonb_build_object(
    'en',    'natural-beeswax-candle-set',
    'bn-BD', 'prakritik-mom-mombati-set',
    'sv',    'naturligt-bivaxljusset'
  ),
  jsonb_build_object(
    'en',    'Hand-poured from 100% pure filtered beeswax with unbleached cotton wicks. Burns cleanly for 40–50 hours per candle with a warm, golden flame. Naturally scented with real honey and subtle wildflower notes — no synthetic fragrances or dyes. Beeswax is naturally dripless and produces negative ions that purify the air. Packaged in kraft paper gift boxes.',
    'bn-BD', 'অব্লিচড সুতার উইক সহ ১০০% বিশুদ্ধ ফিল্টার করা মোম থেকে হাতে ঢালা। প্রতি মোমবাতি উষ্ণ, সোনালি শিখা সহ ৪০-৫০ ঘণ্টা পরিষ্কারভাবে জ্বলে। আসল মধু এবং সূক্ষ্ম বন্যফুলের নোট সহ প্রাকৃতিকভাবে সুগন্ধিযুক্ত। ক্র্যাফট পেপার গিফট বক্সে প্যাকেজ করা।',
    'sv',    'Handgjuten av 100% rent filtrerat bivax med oblekta bomullsvekar. Brinner rent i 40–50 timmar per ljus med en varm, gyllene låga. Naturligt doftande med verklig honung och subtila vildblomstoner. Bivax är naturligt droppfritt och producerar negativa joner som renar luften. Förpackade i kraftpapper presentlådor.'
  ),
  jsonb_build_object(
    'en',    'Pure beeswax candles, hand-poured with cotton wicks. 40–50 hr burn, honey-scented.',
    'bn-BD', 'বিশুদ্ধ মোম মোমবাতি, সুতার উইক সহ হাতে ঢালা। ৪০-৫০ ঘণ্টা বার্ন, মধু-সুগন্ধি।',
    'sv',    'Rena bivaxljus, handgjutna med bomullsvekar. 40–50 timmars brinntid, honungsdoftande.'
  ),
  jsonb_build_object(
    'en',    'Natural Beeswax Candle Set | Hand-poured Artisan Candles',
    'bn-BD', 'প্রাকৃতিক মোম মোমবাতি সেট | হাতে ঢালা কারিগর মোমবাতি',
    'sv',    'Naturligt bivaxljusset | Handgjutna hantverksljus'
  ),
  jsonb_build_object(
    'en',    'Hand-poured 100% pure beeswax candles with cotton wicks. 40-50 hour burn time. Gift packaged.',
    'bn-BD', 'সুতার উইক সহ হাতে ঢালা ১০০% বিশুদ্ধ মোম মোমবাতি। গিফট প্যাকেজড।',
    'sv',    'Handgjutna 100% rena bivaxljus med bomullsvekar. 40-50 timmars brinntid. Presentförpackade.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'CANDLE-SET3',
   jsonb_build_object('en','Set of 3 Pillar Candles','bn-BD','৩টি পিলার মোমবাতির সেট','sv','Set om 3 pelarljus'),
   jsonb_build_object('USD',2800,'BDT',308000,'SEK',34000), 30, true),
  ('a1000000-0000-0000-0000-000000000003', 'CANDLE-SET6',
   jsonb_build_object('en','Set of 6 Pillar Candles','bn-BD','৬টি পিলার মোমবাতির সেট','sv','Set om 6 pelarljus'),
   jsonb_build_object('USD',4800,'BDT',528000,'SEK',58000), 20, true),
  ('a1000000-0000-0000-0000-000000000003', 'CANDLE-TAPER',
   jsonb_build_object('en','Set of 8 Taper Candles','bn-BD','৮টি টেপার মোমবাতির সেট','sv','Set om 8 ljuslyktor'),
   jsonb_build_object('USD',3600,'BDT',396000,'SEK',44000), 25, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80',
   jsonb_build_object('en','Natural beeswax pillar candles burning warmly','bn-BD','উষ্ণভাবে জ্বলন্ত প্রাকৃতিক মোম পিলার মোমবাতি','sv','Naturliga bivaxpelarljus som brinner varmt'), 0),
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1614032686163-bdc24c13d0b6?w=800&q=80',
   jsonb_build_object('en','Handmade beeswax candle set arranged on wooden tray','bn-BD','কাঠের ট্রেতে সাজানো হস্তনির্মিত মোম মোমবাতি সেট','sv','Handgjort bivaxljusset arrangerat på träbricka'), 1),
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1614032686163-bdc24c13d0b6?w=800&q=80',
   jsonb_build_object('en','Beeswax texture and cotton wick close-up','bn-BD','মোমের টেক্সচার ও সুতার উইকের ক্লোজ-আপ','sv','Närbild på bivaxstruktur och bomullsvek'), 2),
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80',
   jsonb_build_object('en','Candle set in kraft paper gift packaging','bn-BD','ক্র্যাফট পেপার গিফট প্যাকেজিংয়ে মোমবাতি সেট','sv','Ljusset i kraftpapper presentförpackning'), 3),
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80',
   jsonb_build_object('en','Cozy home ambiance created with beeswax candles','bn-BD','মোম মোমবাতি দিয়ে তৈরি আরামদায়ক বাড়ির পরিবেশ','sv','Mysig hemmiljö skapad med bivaxljus'), 4);

-- ── Product 4: Hand-painted Pottery Bowl ─────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-painted Pottery Bowl',
    'bn-BD', 'হাতে আঁকা মাটির বাটি',
    'sv',    'Handmålad keramikskål'
  ),
  jsonb_build_object(
    'en',    'hand-painted-pottery-bowl',
    'bn-BD', 'hate-aka-matir-bati',
    'sv',    'handmalad-keramikskål'
  ),
  jsonb_build_object(
    'en',    'Stoneware bowl hand-painted with intricate floral and geometric patterns inspired by traditional folk art from South Asia. Lead-free, food-safe glaze fired at 1260°C for durability. Suitable as a fruit bowl, salad server, or decorative centerpiece. Each bowl takes 4–5 hours to paint — no two are identical. Oven, microwave, and dishwasher safe.',
    'bn-BD', 'দক্ষিণ এশিয়ার ঐতিহ্যবাহী লোকশিল্প থেকে অনুপ্রাণিত জটিল ফুল ও জ্যামিতিক নকশা দিয়ে হাতে আঁকা স্টোনওয়্যার বাটি। স্থায়িত্বের জন্য ১২৬০°সে-তে ফায়ার করা সীসামুক্ত, ফুড-সেফ গ্লেজ। প্রতিটি বাটি আঁকতে ৪-৫ ঘণ্টা লাগে। ওভেন, মাইক্রোওয়েভ ও ডিশওয়াশার নিরাপদ।',
    'sv',    'Stengodsskål handmålad med invecklade blom- och geometriska mönster inspirerade av traditionell folkkonst från Sydasien. Blyfri, livsmedelssäker glasyr bränd vid 1260°C. Varje skål tar 4–5 timmar att måla — inga två är identiska. Ugns-, mikrovågs- och diskmaskinsäker.'
  ),
  jsonb_build_object(
    'en',    'Hand-painted stoneware bowl with folk art floral patterns. Food-safe and oven-safe.',
    'bn-BD', 'লোকশিল্পের ফুলের নকশা সহ হাতে আঁকা স্টোনওয়্যার বাটি। ফুড-সেফ ও ওভেন-সেফ।',
    'sv',    'Handmålad stengodsskål med folkkonst blomstermönster. Livsmedels- och ugnssäker.'
  ),
  jsonb_build_object(
    'en',    'Hand-painted Pottery Bowl | Folk Art Ceramics',
    'bn-BD', 'হাতে আঁকা মাটির বাটি | লোকশিল্প সিরামিক',
    'sv',    'Handmålad keramikskål | Folkkonst keramik'
  ),
  jsonb_build_object(
    'en',    'Stoneware bowl hand-painted with folk art floral patterns. Lead-free, food-safe glaze.',
    'bn-BD', 'লোকশিল্পের ফুলের নকশায় হাতে আঁকা স্টোনওয়্যার বাটি। সীসামুক্ত, ফুড-সেফ গ্লেজ।',
    'sv',    'Stengodsskål handmålad med folkkonst blomstermönster. Blyfri, livsmedelssäker glasyr.'
  ),
  'physical', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'POT-BOWL-SM',
   jsonb_build_object('en','Small (15 cm diameter)','bn-BD','ছোট (১৫ সেমি ব্যাস)','sv','Liten (15 cm diameter)'),
   jsonb_build_object('USD',2200,'BDT',242000,'SEK',26000), 25, true),
  ('a1000000-0000-0000-0000-000000000004', 'POT-BOWL-LG',
   jsonb_build_object('en','Large (25 cm diameter)','bn-BD','বড় (২৫ সেমি ব্যাস)','sv','Stor (25 cm diameter)'),
   jsonb_build_object('USD',3800,'BDT',418000,'SEK',45000), 18, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80',
   jsonb_build_object('en','Hand-painted ceramic bowl with floral folk art patterns','bn-BD','ফুলের লোকশিল্পের নকশা সহ হাতে আঁকা সিরামিক বাটি','sv','Handmålad keramikskål med blomsterfolkkonstmönster'), 0),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
   jsonb_build_object('en','Intricate geometric patterns on pottery bowl interior','bn-BD','মাটির বাটির ভেতরে জটিল জ্যামিতিক নকশা','sv','Invecklade geometriska mönster på keramikskålens insida'), 1),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1605000797498-28f11462c7aa?w=800&q=80',
   jsonb_build_object('en','Handmade pottery bowl collection on display shelf','bn-BD','প্রদর্শনী তাকে হস্তনির্মিত মাটির বাটির সংগ্রহ','sv','Samling handgjorda keramikskålar på displayhylla'), 2),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1490312278390-ab64016b5873?w=800&q=80',
   jsonb_build_object('en','Bowl in use as fruit centerpiece on dining table','bn-BD','ডাইনিং টেবিলে ফলের সেন্টারপিস হিসেবে ব্যবহৃত বাটি','sv','Skål används som fruktcentrum på matbordet'), 3),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',
   jsonb_build_object('en','Artist painting intricate floral patterns on pottery','bn-BD','মাটির পাত্রে জটিল ফুলের নকশা আঁকছেন শিল্পী','sv','Konstnär målar invecklade blomstermönster på keramik'), 4);

-- ── Product 5: Macrame Plant Hanger ──────────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Macrame Plant Hanger',
    'bn-BD', 'ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার',
    'sv',    'Makramé blomkrukshängare'
  ),
  jsonb_build_object(
    'en',    'macrame-plant-hanger',
    'bn-BD', 'macrame-plant-hangar',
    'sv',    'makrame-blomkrukshangare'
  ),
  jsonb_build_object(
    'en',    'Hand-knotted macrame plant hanger crafted from 100% natural unbleached cotton rope. Features a traditional square-knot pattern with a decorative fringe base. Fits standard 4–6 inch terracotta or ceramic pots (not included). The adjustable hanger loop works on any ceiling hook or curtain rod. Perfect for trailing plants like pothos, ivy, or string of pearls.',
    'bn-BD', '১০০% প্রাকৃতিক অব্লিচড সুতির দড়ি থেকে তৈরি হাতে গিট দেওয়া ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার। সজ্জামূলক ফ্রিঞ্জ বেস সহ ঐতিহ্যবাহী স্কোয়ার-নট প্যাটার্ন। স্ট্যান্ডার্ড ৪-৬ ইঞ্চি টেরাকোটা বা সিরামিক পট মাপের। পটোস, আইভি বা স্ট্রিং অফ পার্লসের মতো ঝুলন্ত গাছের জন্য নিখুঁত।',
    'sv',    'Handknutet makramé blomkrukshängare tillverkad av 100% naturligt oblekt bomullsrep. Har ett traditionellt fyrknutsmönster med en dekorativ fransarbas. Passar standard 4–6 tums terrakotta- eller keramikkrukor. Det justerbara hängaröglan fungerar på alla takhakar eller gardinstänger.'
  ),
  jsonb_build_object(
    'en',    'Hand-knotted macrame plant hanger in natural cotton rope. Fits 4–6 inch pots.',
    'bn-BD', 'প্রাকৃতিক সুতির দড়িতে হাতে গিট দেওয়া ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার। ৪-৬ ইঞ্চি পটে মানানসই।',
    'sv',    'Handknutet makramé blomkrukshängare i naturligt bomullsrep. Passar 4–6 tums krukor.'
  ),
  jsonb_build_object(
    'en',    'Macrame Plant Hanger | Handmade Boho Decor',
    'bn-BD', 'ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার | হস্তনির্মিত বোহো ডেকোর',
    'sv',    'Makramé blomkrukshängare | Handgjord boho inredning'
  ),
  jsonb_build_object(
    'en',    'Hand-knotted macrame plant hanger in natural cotton rope. Bohemian home decor.',
    'bn-BD', 'প্রাকৃতিক সুতার দড়িতে হাতে গিট দেওয়া ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার।',
    'sv',    'Handknutet makramé blomkrukshängare i naturligt bomullsrep. Bohem heminredning.'
  ),
  'physical', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'MACRO-SNGL',
   jsonb_build_object('en','Single Hanger','bn-BD','একক হ্যাঙ্গার','sv','Enkel hängare'),
   jsonb_build_object('USD',1600,'BDT',176000,'SEK',19000), 45, true),
  ('a1000000-0000-0000-0000-000000000005', 'MACRO-SET3',
   jsonb_build_object('en','Set of 3 Hangers','bn-BD','৩টি হ্যাঙ্গারের সেট','sv','Set om 3 hängare'),
   jsonb_build_object('USD',4200,'BDT',462000,'SEK',50000), 25, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80',
   jsonb_build_object('en','Macrame plant hanger with trailing pothos in boho room','bn-BD','বোহো রুমে ঝুলন্ত পটোস সহ ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার','sv','Makramé blomkrukshängare med hängande pothos i boho-rum'), 0),
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80',
   jsonb_build_object('en','Close-up of macrame square knot pattern in natural cotton rope','bn-BD','প্রাকৃতিক সুতার দড়িতে ম্যাক্রামে স্কোয়ার নট প্যাটার্নের ক্লোজ-আপ','sv','Närbild på makramé fyrknutsmönster i naturligt bomullsrep'), 1),
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=800&q=80',
   jsonb_build_object('en','Three macrame hangers displayed against white wall','bn-BD','সাদা দেওয়ালের বিপরীতে তিনটি ম্যাক্রামে হ্যাঙ্গার প্রদর্শিত','sv','Tre makraméhängare visade mot vit vägg'), 2),
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
   jsonb_build_object('en','Fringe base detail of handmade macrame hanger','bn-BD','হস্তনির্মিত ম্যাক্রামে হ্যাঙ্গারের ফ্রিঞ্জ বেসের বিবরণ','sv','Fransbasdetalj på handgjord makraméhängare'), 3),
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80',
   jsonb_build_object('en','Macrame hanger with succulent in terracotta pot','bn-BD','টেরাকোটা পটে সাকুলেন্ট সহ ম্যাক্রামে হ্যাঙ্গার','sv','Makraméhängare med suckulenter i terrakottakruka'), 4);

-- ── Product 6: Artisan Leather Wallet ────────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Artisan Leather Wallet',
    'bn-BD', 'কারিগর চামড়ার ওয়ালেট',
    'sv',    'Hantverksläderplånbok'
  ),
  jsonb_build_object(
    'en',    'artisan-leather-wallet',
    'bn-BD', 'karigar-chamrar-wallet',
    'sv',    'hantverksladerplanbok'
  ),
  jsonb_build_object(
    'en',    'Hand-stitched bifold wallet crafted from full-grain vegetable-tanned leather sourced from ethically raised cattle. Each wallet is saddle-stitched by hand using waxed linen thread for superior durability — no machine stitching. Features 6 card slots, a bill compartment, and an ID window. The leather develops a rich patina with use. Personalised monogram engraving available at no extra cost.',
    'bn-BD', 'নৈতিকভাবে পালিত গবাদি পশু থেকে পাওয়া ফুল-গ্রেইন ভেজিটেবল-ট্যানড চামড়া থেকে তৈরি হাতে সেলাই করা বিফোল্ড ওয়ালেট। প্রতিটি ওয়ালেট উচ্চতর স্থায়িত্বের জন্য মোমযুক্ত লিনেন সুতা দিয়ে হাতে স্যাডল-স্টিচ করা। ৬টি কার্ড স্লট, একটি বিল কম্পার্টমেন্ট এবং একটি আইডি উইন্ডো। ব্যবহারের সাথে সাথে চামড়া সমৃদ্ধ পাটিনা তৈরি করে।',
    'sv',    'Handsytt bifoldplånbok tillverkad av fullkorns vegetabilgarvat läder från etiskt uppfödda nötkreatur. Varje plånbok är sadelsydd för hand med vaxat linnetråd för överlägsen hållbarhet. Har 6 kortplatser, ett sedelfack och ett ID-fönster. Läder utvecklar en rik patina med användning. Personlig monograminprägling tillgänglig utan extra kostnad.'
  ),
  jsonb_build_object(
    'en',    'Hand-stitched full-grain leather bifold wallet. 6 card slots, personalised engraving available.',
    'bn-BD', 'হাতে সেলাই করা ফুল-গ্রেইন চামড়ার বিফোল্ড ওয়ালেট। ৬টি কার্ড স্লট, ব্যক্তিগতকৃত খোদাই।',
    'sv',    'Handsytt fullkorns läder bifoldplånbok. 6 kortplatser, personlig gravyr tillgänglig.'
  ),
  jsonb_build_object(
    'en',    'Artisan Leather Wallet | Full-Grain Handmade',
    'bn-BD', 'কারিগর চামড়ার ওয়ালেট | ফুল-গ্রেইন হস্তনির্মিত',
    'sv',    'Hantverksläderplånbok | Fullkorns handgjord'
  ),
  jsonb_build_object(
    'en',    'Full-grain vegetable-tanned leather bifold wallet, hand-stitched with waxed linen thread.',
    'bn-BD', 'মোমযুক্ত লিনেন সুতায় হাতে সেলাই, ফুল-গ্রেইন ভেজিটেবল-ট্যানড চামড়ার বিফোল্ড ওয়ালেট।',
    'sv',    'Fullkorns vegetabilgarvad läder bifoldplånbok, handsydd med vaxat linnetråd.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'WALLET-TAN',
   jsonb_build_object('en','Natural Tan','bn-BD','ন্যাচারাল ট্যান','sv','Naturlig tan'),
   jsonb_build_object('USD',5500,'BDT',605000,'SEK',65000), 30, true),
  ('a1000000-0000-0000-0000-000000000006', 'WALLET-BROWN',
   jsonb_build_object('en','Dark Brown','bn-BD','গাঢ় বাদামি','sv','Mörkbrun'),
   jsonb_build_object('USD',5500,'BDT',605000,'SEK',65000), 28, true),
  ('a1000000-0000-0000-0000-000000000006', 'WALLET-BLACK',
   jsonb_build_object('en','Jet Black','bn-BD','কালো','sv','Kolsvart'),
   jsonb_build_object('USD',5500,'BDT',605000,'SEK',65000), 22, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
   jsonb_build_object('en','Full-grain leather bifold wallet in natural tan','bn-BD','ন্যাচারাল ট্যানে ফুল-গ্রেইন চামড়ার বিফোল্ড ওয়ালেট','sv','Fullkorns läder bifoldplånbok i naturlig tan'), 0),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1553062407-98eeb64c6a45?w=800&q=80',
   jsonb_build_object('en','Open wallet showing card slots and bill compartment','bn-BD','কার্ড স্লট ও বিল কম্পার্টমেন্ট দেখানো খোলা ওয়ালেট','sv','Öppen plånbok som visar kortplatser och sedelfack'), 1),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1566150905458-1bf1fe113a0d?w=800&q=80',
   jsonb_build_object('en','Hand-saddle stitching detail with waxed linen thread','bn-BD','মোমযুক্ত লিনেন সুতায় হাতে স্যাডল স্টিচিং বিবরণ','sv','Handsadelsömnad detalj med vaxat linnetråd'), 2),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80',
   jsonb_build_object('en','Leather wallet aged patina after months of use','bn-BD','মাসের ব্যবহারের পরে চামড়ার ওয়ালেটের বয়স্ক পাটিনা','sv','Läderplånbokens åldrande patina efter månaders användning'), 3),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=800&q=80',
   jsonb_build_object('en','Artisan leather goods workshop with tools and hides','bn-BD','সরঞ্জাম ও চামড়া সহ কারিগর চামড়ার পণ্যের কর্মশালা','sv','Hantverkslädergodsverkstad med verktyg och hudar'), 4);

-- ── Product 7: Hand-knitted Wool Throw Blanket ───────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000007',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-knitted Wool Throw Blanket',
    'bn-BD', 'হাতে বোনা উলের থ্রো ব্লাঙ্কেট',
    'sv',    'Handstickad ullpläd'
  ),
  jsonb_build_object(
    'en',    'hand-knitted-wool-throw-blanket',
    'bn-BD', 'hate-bona-uler-throw-blanket',
    'sv',    'handstickad-ullplad'
  ),
  jsonb_build_object(
    'en',    'Chunky hand-knitted throw blanket made from 100% Merino wool — ultra-soft, itch-free, and naturally temperature-regulating. Each blanket is hand-knitted using large 15mm needles in a classic basket-weave stitch pattern and takes approximately 12 hours to complete. Machine washable on a gentle cold cycle. Measures 120×150 cm. Available in a curated palette of neutral and seasonal tones.',
    'bn-BD', '১০০% মেরিনো উল থেকে তৈরি চাঙ্কি হাতে বোনা থ্রো ব্লাঙ্কেট — অতি-নরম, চুলকানি-মুক্ত এবং প্রাকৃতিকভাবে তাপমাত্রা-নিয়ন্ত্রক। প্রতিটি কম্বল বড় ১৫মিমি সুঁচ ব্যবহার করে ক্লাসিক বাস্কেট-ওয়েভ স্টিচ প্যাটার্নে হাতে বোনা। সম্পন্ন করতে প্রায় ১২ ঘণ্টা লাগে। মৃদু ঠান্ডা চক্রে মেশিন ওয়াশযোগ্য। ১২০×১৫০ সেমি।',
    'sv',    'Grov handstickad pläd gjord av 100% Merino ull — ultralen, klibbfri och naturligt temperaturreglerande. Varje pläd är handstickad med stora 15mm stickor i ett klassiskt korgsömsmönster och tar ungefär 12 timmar att färdigställa. Maskintvättbar i skonsam kall cykel. Mäter 120×150 cm.'
  ),
  jsonb_build_object(
    'en',    'Chunky hand-knitted 100% Merino wool throw. 120×150 cm, machine washable.',
    'bn-BD', 'চাঙ্কি হাতে বোনা ১০০% মেরিনো উল থ্রো। ১২০×১৫০ সেমি, মেশিন ওয়াশযোগ্য।',
    'sv',    'Grov handstickad 100% Merino ullpläd. 120×150 cm, maskintvättbar.'
  ),
  jsonb_build_object(
    'en',    'Hand-knitted Wool Throw Blanket | Merino Craft',
    'bn-BD', 'হাতে বোনা উলের থ্রো ব্লাঙ্কেট | মেরিনো ক্রাফট',
    'sv',    'Handstickad ullpläd | Merinohantverkare'
  ),
  jsonb_build_object(
    'en',    'Chunky hand-knitted 100% Merino wool throw blanket, soft and temperature-regulating.',
    'bn-BD', 'চাঙ্কি হাতে বোনা ১০০% মেরিনো উল থ্রো ব্লাঙ্কেট, নরম ও তাপমাত্রা-নিয়ন্ত্রক।',
    'sv',    'Grov handstickad 100% Merino ullpläd, mjuk och temperaturreglerande.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000007', 'THROW-OATMEAL',
   jsonb_build_object('en','Oatmeal','bn-BD','ওটমিল','sv','Havregryn'),
   jsonb_build_object('USD',8900,'BDT',979000,'SEK',105000), 15, true),
  ('a1000000-0000-0000-0000-000000000007', 'THROW-GREY',
   jsonb_build_object('en','Heather Grey','bn-BD','হেদার গ্রে','sv','Ljunggrå'),
   jsonb_build_object('USD',8900,'BDT',979000,'SEK',105000), 12, true),
  ('a1000000-0000-0000-0000-000000000007', 'THROW-TERRACOTTA',
   jsonb_build_object('en','Terracotta','bn-BD','টেরাকোটা','sv','Terrakotta'),
   jsonb_build_object('USD',8900,'BDT',979000,'SEK',105000), 10, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&q=80',
   jsonb_build_object('en','Chunky hand-knitted Merino wool throw on sofa','bn-BD','সোফায় চাঙ্কি হাতে বোনা মেরিনো উল থ্রো','sv','Grov handstickad Merino ullpläd på soffa'), 0),
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800&q=80',
   jsonb_build_object('en','Close-up of basket weave stitch pattern in chunky wool','bn-BD','চাঙ্কি উলে বাস্কেট ওয়েভ স্টিচ প্যাটার্নের ক্লোজ-আপ','sv','Närbild på korgsömsmönster i grov ull'), 1),
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1617791160536-598cf32026fb?w=800&q=80',
   jsonb_build_object('en','Merino wool throw draped over armchair in cosy room','bn-BD','আরামদায়ক ঘরে আর্মচেয়ারের উপর ঝুলানো মেরিনো উল থ্রো','sv','Merino ullpläd draperad över fåtölj i mysigt rum'), 2),
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80',
   jsonb_build_object('en','Hands knitting with large needles and chunky Merino wool','bn-BD','বড় সুঁচ ও চাঙ্কি মেরিনো উল দিয়ে হাতে বুনছেন','sv','Händer stickar med stora stickor och grov Merino ull'), 3),
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80',
   jsonb_build_object('en','Colour range of handmade wool throws — oatmeal, grey, terracotta','bn-BD','হস্তনির্মিত উল থ্রোর রঙের পরিসীমা — ওটমিল, গ্রে, টেরাকোটা','sv','Färgutbud av handgjorda ullplädar — havregryn, grå, terrakotta'), 4);

-- ── Product 8: Handmade Wooden Serving Board ─────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000008',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Handmade Wooden Serving Board',
    'bn-BD', 'হস্তনির্মিত কাঠের সার্ভিং বোর্ড',
    'sv',    'Handgjord träbricka för servering'
  ),
  jsonb_build_object(
    'en',    'handmade-wooden-serving-board',
    'bn-BD', 'hastanirmita-kather-serving-board',
    'sv',    'handgjord-trabricka-for-servering'
  ),
  jsonb_build_object(
    'en',    'Hand-shaped and finished serving board crafted from a single piece of sustainably sourced walnut or acacia hardwood. Each board is shaped with a spoke shave, smoothed with 220-grit sandpaper, and finished with food-safe mineral oil and beeswax. Features a carved handle and juice groove. No two boards have the same grain pattern. Cutting and charcuterie ready.',
    'bn-BD', 'টেকসইভাবে উৎপাদিত ওয়ালনাট বা আকাসিয়া হার্ডউডের একটি একক টুকরো থেকে তৈরি হাতে আকৃতি দেওয়া ও ফিনিশ করা সার্ভিং বোর্ড। প্রতিটি বোর্ড স্পোক শেভ দিয়ে আকার দেওয়া, ২২০-গ্রিট স্যান্ডপেপার দিয়ে মসৃণ এবং ফুড-সেফ মিনারেল অয়েল ও মোম দিয়ে ফিনিশ করা। কোনো দুটি বোর্ডের দানার প্যাটার্ন একই নয়।',
    'sv',    'Handsformad och bearbetad serveringsbricka tillverkad av ett enda stycke hållbart källat valnöt- eller akciahårdträ. Varje bricka formas med en ekerspak, slipas med 220-kornigt sandpapper och avslutas med livsmedelssäker mineralolja och bivax. Har handtag och juicespår. Inga två brickor har samma kornmönster.'
  ),
  jsonb_build_object(
    'en',    'Hand-shaped walnut or acacia serving board. Food-safe beeswax finish, unique grain every piece.',
    'bn-BD', 'হাতে আকৃতি দেওয়া ওয়ালনাট বা আকাসিয়া সার্ভিং বোর্ড। ফুড-সেফ মোম ফিনিশ, প্রতিটি অনন্য।',
    'sv',    'Handsformad valnöt- eller akaciaserveringsbricka. Livsmedelssäker bivaxfinish, unikt korn varje bit.'
  ),
  jsonb_build_object(
    'en',    'Handmade Wooden Serving Board | Artisan Woodwork',
    'bn-BD', 'হস্তনির্মিত কাঠের সার্ভিং বোর্ড | কারিগর কাঠের কাজ',
    'sv',    'Handgjord träbricka | Hantverkssnickeri'
  ),
  jsonb_build_object(
    'en',    'Hand-shaped walnut or acacia serving board with food-safe beeswax finish. Unique grain.',
    'bn-BD', 'ফুড-সেফ মোম ফিনিশ সহ হাতে আকৃতি দেওয়া ওয়ালনাট বা আকাসিয়া সার্ভিং বোর্ড।',
    'sv',    'Handsformad valnöt- eller akaciaserveringsbricka med livsmedelssäker bivaxfinish.'
  ),
  'physical', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000008', 'BOARD-WALNUT-SM',
   jsonb_build_object('en','Walnut Small (30×18 cm)','bn-BD','ওয়ালনাট ছোট (৩০×১৮ সেমি)','sv','Valnöt liten (30×18 cm)'),
   jsonb_build_object('USD',4500,'BDT',495000,'SEK',53000), 20, true),
  ('a1000000-0000-0000-0000-000000000008', 'BOARD-WALNUT-LG',
   jsonb_build_object('en','Walnut Large (45×25 cm)','bn-BD','ওয়ালনাট বড় (৪৫×২৫ সেমি)','sv','Valnöt stor (45×25 cm)'),
   jsonb_build_object('USD',6500,'BDT',715000,'SEK',77000), 15, true),
  ('a1000000-0000-0000-0000-000000000008', 'BOARD-ACACIA-LG',
   jsonb_build_object('en','Acacia Large (45×25 cm)','bn-BD','আকাসিয়া বড় (৪৫×২৫ সেমি)','sv','Akacia stor (45×25 cm)'),
   jsonb_build_object('USD',5500,'BDT',605000,'SEK',65000), 18, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=80',
   jsonb_build_object('en','Handmade walnut serving board with charcuterie arrangement','bn-BD','চারকুটারি সাজানো সহ হস্তনির্মিত ওয়ালনাট সার্ভিং বোর্ড','sv','Handgjord valnöt serveringsbricka med charkuteribordets arrangemang'), 0),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1530543787849-128d94430c6b?w=800&q=80',
   jsonb_build_object('en','Close-up of walnut wood grain and beeswax finish','bn-BD','ওয়ালনাট কাঠের দানা ও মোম ফিনিশের ক্লোজ-আপ','sv','Närbild på valnöt träkorn och bivaxfinish'), 1),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
   jsonb_build_object('en','Wooden serving board used for bread and cheese in kitchen','bn-BD','রান্নাঘরে রুটি ও পনিরের জন্য ব্যবহৃত কাঠের সার্ভিং বোর্ড','sv','Träserveringsbricka används för bröd och ost i köket'), 2),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1609501676406-7a52819e7c35?w=800&q=80',
   jsonb_build_object('en','Carved handle and juice groove detail on serving board','bn-BD','সার্ভিং বোর্ডে খোদাই করা হাতল ও জুসের খাঁজ বিবরণ','sv','Snidad handtag och juicespårdetalj på serveringsbricka'), 3),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800&q=80',
   jsonb_build_object('en','Woodworker hand-shaping board with traditional spoke shave','bn-BD','ঐতিহ্যবাহী স্পোক শেভ দিয়ে হাতে বোর্ড আকার দিচ্ছেন কাঠমিস্ত্রি','sv','Snickare handformar bricka med traditionell ekerspak'), 4);

-- ── Product 9: Natural Handmade Soap Collection ───────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000009',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Natural Handmade Soap Collection',
    'bn-BD', 'প্রাকৃতিক হস্তনির্মিত সাবান সংগ্রহ',
    'sv',    'Naturlig handgjord tvålkollektion'
  ),
  jsonb_build_object(
    'en',    'natural-handmade-soap-collection',
    'bn-BD', 'prakritik-hastanirmita-saban-sangraha',
    'sv',    'naturlig-handgjord-tvalkollektion'
  ),
  jsonb_build_object(
    'en',    'Cold-process handmade soap bars crafted from organic olive oil, coconut oil, and shea butter. Scented with pure essential oils — no synthetic fragrances. Each bar is hand-cut and cured for a minimum of 6 weeks for a long-lasting, hard bar. Gentle enough for sensitive skin and baby-safe. The natural glycerin produced during saponification is retained for extra moisturising. Available in Lavender & Oat, Lemon & Poppyseed, and Charcoal & Tea Tree.',
    'bn-BD', 'অর্গানিক জলপাই তেল, নারকেল তেল এবং শিয়া বাটার থেকে তৈরি কোল্ড-প্রসেস হস্তনির্মিত সাবান বার। বিশুদ্ধ এসেনশিয়াল অয়েল দিয়ে সুগন্ধি — কোনো সিন্থেটিক সুগন্ধি নেই। প্রতিটি বার হাতে কাটা এবং দীর্ঘস্থায়ী, শক্ত বারের জন্য কমপক্ষে ৬ সপ্তাহ কিউর করা। সংবেদনশীল ত্বক ও শিশুর জন্য যথেষ্ট মৃদু।',
    'sv',    'Kallprocessade handgjorda tvålstycken tillverkade av ekologisk olivolja, kokosolja och sheasmör. Doftande med rena eteriska oljor. Varje stycke är handskuret och botat i minst 6 veckor för en långvarig, hård tvål. Mild nog för känslig hud och säker för barn. Tillgänglig i Lavendel & Havre, Citron & Vallmofrö och Kol & Teträd.'
  ),
  jsonb_build_object(
    'en',    'Cold-process organic soap bars. 6-week cured, essential-oil scented, sensitive-skin safe.',
    'bn-BD', 'কোল্ড-প্রসেস অর্গানিক সাবান বার। ৬ সপ্তাহ কিউরড, এসেনশিয়াল অয়েল সুগন্ধি, সংবেদনশীল ত্বক নিরাপদ।',
    'sv',    'Kallprocessade ekologiska tvålstycken. 6 veckors härdade, eterisk olja doftande, säkra för känslig hud.'
  ),
  jsonb_build_object(
    'en',    'Natural Handmade Soap Collection | Cold Process Artisan',
    'bn-BD', 'প্রাকৃতিক হস্তনির্মিত সাবান সংগ্রহ | কোল্ড প্রসেস কারিগর',
    'sv',    'Naturlig handgjord tvålkollektion | Kallprocess hantverkare'
  ),
  jsonb_build_object(
    'en',    'Organic cold-process handmade soap bars with essential oils. 6-week cure, gentle for all skin.',
    'bn-BD', 'এসেনশিয়াল অয়েল সহ অর্গানিক কোল্ড-প্রসেস হস্তনির্মিত সাবান বার। সকল ত্বকের জন্য মৃদু।',
    'sv',    'Ekologiska kallprocessade handgjorda tvålstycken med eteriska oljor. Milda för all hud.'
  ),
  'physical', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000009', 'SOAP-LAVENDER',
   jsonb_build_object('en','Lavender & Oat (single bar)','bn-BD','ল্যাভেন্ডার ও ওট (একক বার)','sv','Lavendel & Havre (enstaka stång)'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 60, true),
  ('a1000000-0000-0000-0000-000000000009', 'SOAP-LEMON',
   jsonb_build_object('en','Lemon & Poppyseed (single bar)','bn-BD','লেবু ও পপিসিড (একক বার)','sv','Citron & Vallmofrö (enstaka stång)'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 55, true),
  ('a1000000-0000-0000-0000-000000000009', 'SOAP-CHARCOAL',
   jsonb_build_object('en','Charcoal & Tea Tree (single bar)','bn-BD','চারকোল ও টি ট্রি (একক বার)','sv','Kol & Teträd (enstaka stång)'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 50, true),
  ('a1000000-0000-0000-0000-000000000009', 'SOAP-GIFT3',
   jsonb_build_object('en','Gift Set of 3 (one of each)','bn-BD','৩টির গিফট সেট (প্রতিটি একটি)','sv','Presentset om 3 (en av varje)'),
   jsonb_build_object('USD',2400,'BDT',264000,'SEK',28000), 35, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&q=80',
   jsonb_build_object('en','Collection of natural handmade soap bars with botanicals','bn-BD','উদ্ভিদ উপাদান সহ প্রাকৃতিক হস্তনির্মিত সাবান বারের সংগ্রহ','sv','Kollektion av naturliga handgjorda tvålstycken med botaniska ingredienser'), 0),
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
   jsonb_build_object('en','Lavender and oat handmade soap bar close-up','bn-BD','ল্যাভেন্ডার ও ওট হস্তনির্মিত সাবান বারের ক্লোজ-আপ','sv','Närbild på lavendel och havre handgjord tvålstång'), 1),
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
   jsonb_build_object('en','Cold-process soap being hand-cut into bars in workshop','bn-BD','কর্মশালায় কোল্ড-প্রসেস সাবান হাতে বারে কাটা হচ্ছে','sv','Kallprocessad tvål handskärs i stänger i verkstad'), 2),
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1600189020347-01cf50c4d1fd?w=800&q=80',
   jsonb_build_object('en','Artisan soap bars curing on wooden rack after cutting','bn-BD','কাটার পরে কাঠের র্যাকে কিউরিং করছে কারিগর সাবান বার','sv','Hantverkarsåpstänger som härdar på träställning efter skärning'), 3),
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
   jsonb_build_object('en','Soap gift set of three wrapped in kraft paper with twine','bn-BD','তারের সুতায় ক্র্যাফট পেপারে মোড়ানো তিনটির সাবান গিফট সেট','sv','Tvålpresentset om tre inslaget i kraftpapper med bindsele'), 4);

-- ── Product 10: Embroidered Linen Cushion Cover ───────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000010',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Embroidered Linen Cushion Cover',
    'bn-BD', 'সূচিকর্ম করা লিনেন কুশন কভার',
    'sv',    'Broderat linne kuddfodral'
  ),
  jsonb_build_object(
    'en',    'embroidered-linen-cushion-cover',
    'bn-BD', 'suchikarm-kora-linen-cushion-cover',
    'sv',    'broderat-linne-kuddfodral'
  ),
  jsonb_build_object(
    'en',    'Hand-embroidered cushion cover made from 100% stone-washed linen. Each cover is embroidered by hand using traditional cross-stitch and satin stitch techniques with organic cotton thread. Botanical motifs inspired by Scandinavian folk embroidery traditions. Hidden zip closure. Fits standard 45×45 cm insert. Dry clean or gentle hand wash. Allow 5–7 days for made-to-order production.',
    'bn-BD', '১০০% স্টোন-ওয়াশড লিনেন থেকে তৈরি হাতে সূচিকর্ম করা কুশন কভার। প্রতিটি কভার জৈব সুতির সুতায় ঐতিহ্যবাহী ক্রস-স্টিচ এবং সাটিন স্টিচ পদ্ধতি ব্যবহার করে হাতে সূচিকর্ম করা। স্ক্যান্ডিনেভিয়ান লোকশিল্প সূচিকর্ম ঐতিহ্য থেকে অনুপ্রাণিত উদ্ভিদবিদ্যার মোটিফ। লুকানো জিপ বন্ধন। মানক ৪৫×৪৫ সেমি ইনসার্টে মানানসই।',
    'sv',    'Handbroderat kuddöverdrag gjort av 100% stonewashed linne. Varje fodral broderas för hand med traditionella kors- och satinsömsteknik med ekologiskt bomullsgarn. Botaniska motiv inspirerade av skandinaviska folkbroderitraditioner. Dold dragkedja. Passar standard 45×45 cm kudde. Torrtvätt eller skonsam handtvätt.'
  ),
  jsonb_build_object(
    'en',    'Hand-embroidered stone-washed linen cushion cover. Botanical folk motifs, 45×45 cm.',
    'bn-BD', 'হাতে সূচিকর্ম করা স্টোন-ওয়াশড লিনেন কুশন কভার। বোটানিক্যাল লোকশিল্পের মোটিফ, ৪৫×৪৫ সেমি।',
    'sv',    'Handbroderat stonewashed linne kuddfodral. Botaniska folkmotiv, 45×45 cm.'
  ),
  jsonb_build_object(
    'en',    'Embroidered Linen Cushion Cover | Artisan Textile',
    'bn-BD', 'সূচিকর্ম করা লিনেন কুশন কভার | কারিগর টেক্সটাইল',
    'sv',    'Broderat linne kuddfodral | Hantverkstextil'
  ),
  jsonb_build_object(
    'en',    'Hand-embroidered stone-washed linen cushion cover with botanical Scandinavian folk motifs.',
    'bn-BD', 'বোটানিক্যাল স্ক্যান্ডিনেভিয়ান লোকশিল্পের মোটিফ সহ হাতে সূচিকর্ম করা লিনেন কুশন কভার।',
    'sv',    'Handbroderat stonewashed linne kuddfodral med botaniska skandinaviska folkmotiv.'
  ),
  'physical', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000010', 'CUSHION-NATURAL',
   jsonb_build_object('en','Natural Linen with White Thread','bn-BD','সাদা সুতায় ন্যাচারাল লিনেন','sv','Naturligt linne med vit tråd'),
   jsonb_build_object('USD',3800,'BDT',418000,'SEK',45000), 20, true),
  ('a1000000-0000-0000-0000-000000000010', 'CUSHION-GREY',
   jsonb_build_object('en','Slate Grey with Terracotta Thread','bn-BD','টেরাকোটা সুতায় স্লেট গ্রে','sv','Skifergrå med terrakottatråd'),
   jsonb_build_object('USD',3800,'BDT',418000,'SEK',45000), 15, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
   jsonb_build_object('en','Hand-embroidered linen cushion cover with botanical motifs','bn-BD','বোটানিক্যাল মোটিফ সহ হাতে সূচিকর্ম করা লিনেন কুশন কভার','sv','Handbroderat linne kuddfodral med botaniska motiv'), 0),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1589810635657-232948472d98?w=800&q=80',
   jsonb_build_object('en','Cross-stitch embroidery detail on natural linen fabric','bn-BD','প্রাকৃতিক লিনেন কাপড়ে ক্রস-স্টিচ সূচিকর্মের বিবরণ','sv','Korsömsbroderidetalj på naturligt linnetstyg'), 1),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
   jsonb_build_object('en','Embroidered cushion displayed on neutral sofa in living room','bn-BD','লিভিং রুমে নিরপেক্ষ সোফায় প্রদর্শিত সূচিকর্ম করা কুশন','sv','Broderad kudde visad på neutral soffa i vardagsrum'), 2),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
   jsonb_build_object('en','Stone-washed linen texture and embroidery thread colours','bn-BD','স্টোন-ওয়াশড লিনেন টেক্সচার ও সূচিকর্মের সুতার রং','sv','Stonewashed linnetextur och broderitrådsfärger'), 3),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
   jsonb_build_object('en','Artisan embroidering Scandinavian botanical motif by hand','bn-BD','হাতে স্ক্যান্ডিনেভিয়ান বোটানিক্যাল মোটিফ সূচিকর্ম করছেন কারিগর','sv','Hantverkare broderar skandinaviskt botaniskt motiv för hand'), 4);

-- ── Product 11: Hand-blown Glass Vase ─────────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000011',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-blown Glass Vase',
    'bn-BD', 'হাতে ফুঁ দিয়ে তৈরি কাচের ফুলদানি',
    'sv',    'Handblåst glasvas'
  ),
  jsonb_build_object(
    'en',    'hand-blown-glass-vase',
    'bn-BD', 'hate-fu-diye-tori-kacher-fuladani',
    'sv',    'handblast-glasvas'
  ),
  jsonb_build_object(
    'en',    'Studio hand-blown glass vase crafted by a master glassblower using the traditional Swedish glass-making technique. Each vase is formed from a single gather of molten borosilicate glass, shaped on the pipe while glowing at 1100°C. The organic, slightly irregular form is a natural result of the hand-blown process — no two are alike. Each vase is signed and dated by the maker on the base.',
    'bn-BD', 'ঐতিহ্যবাহী সুইডিশ কাচ তৈরির কৌশল ব্যবহার করে একজন মাস্টার গ্লাসব্লোয়ার দ্বারা তৈরি স্টুডিও হাতে ফুঁ দিয়ে তৈরি কাচের ফুলদানি। প্রতিটি ফুলদানি গলিত বোরোসিলিকেট কাচের একক জড়ো থেকে তৈরি, ১১০০°সে-তে জ্বলন্ত অবস্থায় পাইপে আকার দেওয়া। জৈব, সামান্য অনিয়মিত আকারটি হাতে ফুঁ দেওয়ার প্রক্রিয়ার প্রাকৃতিক ফলাফল।',
    'sv',    'Studio handblåst glasvas tillverkad av en mästare glasblåsare med traditionell svensk glasmakningsteknik. Varje vas är formad av ett enda samling smält borosilikatglas, formad på röret medan den glöder vid 1100°C. Den organiska, något oregelbundna formen är ett naturligt resultat av den handblåsta processen. Varje vas är signerad och daterad av tillverkaren på basen.'
  ),
  jsonb_build_object(
    'en',    'Studio hand-blown borosilicate glass vase. Signed by maker, each piece unique.',
    'bn-BD', 'স্টুডিও হাতে ফুঁ দিয়ে তৈরি বোরোসিলিকেট কাচের ফুলদানি। নির্মাতার স্বাক্ষরিত, প্রতিটি অনন্য।',
    'sv',    'Studio handblåst borosilikat glasvas. Signerad av tillverkaren, varje stycke unikt.'
  ),
  jsonb_build_object(
    'en',    'Hand-blown Glass Vase | Studio Glass Art',
    'bn-BD', 'হাতে ফুঁ দিয়ে তৈরি কাচের ফুলদানি | স্টুডিও গ্লাস আর্ট',
    'sv',    'Handblåst glasvas | Studiokonst i glas'
  ),
  jsonb_build_object(
    'en',    'Studio hand-blown borosilicate glass vase, maker-signed. Swedish glassblowing tradition.',
    'bn-BD', 'স্টুডিও হাতে ফুঁ দিয়ে তৈরি বোরোসিলিকেট কাচের ফুলদানি, নির্মাতার স্বাক্ষরিত।',
    'sv',    'Studio handblåst borosilikat glasvas, makarsignerad. Svensk glasblåsningstradition.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000011', 'GLASS-CLEAR-SM',
   jsonb_build_object('en','Clear — Small (18 cm)','bn-BD','স্বচ্ছ — ছোট (১৮ সেমি)','sv','Klar — liten (18 cm)'),
   jsonb_build_object('USD',6500,'BDT',715000,'SEK',77000), 12, true),
  ('a1000000-0000-0000-0000-000000000011', 'GLASS-CLEAR-LG',
   jsonb_build_object('en','Clear — Large (30 cm)','bn-BD','স্বচ্ছ — বড় (৩০ সেমি)','sv','Klar — stor (30 cm)'),
   jsonb_build_object('USD',9500,'BDT',1045000,'SEK',112000), 8, true),
  ('a1000000-0000-0000-0000-000000000011', 'GLASS-SMOKE-SM',
   jsonb_build_object('en','Smoked — Small (18 cm)','bn-BD','ধোঁয়া রঙ — ছোট (১৮ সেমি)','sv','Rökfärgad — liten (18 cm)'),
   jsonb_build_object('USD',7200,'BDT',792000,'SEK',85000), 10, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80',
   jsonb_build_object('en','Hand-blown clear glass vase with flowers on minimal table','bn-BD','সাদামাটা টেবিলে ফুল সহ হাতে ফুঁ দেওয়া স্বচ্ছ কাচের ফুলদানি','sv','Handblåst klar glasvas med blommor på minimalt bord'), 0),
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&q=80',
   jsonb_build_object('en','Studio glass art — organic hand-blown form with light play','bn-BD','স্টুডিও গ্লাস আর্ট — আলোর খেলা সহ জৈব হাতে ফুঁ দেওয়া রূপ','sv','Studiokonst i glas — organisk handblåst form med ljuslek'), 1),
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&q=80',
   jsonb_build_object('en','Glassblower shaping molten glass on blowpipe in studio','bn-BD','স্টুডিওতে ব্লোপাইপে গলিত কাচ আকার দিচ্ছেন গ্লাসব্লোয়ার','sv','Glasblåsare formar smält glas på blåsrör i studio'), 2),
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
   jsonb_build_object('en','Smoked glass vase on bedside table with dried botanicals','bn-BD','শুকনো উদ্ভিদ উপাদান সহ বেডসাইড টেবিলে ধোঁয়া রঙের কাচের ফুলদানি','sv','Rökfärgad glasvas på nattduksbord med torkade botaniska växter'), 3),
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
   jsonb_build_object('en','Maker signature and date on base of hand-blown glass vase','bn-BD','হাতে ফুঁ দেওয়া কাচের ফুলদানির বেসে নির্মাতার স্বাক্ষর ও তারিখ','sv','Tillverkarens signatur och datum på basen av handblåst glasvas'), 4);

-- ── Product 12: Artisan Silver Wire Jewellery Set ─────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000012',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Artisan Silver Wire Jewellery Set',
    'bn-BD', 'কারিগর সিলভার তারের গহনা সেট',
    'sv',    'Hantverkssilvertråd smyckeuppsättning'
  ),
  jsonb_build_object(
    'en',    'artisan-silver-wire-jewellery-set',
    'bn-BD', 'karigar-silver-tarer-gahana-set',
    'sv',    'hantverkssilvertrad-smyckesuppsattning'
  ),
  jsonb_build_object(
    'en',    'Handcrafted jewellery set comprising a pair of drop earrings and a matching wrap ring, formed by hand from 925 sterling silver wire using wire-wrapping and coiling techniques. Adorned with genuine semi-precious stones — labradorite, moonstone, or amethyst. Each piece is work-hardened and polished to a mirror finish. Presented in a recycled kraft jewellery box with a cotton pad. Hypoallergenic, nickel-free. Suitable for sensitive ears.',
    'bn-BD', '৯২৫ স্টার্লিং সিলভার তার থেকে তারের মোড়ানো ও কয়েলিং পদ্ধতি ব্যবহার করে হাতে তৈরি ড্রপ ইয়ারিং এবং একটি ম্যাচিং র্যাপ রিং সমন্বিত হস্তনির্মিত গহনা সেট। আসল আধা-মূল্যবান পাথর দিয়ে সজ্জিত — ল্যাব্রাডোরাইট, মুনস্টোন বা অ্যামেথিস্ট। হাইপোঅ্যালার্জেনিক, নিকেল-মুক্ত। সংবেদনশীল কানের জন্য উপযুক্ত।',
    'sv',    'Handgjort smyckeuppsättning bestående av ett par droppörhängen och en matchande lindring, formad för hand från 925 sterlingsilvertråd med trådomlindnings- och spiraltekniker. Prydda med äkta ädelstenar — labradorit, månsten eller ametist. Varje stycke är arbetshärdat och polerat till spegelblankt. Hypoallergent, nickelfritt.'
  ),
  jsonb_build_object(
    'en',    'Handmade 925 sterling silver wire earrings and ring. Semi-precious stones, hypoallergenic.',
    'bn-BD', 'হস্তনির্মিত ৯২৫ স্টার্লিং সিলভার তারের ইয়ারিং ও রিং। আধা-মূল্যবান পাথর, হাইপোঅ্যালার্জেনিক।',
    'sv',    'Handgjorda 925 sterlingsilvertrådsörhängen och ring. Ädelstenar, hypoallergena.'
  ),
  jsonb_build_object(
    'en',    'Artisan Silver Wire Jewellery Set | Handmade Gemstone',
    'bn-BD', 'কারিগর সিলভার তারের গহনা সেট | হস্তনির্মিত রত্নপাথর',
    'sv',    'Hantverkssilvertråd smyckeuppsättning | Handgjord ädelsten'
  ),
  jsonb_build_object(
    'en',    'Handmade 925 sterling silver wire jewellery set with semi-precious stones. Hypoallergenic.',
    'bn-BD', 'আধা-মূল্যবান পাথর সহ হস্তনির্মিত ৯২৫ স্টার্লিং সিলভার তারের গহনা সেট। হাইপোঅ্যালার্জেনিক।',
    'sv',    'Handgjord 925 sterlingsilvertråd smyckeuppsättning med ädelstenar. Hypoallergent.'
  ),
  'physical', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000012', 'JEWEL-LABRA',
   jsonb_build_object('en','Labradorite Set','bn-BD','ল্যাব্রাডোরাইট সেট','sv','Labradorit uppsättning'),
   jsonb_build_object('USD',7800,'BDT',858000,'SEK',92000), 12, true),
  ('a1000000-0000-0000-0000-000000000012', 'JEWEL-MOON',
   jsonb_build_object('en','Moonstone Set','bn-BD','মুনস্টোন সেট','sv','Månsten uppsättning'),
   jsonb_build_object('USD',7800,'BDT',858000,'SEK',92000), 10, true),
  ('a1000000-0000-0000-0000-000000000012', 'JEWEL-AMETHY',
   jsonb_build_object('en','Amethyst Set','bn-BD','অ্যামেথিস্ট সেট','sv','Ametist uppsättning'),
   jsonb_build_object('USD',7800,'BDT',858000,'SEK',92000), 14, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
   jsonb_build_object('en','Handmade sterling silver wire jewellery set with gemstones','bn-BD','রত্নপাথর সহ হস্তনির্মিত স্টার্লিং সিলভার তারের গহনা সেট','sv','Handgjord sterlingsilvertråd smyckeuppsättning med ädelstenar'), 0),
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
   jsonb_build_object('en','Moonstone drop earrings close-up showing wire wrap detail','bn-BD','তারের মোড়ানো বিবরণ দেখানো মুনস্টোন ড্রপ ইয়ারিংয়ের ক্লোজ-আপ','sv','Närbild på månsten droppörhängen som visar trådlindningsdetalj'), 1),
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80',
   jsonb_build_object('en','Silver wire wrap ring with labradorite stone on hand','bn-BD','হাতে ল্যাব্রাডোরাইট পাথর সহ সিলভার তারের র্যাপ রিং','sv','Silvertrådslindring med labradorit sten på hand'), 2),
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80',
   jsonb_build_object('en','Amethyst jewellery set in kraft paper gift box','bn-BD','ক্র্যাফট পেপার গিফট বক্সে অ্যামেথিস্ট গহনা সেট','sv','Ametistsmyckeuppsättning i kraftpapper presentlåda'), 3),
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1573408301185-9519f94815b3?w=800&q=80',
   jsonb_build_object('en','Jeweller forming sterling silver wire by hand in workshop','bn-BD','কর্মশালায় হাতে স্টার্লিং সিলভার তার তৈরি করছেন জুয়েলার্স','sv','Juvelierare formar sterlingsilvertråd för hand i verkstad'), 4);
