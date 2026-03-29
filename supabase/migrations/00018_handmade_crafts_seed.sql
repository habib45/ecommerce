-- Migration 00018: Replace electronics demo data with handmade craft products
-- Deletes all existing "premium-product-*" demo data and inserts 12 handmade craft products
-- Each product has full en/bn-BD/sv JSONB translations, 2-4 variants, 3-5 images

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Delete existing demo products (cascades to variants and images via FK)
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM public.products
WHERE slug->>'en' LIKE 'premium-product-%'
   OR name->>'en' LIKE 'Premium Product %';

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
  true,
  1
)
ON CONFLICT (id) DO UPDATE
  SET name        = EXCLUDED.name,
      slug        = EXCLUDED.slug,
      description = EXCLUDED.description,
      is_active   = EXCLUDED.is_active,
      sort_order  = EXCLUDED.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Insert 12 handmade craft products
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Product 1: Handmade Ceramic Mug ──────────────────────────────────────────
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
    'en',    'Each mug is wheel-thrown and hand-glazed by our studio potter, giving it a one-of-a-kind appearance. Food-safe glaze, microwave and dishwasher safe. Holds approximately 12 oz.',
    'bn-BD', 'প্রতিটি মগ আমাদের স্টুডিও কুম্ভকার দ্বারা চাকায় তৈরি এবং হাতে গ্লেজ করা হয়েছে, এটিকে একটি অনন্য চেহারা দেয়। ফুড-সেফ গ্লেজ, মাইক্রোওয়েভ এবং ডিশওয়াশার নিরাপদ। প্রায় ৩৫০ মিলি ধারণ করে।',
    'sv',    'Varje mugg är hjulkastad och handglaserad av vår studiokrukiare, vilket ger den ett unikt utseende. Livsmedelssäker glasyr, mikrovågs- och diskmaskinsäker. Rymmer cirka 350 ml.'
  ),
  jsonb_build_object(
    'en',    'Wheel-thrown ceramic mug, hand-glazed and food-safe.',
    'bn-BD', 'চাকায় তৈরি সিরামিক মগ, হাতে গ্লেজ করা এবং ফুড-সেফ।',
    'sv',    'Hjulkastad keramikmugg, handglaserad och livsmedelssäker.'
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
  'simple', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'CER-MUG-SM',
   jsonb_build_object('en','Small (8 oz)','bn-BD','ছোট (২৪০ মিলি)','sv','Liten (240 ml)'),
   jsonb_build_object('USD',1800,'BDT',198000,'SEK',22000), 40, true),
  ('a1000000-0000-0000-0000-000000000001', 'CER-MUG-LG',
   jsonb_build_object('en','Large (12 oz)','bn-BD','বড় (৩৫০ মিলি)','sv','Stor (350 ml)'),
   jsonb_build_object('USD',2400,'BDT',264000,'SEK',29000), 35, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
   jsonb_build_object('en','Handmade ceramic mug in earthy tones','bn-BD','মাটির রঙে হস্তনির্মিত সিরামিক মগ','sv','Handgjord keramikmugg i jordtoner'), 0),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
   jsonb_build_object('en','Ceramic mug close-up showing hand glaze detail','bn-BD','হাতের গ্লেজ বিবরণ দেখানো সিরামিক মগের ক্লোজ-আপ','sv','Närbild på keramikmugg som visar handglasyren'), 1),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
   jsonb_build_object('en','Ceramic mug with coffee on wooden table','bn-BD','কাঠের টেবিলে কফি সহ সিরামিক মগ','sv','Keramikmugg med kaffe på träbord'), 2),
  ('a1000000-0000-0000-0000-000000000001',
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
   jsonb_build_object('en','Studio pottery collection with handmade mugs','bn-BD','হস্তনির্মিত মগ সহ স্টুডিও পটারি সংগ্রহ','sv','Studiokeramikkollektion med handgjorda muggar'), 3);

