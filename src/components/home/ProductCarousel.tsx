import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/domain";

interface ProductCarouselProps {
  products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  return (
    <div className="product-carousel -mx-2">
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={16}
        breakpoints={{
          320: { slidesPerView: 2, spaceBetween: 12 },
          640: { slidesPerView: 2, spaceBetween: 16 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        }}
        className="w-full px-2"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="pb-2">
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .product-carousel .swiper-button-next,
        .product-carousel .swiper-button-prev {
          display: none;
        }
        @media (min-width: 640px) {
          .product-carousel .swiper-button-next,
          .product-carousel .swiper-button-prev {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1f2937;
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            width: 44px;
            height: 44px;
            border-radius: 14px;
            transition: all 0.2s;
          }
          .product-carousel .swiper-button-next:after,
          .product-carousel .swiper-button-prev:after {
            font-size: 14px;
            font-weight: bold;
          }
          .product-carousel .swiper-button-next:hover,
          .product-carousel .swiper-button-prev:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
        }
      `}</style>
    </div>
  );
}