-- ── Product 2: Hand-woven Wall Hanging ───────────────────────────────────────
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
    'en',    'Artisan wall hanging woven from natural cotton and wool on a driftwood rod. Each piece is unique. Features fringe detailing and earthy, natural dyes. Includes hanging hardware.',
    'bn-BD', 'ড্রিফটউড রডে প্রাকৃতিক তুলা এবং উলের তৈরি কারিগর ওয়াল হ্যাঙ্গিং। প্রতিটি টুকরো অনন্য। ফ্রিঞ্জ বিস্তারিত এবং মাটির, প্রাকৃতিক রং বৈশিষ্ট্য। ঝুলানোর সরঞ্জাম অন্তর্ভুক্ত।',
    'sv',    'Hantverksmässig väggdekoration vävd av naturlig bomull och ull på en drivvedspinne. Varje stycke är unikt. Har fransmönster och jordiga, naturliga färger. Monteringshårdvara ingår.'
  ),
  jsonb_build_object(
    'en',    'Artisan cotton and wool wall hanging on driftwood rod.',
    'bn-BD', 'ড্রিফটউড রডে কারিগর তুলা এবং উলের ওয়াল হ্যাঙ্গিং।',
    'sv',    'Hantverksmässig väggdekoration av bomull och ull på drivvedspinne.'
  ),
  jsonb_build_object(
    'en',    'Hand-woven Wall Hanging | Boho Home Decor',
    'bn-BD', 'হাতে বোনা ওয়াল হ্যাঙ্গিং | বোহো হোম ডেকোর',
    'sv',    'Handvävd väggdekoration | Boho heminredning'
  ),
  jsonb_build_object(
    'en',    'Unique hand-woven wall hanging in natural cotton and wool. Perfect boho home decor.',
    'bn-BD', 'প্রাকৃতিক তুলা এবং উলে অনন্য হাতে বোনা ওয়াল হ্যাঙ্গিং।',
    'sv',    'Unik handvävd väggdekoration i naturlig bomull och ull.'
  ),
  'simple', true, true
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
   jsonb_build_object('en','Macrame wall hanging texture detail','bn-BD','ম্যাক্রামে ওয়াল হ্যাঙ্গিং টেক্সচার বিবরণ','sv','Makrameé väggdekoration texturdetalj'), 1),
  ('a1000000-0000-0000-0000-000000000002',
   'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80',
   jsonb_build_object('en','Wall hanging displayed in bright living room','bn-BD','উজ্জ্বল লিভিং রুমে প্রদর্শিত ওয়াল হ্যাঙ্গিং','sv','Väggdekoration visad i ljust vardagsrum'), 2);

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
    'en',    'Hand-poured from 100% pure beeswax with cotton wicks. Burns cleanly for 40–50 hours per candle. Naturally scented with real honey and subtle wildflower notes. No synthetic fragrances or dyes.',
    'bn-BD', 'সুতার উইক সহ ১০০% বিশুদ্ধ মোম থেকে হাতে ঢালা। প্রতি মোমবাতি ৪০-৫০ ঘণ্টা পরিষ্কারভাবে জ্বলে। আসল মধু এবং সূক্ষ্ম বন্যফুলের নোট সহ প্রাকৃতিকভাবে সুগন্ধিযুক্ত। কোনো সিন্থেটিক সুগন্ধি বা রং নেই।',
    'sv',    'Handgjuten av 100% rent bivax med bomullsvekar. Brinner rent i 40–50 timmar per ljus. Naturligt doftande med verklig honung och subtila vildblomstoner. Inga syntetiska dofter eller färger.'
  ),
  jsonb_build_object(
    'en',    'Pure beeswax candles, hand-poured with cotton wicks.',
    'bn-BD', 'বিশুদ্ধ মোম মোমবাতি, সুতার উইক সহ হাতে ঢালা।',
    'sv',    'Rena bivaxljus, handgjutna med bomullsvekar.'
  ),
  jsonb_build_object(
    'en',    'Natural Beeswax Candle Set | Hand-poured Artisan Candles',
    'bn-BD', 'প্রাকৃতিক মোম মোমবাতি সেট | হাতে ঢালা কারিগর মোমবাতি',
    'sv',    'Naturligt bivaxljusset | Handgjutna hantverksljus'
  ),
  jsonb_build_object(
    'en',    'Hand-poured 100% pure beeswax candles with cotton wicks. 40-50 hour burn time.',
    'bn-BD', 'সুতার উইক সহ হাতে ঢালা ১০০% বিশুদ্ধ মোম মোমবাতি। ৪০-৫০ ঘণ্টা বার্ন টাইম।',
    'sv',    'Handgjutna 100% rena bivaxljus med bomullsvekar. 40-50 timmars brinntid.'
  ),
  'simple', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'CANDLE-SET3',
   jsonb_build_object('en','Set of 3','bn-BD','৩টির সেট','sv','Set om 3'),
   jsonb_build_object('USD',2800,'BDT',308000,'SEK',34000), 30, true),
  ('a1000000-0000-0000-0000-000000000003', 'CANDLE-SET6',
   jsonb_build_object('en','Set of 6','bn-BD','৬টির সেট','sv','Set om 6'),
   jsonb_build_object('USD',4800,'BDT',528000,'SEK',58000), 20, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80',
   jsonb_build_object('en','Natural beeswax candles burning','bn-BD','জ্বলন্ত প্রাকৃতিক মোম মোমবাতি','sv','Naturliga bivaxljus som brinner'), 0),
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1599709985558-0ced6c4febc4?w=800&q=80',
   jsonb_build_object('en','Handmade beeswax candle set on wooden tray','bn-BD','কাঠের ট্রেতে হস্তনির্মিত মোম মোমবাতি সেট','sv','Handgjort bivaxljusset på träbricka'), 1),
  ('a1000000-0000-0000-0000-000000000003',
   'https://images.unsplash.com/photo-1614032686163-bdc24c13d0b6?w=800&q=80',
   jsonb_build_object('en','Candle wax texture and cotton wick closeup','bn-BD','মোমের টেক্সচার এবং সুতার উইক ক্লোজআপ','sv','Närbild på ljusvaxets textur och bomullsvek'), 2);

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
    'en',    'Stoneware bowl hand-painted with intricate floral patterns inspired by traditional folk art. Lead-free, food-safe glaze. Suitable for fruit, salads, or as a decorative centerpiece.',
    'bn-BD', 'ঐতিহ্যবাহী লোকশিল্প থেকে অনুপ্রাণিত জটিল ফুলের নকশা দিয়ে হাতে আঁকা স্টোনওয়্যার বাটি। সীসামুক্ত, ফুড-সেফ গ্লেজ। ফল, সালাদ বা আলংকারিক সেন্টারপিস হিসেবে উপযুক্ত।',
    'sv',    'Stengodsskål handmålad med intrikata blommönster inspirerade av traditionell folkkonst. Blyfri, livsmedelssäker glasyr. Lämplig för frukt, sallader eller som dekorativ mittelpunkt.'
  ),
  jsonb_build_object(
    'en',    'Folk art-inspired stoneware bowl, hand-painted and food-safe.',
    'bn-BD', 'লোকশিল্প-অনুপ্রাণিত স্টোনওয়্যার বাটি, হাতে আঁকা এবং ফুড-সেফ।',
    'sv',    'Folkkonst-inspirerad stengodsskål, handmålad och livsmedelssäker.'
  ),
  jsonb_build_object(
    'en',    'Hand-painted Pottery Bowl | Folk Art Ceramics',
    'bn-BD', 'হাতে আঁকা মাটির বাটি | লোকশিল্প সিরামিক',
    'sv',    'Handmålad keramikskål | Folkkonst keramik'
  ),
  jsonb_build_object(
    'en',    'Hand-painted stoneware bowl with traditional folk art floral patterns. Food-safe.',
    'bn-BD', 'ঐতিহ্যবাহী লোকশিল্প ফুলের নকশা সহ হাতে আঁকা স্টোনওয়্যার বাটি।',
    'sv',    'Handmålad stengodsskål med traditionella folkkonst-blommönster. Livsmedelssäker.'
  ),
  'simple', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'BOWL-SM',
   jsonb_build_object('en','Small (18 cm)','bn-BD','ছোট (১৮ সেমি)','sv','Liten (18 cm)'),
   jsonb_build_object('USD',2200,'BDT',242000,'SEK',27000), 25, true),
  ('a1000000-0000-0000-0000-000000000004', 'BOWL-LG',
   jsonb_build_object('en','Large (28 cm)','bn-BD','বড় (২৮ সেমি)','sv','Stor (28 cm)'),
   jsonb_build_object('USD',3500,'BDT',385000,'SEK',42000), 18, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=800&q=80',
   jsonb_build_object('en','Hand-painted ceramic bowl with floral motifs','bn-BD','ফুলের মোটিফ সহ হাতে আঁকা সিরামিক বাটি','sv','Handmålad keramikskål med blommotiv'), 0),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
   jsonb_build_object('en','Pottery bowl painting detail closeup','bn-BD','মাটির বাটি পেইন্টিং বিবরণ ক্লোজআপ','sv','Närbild på keramikskålens målningsdetalj'), 1),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',
   jsonb_build_object('en','Colorful pottery bowl with fruit','bn-BD','ফলের সাথে রঙিন মাটির বাটি','sv','Färgglad keramikskål med frukt'), 2),
  ('a1000000-0000-0000-0000-000000000004',
   'https://images.unsplash.com/photo-1612197527762-8cfb55b618a9?w=800&q=80',
   jsonb_build_object('en','Artisan pottery collection on shelf','bn-BD','শেলফে কারিগর মাটির সংগ্রহ','sv','Hantverkskeramikkollektion på hylla'), 3);

-- ── Product 5: Macramé Plant Hanger ──────────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Macramé Plant Hanger',
    'bn-BD', 'ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার',
    'sv',    'Makrameé blomkrukhängare'
  ),
  jsonb_build_object(
    'en',    'macrame-plant-hanger',
    'bn-BD', 'macrame-plant-hanger',
    'sv',    'makramee-blomkrukhangare'
  ),
  jsonb_build_object(
    'en',    'Hand-knotted macramé plant hanger made from 100% natural cotton rope. Features a series of square knots and spiral patterns. Suitable for pots up to 18 cm in diameter. Includes a wooden dowel.',
    'bn-BD', '১০০% প্রাকৃতিক সুতার দড়ি থেকে হাতে বাঁধা ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার। বর্গক্ষেত্র বাঁধন এবং সর্পিল নকশার একটি সিরিজ বৈশিষ্ট্য। ১৮ সেমি পর্যন্ত ব্যাসের পাত্রের জন্য উপযুক্ত। একটি কাঠের ডোয়েল অন্তর্ভুক্ত।',
    'sv',    'Handknutet makrameé blomkrukhängare gjord av 100% naturligt bomullsrep. Har en serie fyrkantsknutar och spiralmönster. Lämplig för krukor upp till 18 cm i diameter. Träpinne ingår.'
  ),
  jsonb_build_object(
    'en',    'Hand-knotted cotton macramé plant hanger.',
    'bn-BD', 'হাতে বাঁধা তুলার ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার।',
    'sv',    'Handknutet bomullsmakrameé blomkrukhängare.'
  ),
  jsonb_build_object(
    'en',    'Macramé Plant Hanger | Handmade Boho Decor',
    'bn-BD', 'ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার | হস্তনির্মিত বোহো ডেকোর',
    'sv',    'Makrameé blomkrukhängare | Handgjord boho-dekor'
  ),
  jsonb_build_object(
    'en',    'Hand-knotted macramé plant hanger in 100% natural cotton. Fits pots up to 18 cm.',
    'bn-BD', '১০০% প্রাকৃতিক তুলায় হাতে বাঁধা ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার।',
    'sv',    'Handknutet makrameé blomkrukhängare i 100% naturlig bomull.'
  ),
  'simple', true, true
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'MACRAME-SM',
   jsonb_build_object('en','Small (60 cm)','bn-BD','ছোট (৬০ সেমি)','sv','Liten (60 cm)'),
   jsonb_build_object('USD',1600,'BDT',176000,'SEK',20000), 35, true),
  ('a1000000-0000-0000-0000-000000000005', 'MACRAME-LG',
   jsonb_build_object('en','Large (90 cm)','bn-BD','বড় (৯০ সেমি)','sv','Stor (90 cm)'),
   jsonb_build_object('USD',2400,'BDT',264000,'SEK',29000), 25, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
   jsonb_build_object('en','Macrame plant hanger with potted plant','bn-BD','গাছ সহ ম্যাক্রামে প্ল্যান্ট হ্যাঙ্গার','sv','Makrameé blomkrukhängare med krukväxt'), 0),
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
   jsonb_build_object('en','Macrame knot detail in natural cotton','bn-BD','প্রাকৃতিক তুলায় ম্যাক্রামে গাঁট বিবরণ','sv','Makrameéknutar i naturlig bomull'), 1),
  ('a1000000-0000-0000-0000-000000000005',
   'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=800&q=80',
   jsonb_build_object('en','Boho plant hanger in bright home setting','bn-BD','উজ্জ্বল বাড়ির সেটিংয়ে বোহো প্ল্যান্ট হ্যাঙ্গার','sv','Boho blomkrukhängare i ljus hemmiljö'), 2);

-- ── Product 6: Hand-dyed Silk Scarf ──────────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000006',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-dyed Silk Scarf',
    'bn-BD', 'হাতে রং করা সিল্ক স্কার্ফ',
    'sv',    'Handfärgad sidensjal'
  ),
  jsonb_build_object(
    'en',    'hand-dyed-silk-scarf',
    'bn-BD', 'hate-rang-kora-silk-scarf',
    'sv',    'handfargad-sidensjal'
  ),
  jsonb_build_object(
    'en',    'Luxurious 100% pure silk scarf dyed using traditional shibori tie-dye techniques. Each piece has a unique pattern. Dimensions: 180×45 cm. Hand wash cold; lay flat to dry.',
    'bn-BD', 'ঐতিহ্যবাহী শিবোরি টাই-ডাই কৌশল ব্যবহার করে রং করা বিলাসবহুল ১০০% বিশুদ্ধ সিল্ক স্কার্ফ। প্রতিটি টুকরো একটি অনন্য নকশা আছে। মাত্রা: ১৮০×৪৫ সেমি। ঠান্ডায় হাতে ধুন; শুকানোর জন্য সমতলে রাখুন।',
    'sv',    'Lyxig 100% rent sidensjal färgad med traditionella shibori-batiktekniker. Varje stycke har ett unikt mönster. Mått: 180×45 cm. Handtvätt kallt; lägg platt för torkning.'
  ),
  jsonb_build_object(
    'en',    'Pure silk scarf dyed using traditional shibori techniques.',
    'bn-BD', 'ঐতিহ্যবাহী শিবোরি কৌশল ব্যবহার করে রং করা বিশুদ্ধ সিল্ক স্কার্ফ।',
    'sv',    'Ren sidensjal färgad med traditionella shibori-tekniker.'
  ),
  jsonb_build_object(
    'en',    'Hand-dyed Silk Scarf | Shibori Artisan Textile',
    'bn-BD', 'হাতে রং করা সিল্ক স্কার্ফ | শিবোরি কারিগর টেক্সটাইল',
    'sv',    'Handfärgad sidensjal | Shibori hantverkstextil'
  ),
  jsonb_build_object(
    'en',    'Luxurious 100% pure silk scarf hand-dyed with shibori techniques. One-of-a-kind piece.',
    'bn-BD', 'শিবোরি কৌশলে হাতে রং করা বিলাসবহুল ১০০% বিশুদ্ধ সিল্ক স্কার্ফ।',
    'sv',    'Lyxig 100% ren sidensjal handfärgad med shibori-tekniker. Unikt stycke.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'SILK-INDIGO',
   jsonb_build_object('en','Indigo Blue','bn-BD','ইন্ডিগো নীল','sv','Indigoblå'),
   jsonb_build_object('USD',6500,'BDT',715000,'SEK',78000), 12, true),
  ('a1000000-0000-0000-0000-000000000006', 'SILK-TERRA',
   jsonb_build_object('en','Terracotta','bn-BD','টেরাকোটা','sv','Terrakotta'),
   jsonb_build_object('USD',6500,'BDT',715000,'SEK',78000), 10, true),
  ('a1000000-0000-0000-0000-000000000006', 'SILK-FOREST',
   jsonb_build_object('en','Forest Green','bn-BD','বন সবুজ','sv','Skogsgrön'),
   jsonb_build_object('USD',6500,'BDT',715000,'SEK',78000), 8, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80',
   jsonb_build_object('en','Hand-dyed indigo silk scarf draped','bn-BD','ঝুলানো হাতে রং করা ইন্ডিগো সিল্ক স্কার্ফ','sv','Draperad handfärgad indigosidensjal'), 0),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80',
   jsonb_build_object('en','Shibori dye pattern detail','bn-BD','শিবোরি রং নকশা বিবরণ','sv','Shibori-färgmönster detalj'), 1),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
   jsonb_build_object('en','Silk scarf colors spread out','bn-BD','সিল্ক স্কার্ফ রং ছড়িয়ে দেওয়া','sv','Sidensjal med utspridda färger'), 2),
  ('a1000000-0000-0000-0000-000000000006',
   'https://images.unsplash.com/photo-1617721845897-79e47e1fc21e?w=800&q=80',
   jsonb_build_object('en','Artisan dyeing silk scarf in workshop','bn-BD','কর্মশালায় কারিগর সিল্ক স্কার্ফ রং করছেন','sv','Hantverkare färgar sidensjal i verkstad'), 3);

-- ── Product 7: Hand-carved Wooden Cutting Board ──────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000007',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-carved Wooden Cutting Board',
    'bn-BD', 'হাতে খোদাই করা কাঠের কাটিং বোর্ড',
    'sv',    'Handsnidad träskärbräda'
  ),
  jsonb_build_object(
    'en',    'hand-carved-wooden-cutting-board',
    'bn-BD', 'hate-khodai-kora-kather-cutting-board',
    'sv',    'handsnidad-traskarbrada'
  ),
  jsonb_build_object(
    'en',    'Solid walnut cutting board with hand-carved geometric border. End-grain construction for knife longevity. Finished with food-safe mineral oil and beeswax. Juice groove on reverse side.',
    'bn-BD', 'হাতে খোদাই করা জ্যামিতিক বর্ডার সহ শক্ত আখরোট কাটিং বোর্ড। ছুরির দীর্ঘায়ুর জন্য এন্ড-গ্রেইন নির্মাণ। ফুড-সেফ মিনারেল অয়েল এবং মোম দিয়ে সম্পন্ন। পিছনের দিকে জুস গ্রুভ।',
    'sv',    'Massiv valnötsskärbräda med handsnidad geometrisk kant. Ändkornkonstruktion för knivens livslängd. Avslutad med livsmedelssäker mineralolja och bivax. Saftranna på baksidan.'
  ),
  jsonb_build_object(
    'en',    'End-grain walnut cutting board with hand-carved border.',
    'bn-BD', 'হাতে খোদাই করা বর্ডার সহ এন্ড-গ্রেইন আখরোট কাটিং বোর্ড।',
    'sv',    'Ändkorns valnötsskärbräda med handsnidad kant.'
  ),
  jsonb_build_object(
    'en',    'Hand-carved Walnut Cutting Board | Artisan Woodcraft',
    'bn-BD', 'হাতে খোদাই করা আখরোট কাটিং বোর্ড | কারিগর কাঠশিল্প',
    'sv',    'Handsnidad valnötsskärbräda | Hantverksträslöjd'
  ),
  jsonb_build_object(
    'en',    'Solid walnut end-grain cutting board with hand-carved border. Food-safe mineral oil finish.',
    'bn-BD', 'হাতে খোদাই করা বর্ডার সহ শক্ত আখরোট এন্ড-গ্রেইন কাটিং বোর্ড।',
    'sv',    'Massiv valnöts ändkornskärbräda med handsnidad kant. Livsmedelssäker mineralolja finish.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000007', 'BOARD-SM',
   jsonb_build_object('en','Small (25×20 cm)','bn-BD','ছোট (২৫×২০ সেমি)','sv','Liten (25×20 cm)'),
   jsonb_build_object('USD',3800,'BDT',418000,'SEK',46000), 20, true),
  ('a1000000-0000-0000-0000-000000000007', 'BOARD-MD',
   jsonb_build_object('en','Medium (35×25 cm)','bn-BD','মাঝারি (৩৫×২৫ সেমি)','sv','Medium (35×25 cm)'),
   jsonb_build_object('USD',5500,'BDT',605000,'SEK',65000), 15, true),
  ('a1000000-0000-0000-0000-000000000007', 'BOARD-LG',
   jsonb_build_object('en','Large (45×30 cm)','bn-BD','বড় (৪৫×৩০ সেমি)','sv','Stor (45×30 cm)'),
   jsonb_build_object('USD',7500,'BDT',825000,'SEK',90000), 10, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1605522561233-768ad7a8fabf?w=800&q=80',
   jsonb_build_object('en','Hand-carved walnut cutting board top view','bn-BD','হাতে খোদাই করা আখরোট কাটিং বোর্ড উপরের দৃশ্য','sv','Handsnidad valnötsskärbräda ovanifrån'), 0),
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
   jsonb_build_object('en','Wooden cutting board with carved border detail','bn-BD','খোদাই করা বর্ডার বিবরণ সহ কাঠের কাটিং বোর্ড','sv','Träskärbräda med snidad kantdetalj'), 1),
  ('a1000000-0000-0000-0000-000000000007',
   'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80',
   jsonb_build_object('en','End grain wood texture closeup','bn-BD','এন্ড গ্রেইন কাঠের টেক্সচার ক্লোজআপ','sv','Närbild på ändkorns trätextur'), 2);

-- ── Product 8: Artisan Floral Soap Bar ───────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000008',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Artisan Floral Soap Bar',
    'bn-BD', 'কারিগর ফুলের সাবান বার',
    'sv',    'Hantverksmässig blomtvålbar'
  ),
  jsonb_build_object(
    'en',    'artisan-floral-soap-bar',
    'bn-BD', 'karigar-fuler-saban-bar',
    'sv',    'hantverksmassig-blomtvalbar'
  ),
  jsonb_build_object(
    'en',    'Cold-process artisan soap made with shea butter, coconut oil, and real dried flowers. Free from synthetic preservatives. Net weight 120g per bar. Skin-safe for all skin types.',
    'bn-BD', 'শিয়া বাটার, নারকেল তেল এবং আসল শুকনো ফুল দিয়ে তৈরি কোল্ড-প্রসেস কারিগর সাবান। সিন্থেটিক সংরক্ষক মুক্ত। প্রতি বারে নেট ওজন ১২০ গ্রাম। সব ধরনের ত্বকের জন্য নিরাপদ।',
    'sv',    'Kallprocessat hantverkssvål gjord med sheabutter, kokosolja och riktiga torkade blommor. Fri från syntetiska konserveringsmedel. Nettovikt 120g per stång. Hudvänlig för alla hudtyper.'
  ),
  jsonb_build_object(
    'en',    'Cold-process artisan soap with shea butter and real dried flowers.',
    'bn-BD', 'শিয়া বাটার এবং আসল শুকনো ফুল সহ কোল্ড-প্রসেস কারিগর সাবান।',
    'sv',    'Kallprocessat hantverkssvål med sheabutter och riktiga torkade blommor.'
  ),
  jsonb_build_object(
    'en',    'Artisan Floral Soap Bar | Natural Handmade Skincare',
    'bn-BD', 'কারিগর ফুলের সাবান বার | প্রাকৃতিক হস্তনির্মিত স্কিনকেয়ার',
    'sv',    'Hantverksmässig blomtvålbar | Naturlig handgjord hudvård'
  ),
  jsonb_build_object(
    'en',    'Cold-process artisan soap with shea butter and dried flowers. 120g. All skin types.',
    'bn-BD', 'শিয়া বাটার এবং শুকনো ফুল সহ কোল্ড-প্রসেস কারিগর সাবান। ১২০ গ্রাম।',
    'sv',    'Kallprocessat hantverkssvål med sheabutter och torkade blommor. 120g. Alla hudtyper.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000008', 'SOAP-LAV',
   jsonb_build_object('en','Lavender & Chamomile','bn-BD','ল্যাভেন্ডার ও ক্যামোমাইল','sv','Lavendel & Kamomill'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 50, true),
  ('a1000000-0000-0000-0000-000000000008', 'SOAP-ROSE',
   jsonb_build_object('en','Rose & Hibiscus','bn-BD','গোলাপ ও হিবিস্কাস','sv','Ros & Hibiskus'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 45, true),
  ('a1000000-0000-0000-0000-000000000008', 'SOAP-CITRUS',
   jsonb_build_object('en','Citrus & Calendula','bn-BD','সাইট্রাস ও ক্যালেন্ডুলা','sv','Citrus & Ringblomma'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 40, true),
  ('a1000000-0000-0000-0000-000000000008', 'SOAP-MINT',
   jsonb_build_object('en','Peppermint & Eucalyptus','bn-BD','পেপারমিন্ট ও ইউক্যালিপটাস','sv','Pepparmynta & Eukalyptus'),
   jsonb_build_object('USD',900,'BDT',99000,'SEK',11000), 38, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&q=80',
   jsonb_build_object('en','Artisan floral soap bars with dried flowers','bn-BD','শুকনো ফুল সহ কারিগর ফুলের সাবান বার','sv','Hantverksmässiga blomtvålbitar med torkade blommor'), 0),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1612540139150-4b4c6c8a0a9c?w=800&q=80',
   jsonb_build_object('en','Handmade soap with lavender flowers','bn-BD','ল্যাভেন্ডার ফুল সহ হস্তনির্মিত সাবান','sv','Handgjord tvål med lavendelblommor'), 1),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1591130901921-c1a9e3aa0b00?w=800&q=80',
   jsonb_build_object('en','Natural soap ingredients shea butter and oils','bn-BD','প্রাকৃতিক সাবান উপাদান শিয়া বাটার ও তেল','sv','Naturliga tvålingredienser sheabutter och oljor'), 2),
  ('a1000000-0000-0000-0000-000000000008',
   'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&q=80',
   jsonb_build_object('en','Colorful artisan soap collection on display','bn-BD','প্রদর্শনীতে রঙিন কারিগর সাবান সংগ্রহ','sv','Färgglad hantverkstvålkollektion på display'), 3);

-- ── Product 9: Embroidered Linen Tote Bag ────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000009',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Embroidered Linen Tote Bag',
    'bn-BD', 'এমব্রয়ডারি করা লিনেন টোট ব্যাগ',
    'sv',    'Broderad linnebärkasse'
  ),
  jsonb_build_object(
    'en',    'embroidered-linen-tote-bag',
    'bn-BD', 'embroidery-kora-linen-tote-bag',
    'sv',    'broderad-linnebarkasse'
  ),
  jsonb_build_object(
    'en',    'Heavy-duty 100% linen tote bag hand-embroidered with botanical motifs. Internal pocket with zip. Reinforced handles. Dimensions: 40×45 cm. Machine washable at 30°C.',
    'bn-BD', 'উদ্ভিদ মোটিফ দিয়ে হাতে এমব্রয়ডারি করা ভারী শুল্ক ১০০% লিনেন টোট ব্যাগ। জিপ সহ অভ্যন্তরীণ পকেট। শক্তিশালী হ্যান্ডেল। মাত্রা: ৪০×৪৫ সেমি। ৩০°সে তাপমাত্রায় মেশিনে ধোয়া যায়।',
    'sv',    'Kraftig 100% linne toteväska handbrodyrd med botaniska motiv. Invändig ficka med blixtlås. Förstärkta handtag. Mått: 40×45 cm. Maskintvättbar vid 30°C.'
  ),
  jsonb_build_object(
    'en',    'Hand-embroidered 100% linen tote with botanical motifs.',
    'bn-BD', 'উদ্ভিদ মোটিফ সহ হাতে এমব্রয়ডারি করা ১০০% লিনেন টোট।',
    'sv',    'Handbroderad 100% linne-tote med botaniska motiv.'
  ),
  jsonb_build_object(
    'en',    'Embroidered Linen Tote Bag | Handmade Eco Bag',
    'bn-BD', 'এমব্রয়ডারি করা লিনেন টোট ব্যাগ | হস্তনির্মিত ইকো ব্যাগ',
    'sv',    'Broderad linnebärkasse | Handgjord ekoväska'
  ),
  jsonb_build_object(
    'en',    'Hand-embroidered 100% linen tote bag with botanical motifs. Machine washable.',
    'bn-BD', 'উদ্ভিদ মোটিফ সহ হাতে এমব্রয়ডারি করা ১০০% লিনেন টোট ব্যাগ।',
    'sv',    'Handbroderad 100% linnebärkasse med botaniska motiv. Maskintvättbar.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000009', 'TOTE-NAT',
   jsonb_build_object('en','Natural Linen','bn-BD','প্রাকৃতিক লিনেন','sv','Naturligt linne'),
   jsonb_build_object('USD',3200,'BDT',352000,'SEK',39000), 22, true),
  ('a1000000-0000-0000-0000-000000000009', 'TOTE-SLATE',
   jsonb_build_object('en','Slate Blue','bn-BD','স্লেট নীল','sv','Skifferblå'),
   jsonb_build_object('USD',3200,'BDT',352000,'SEK',39000), 18, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
   jsonb_build_object('en','Embroidered linen tote bag with botanical pattern','bn-BD','উদ্ভিদ নকশা সহ এমব্রয়ডারি করা লিনেন টোট ব্যাগ','sv','Broderad linnebärkasse med botaniskt mönster'), 0),
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80',
   jsonb_build_object('en','Embroidery detail on natural linen','bn-BD','প্রাকৃতিক লিনেনে এমব্রয়ডারি বিবরণ','sv','Brodyrdetalj på naturligt linne'), 1),
  ('a1000000-0000-0000-0000-000000000009',
   'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
   jsonb_build_object('en','Linen tote bag in use at market','bn-BD','বাজারে ব্যবহারে লিনেন টোট ব্যাগ','sv','Linnebärkasse i användning på marknad'), 2);

-- ── Product 10: Hand-knitted Wool Throw Blanket ───────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000010',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Hand-knitted Wool Throw Blanket',
    'bn-BD', 'হাতে বোনা উলের থ্রো ব্ল্যাংকেট',
    'sv',    'Handstickad ullpläd'
  ),
  jsonb_build_object(
    'en',    'hand-knitted-wool-throw-blanket',
    'bn-BD', 'hate-bona-uler-throw-blanket',
    'sv',    'handstickad-ullplad'
  ),
  jsonb_build_object(
    'en',    'Chunky hand-knitted throw blanket made from 100% merino wool. Oversized basket-weave pattern. Dimensions: 130×170 cm. Dry clean or hand wash cold. A cosy statement piece for any sofa or bed.',
    'bn-BD', '১০০% মেরিনো উল থেকে তৈরি চাঙ্কি হাতে বোনা থ্রো ব্ল্যাংকেট। ওভারসাইজড বাস্কেট-ওয়েভ প্যাটার্ন। মাত্রা: ১৩০×১৭০ সেমি। ড্রাই ক্লিন বা ঠান্ডায় হাতে ধুন। যেকোনো সোফা বা বিছানার জন্য একটি আরামদায়ক স্টেটমেন্ট পিস।',
    'sv',    'Tjock handstickad pläd gjord av 100% merinoull. Överdimensionerat korgvävmönster. Mått: 130×170 cm. Kemtvätta eller handtvätta kallt. En mysig paradstycke för vilken soffa eller säng som helst.'
  ),
  jsonb_build_object(
    'en',    'Chunky hand-knitted merino wool throw, 130×170 cm.',
    'bn-BD', 'চাঙ্কি হাতে বোনা মেরিনো উলের থ্রো, ১৩০×১৭০ সেমি।',
    'sv',    'Tjock handstickad merinoullpläd, 130×170 cm.'
  ),
  jsonb_build_object(
    'en',    'Hand-knitted Wool Throw Blanket | Merino Chunky Knit',
    'bn-BD', 'হাতে বোনা উলের থ্রো ব্ল্যাংকেট | মেরিনো চাঙ্কি নিট',
    'sv',    'Handstickad ullpläd | Merino grovstickad'
  ),
  jsonb_build_object(
    'en',    'Chunky hand-knitted merino wool throw blanket, 130×170 cm. Basket-weave pattern.',
    'bn-BD', 'চাঙ্কি হাতে বোনা মেরিনো উলের থ্রো ব্ল্যাংকেট, ১৩০×১৭০ সেমি।',
    'sv',    'Tjock handstickad merinoullpläd, 130×170 cm. Korgvävmönster.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000010', 'THROW-WHITE',
   jsonb_build_object('en','Natural White','bn-BD','প্রাকৃতিক সাদা','sv','Naturvit'),
   jsonb_build_object('USD',8900,'BDT',979000,'SEK',106000), 12, true),
  ('a1000000-0000-0000-0000-000000000010', 'THROW-GREY',
   jsonb_build_object('en','Charcoal Grey','bn-BD','কয়লা ধূসর','sv','Kolgrisr'),
   jsonb_build_object('USD',8900,'BDT',979000,'SEK',106000), 10, true),
  ('a1000000-0000-0000-0000-000000000010', 'THROW-ROSE',
   jsonb_build_object('en','Dusty Rose','bn-BD','ধুলোময় গোলাপ','sv','Dammrosa'),
   jsonb_build_object('USD',8900,'BDT',979000,'SEK',106000), 8, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&q=80',
   jsonb_build_object('en','Chunky knit wool throw blanket on sofa','bn-BD','সোফায় চাঙ্কি নিট উলের থ্রো ব্ল্যাংকেট','sv','Grovstickad ullpläd på soffa'), 0),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
   jsonb_build_object('en','Merino wool texture closeup','bn-BD','মেরিনো উলের টেক্সচার ক্লোজআপ','sv','Närbild på merinoullens textur'), 1),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
   jsonb_build_object('en','Wool throw blanket in natural white','bn-BD','প্রাকৃতিক সাদায় উলের থ্রো ব্ল্যাংকেট','sv','Ullpläd i naturvitt'), 2),
  ('a1000000-0000-0000-0000-000000000010',
   'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80',
   jsonb_build_object('en','Hand knitting process with chunky wool yarn','bn-BD','চাঙ্কি উলের সুতা দিয়ে হাতে বোনার প্রক্রিয়া','sv','Handstickningsprocess med grovt ullgarn'), 3);

-- ── Product 11: Handmade Leather Journal ─────────────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000011',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Handmade Leather Journal',
    'bn-BD', 'হস্তনির্মিত চামড়ার জার্নাল',
    'sv',    'Handgjord läderdagbok'
  ),
  jsonb_build_object(
    'en',    'handmade-leather-journal',
    'bn-BD', 'hastanirmita-chamrar-journal',
    'sv',    'handgjord-laderdagbok'
  ),
  jsonb_build_object(
    'en',    'Full-grain vegetable-tanned leather journal with hand-stitched binding. 200 pages of acid-free recycled paper. Includes a leather cord closure. Ideal for sketching, journaling, or travel notes.',
    'bn-BD', 'হাতে সেলাই করা বাইন্ডিং সহ ফুল-গ্রেইন ভেজিটেবল-ট্যানড চামড়ার জার্নাল। অ্যাসিড-মুক্ত পুনর্ব্যবহৃত কাগজের ২০০ পৃষ্ঠা। চামড়ার দড়ি বন্ধনী অন্তর্ভুক্ত। স্কেচিং, জার্নালিং বা ভ্রমণের নোটের জন্য আদর্শ।',
    'sv',    'Fullkorns vegetabilgarvat läderjournal med handsytt binderi. 200 sidor syrafritt återvunnet papper. Inkluderar ett lädersnörslås. Idealisk för skissning, dagboksskrivning eller resanteckningar.'
  ),
  jsonb_build_object(
    'en',    'Full-grain leather journal with hand-stitched binding, 200 acid-free pages.',
    'bn-BD', 'হাতে সেলাই করা বাইন্ডিং সহ ফুল-গ্রেইন চামড়ার জার্নাল, ২০০ অ্যাসিড-মুক্ত পৃষ্ঠা।',
    'sv',    'Fullkorns läderjournal med handsytt binderi, 200 syrafria sidor.'
  ),
  jsonb_build_object(
    'en',    'Handmade Leather Journal | Vegetable-tanned Artisan Notebook',
    'bn-BD', 'হস্তনির্মিত চামড়ার জার্নাল | ভেজিটেবল-ট্যানড কারিগর নোটবুক',
    'sv',    'Handgjord läderdagbok | Vegetabilgarvad hantverksanteckningsbok'
  ),
  jsonb_build_object(
    'en',    'Full-grain leather journal, hand-stitched, 200 acid-free pages. Perfect for travel.',
    'bn-BD', 'ফুল-গ্রেইন চামড়ার জার্নাল, হাতে সেলাই, ২০০ অ্যাসিড-মুক্ত পৃষ্ঠা।',
    'sv',    'Fullkorns läderjournal, handsydd, 200 syrafria sidor. Perfekt för resor.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000011', 'JOURNAL-A5',
   jsonb_build_object('en','A5 (14×21 cm)','bn-BD','A5 (১৪×২১ সেমি)','sv','A5 (14×21 cm)'),
   jsonb_build_object('USD',4500,'BDT',495000,'SEK',54000), 18, true),
  ('a1000000-0000-0000-0000-000000000011', 'JOURNAL-A4',
   jsonb_build_object('en','A4 (21×29 cm)','bn-BD','A4 (২১×২৯ সেমি)','sv','A4 (21×29 cm)'),
   jsonb_build_object('USD',6500,'BDT',715000,'SEK',78000), 12, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
   jsonb_build_object('en','Handmade leather journal on wooden desk','bn-BD','কাঠের ডেস্কে হস্তনির্মিত চামড়ার জার্নাল','sv','Handgjord läderdagbok på träskrivbord'), 0),
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
   jsonb_build_object('en','Leather journal stitching detail','bn-BD','চামড়ার জার্নাল সেলাই বিবরণ','sv','Läderdagbok sömdetalj'), 1),
  ('a1000000-0000-0000-0000-000000000011',
   'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
   jsonb_build_object('en','Open journal with pen on rustic table','bn-BD','গ্রামীণ টেবিলে কলম সহ খোলা জার্নাল','sv','Öppen dagbok med penna på rustikt bord'), 2);

-- ── Product 12: Handcrafted Beaded Bracelet Set ───────────────────────────────
INSERT INTO public.products
  (id, category_id, name, slug, description, short_description,
   meta_title, meta_description, product_type, is_active, is_featured)
VALUES (
  'a1000000-0000-0000-0000-000000000012',
  'b1000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'en',    'Handcrafted Beaded Bracelet Set',
    'bn-BD', 'হস্তনির্মিত পুঁতির ব্রেসলেট সেট',
    'sv',    'Handgjort pärlat armbandsset'
  ),
  jsonb_build_object(
    'en',    'handcrafted-beaded-bracelet-set',
    'bn-BD', 'hastanirmita-putir-bracelet-set',
    'sv',    'handgjort-parlat-armbandsset'
  ),
  jsonb_build_object(
    'en',    'Set of 5 handcrafted bracelets using natural stone beads — agate, jasper, lava stone and onyx — threaded on elastic cord. Adjustable sizing, fits most wrists 16–20 cm. Packaged in a reusable linen pouch.',
    'bn-BD', 'ইলাস্টিক দড়িতে প্রাকৃতিক পাথরের পুঁতি — অ্যাগেট, জ্যাসপার, লাভা স্টোন এবং ওনিক্স — ব্যবহার করে ৫টি হস্তনির্মিত ব্রেসলেটের সেট। সামঞ্জস্যযোগ্য সাইজিং, বেশিরভাগ কব্জি ১৬-২০ সেমি ফিট করে। পুনরায় ব্যবহারযোগ্য লিনেন পাউচে প্যাকেজ করা।',
    'sv',    'Set med 5 handgjorda armband med naturliga stenpärlor — agat, jaspis, lavasten och onyx — trädda på elastiskt snöre. Justerbar storlek, passar de flesta handleder 16–20 cm. Förpackade i en återanvändbar linnepåse.'
  ),
  jsonb_build_object(
    'en',    'Set of 5 handcrafted natural stone bead bracelets on elastic cord.',
    'bn-BD', 'ইলাস্টিক দড়িতে ৫টি হস্তনির্মিত প্রাকৃতিক পাথরের পুঁতির ব্রেসলেটের সেট।',
    'sv',    'Set med 5 handgjorda naturstensperle armband på elastiskt snöre.'
  ),
  jsonb_build_object(
    'en',    'Handcrafted Beaded Bracelet Set | Natural Stone Jewellery',
    'bn-BD', 'হস্তনির্মিত পুঁতির ব্রেসলেট সেট | প্রাকৃতিক পাথরের গহনা',
    'sv',    'Handgjort pärlat armbandsset | Naturstenssmycken'
  ),
  jsonb_build_object(
    'en',    'Set of 5 handcrafted natural stone bracelets. Agate, jasper, lava stone and onyx.',
    'bn-BD', '৫টি হস্তনির্মিত প্রাকৃতিক পাথরের ব্রেসলেটের সেট। অ্যাগেট, জ্যাসপার, লাভা স্টোন এবং ওনিক্স।',
    'sv',    'Set med 5 handgjorda naturstensarmband. Agat, jaspis, lavasten och onyx.'
  ),
  'simple', true, false
);

INSERT INTO public.product_variants (product_id, sku, name, prices, stock_quantity, is_active) VALUES
  ('a1000000-0000-0000-0000-000000000012', 'BEAD-EARTH',
   jsonb_build_object('en','Earth Tones','bn-BD','মাটির টোন','sv','Jordtoner'),
   jsonb_build_object('USD',2800,'BDT',308000,'SEK',34000), 25, true),
  ('a1000000-0000-0000-0000-000000000012', 'BEAD-OCEAN',
   jsonb_build_object('en','Ocean Blues','bn-BD','সমুদ্রের নীল','sv','Havsblå'),
   jsonb_build_object('USD',2800,'BDT',308000,'SEK',34000), 20, true),
  ('a1000000-0000-0000-0000-000000000012', 'BEAD-FOREST',
   jsonb_build_object('en','Forest Greens','bn-BD','বনের সবুজ','sv','Skogsgröna'),
   jsonb_build_object('USD',2800,'BDT',308000,'SEK',34000), 18, true);

INSERT INTO public.product_images (product_id, url, alt_text, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
   jsonb_build_object('en','Handcrafted beaded bracelet set in earth tones','bn-BD','মাটির টোনে হস্তনির্মিত পুঁতির ব্রেসলেট সেট','sv','Handgjort pärlat armbandsset i jordtoner'), 0),
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
   jsonb_build_object('en','Natural stone beads detail closeup','bn-BD','প্রাকৃতিক পাথরের পুঁতি বিবরণ ক্লোজআপ','sv','Närbild på naturstensdetaljer'), 1),
  ('a1000000-0000-0000-0000-000000000012',
   'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=800&q=80',
   jsonb_build_object('en','Bracelet set displayed on wrist','bn-BD','কব্জিতে প্রদর্শিত ব্রেসলেট সেট','sv','Armbandsset visas på handleden'), 2);
