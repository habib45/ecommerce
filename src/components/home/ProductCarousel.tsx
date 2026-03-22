import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { Product } from "@/types/Product";

interface ProductCarouselProps {
  products: Product[];
  loading?: boolean;
}

export function ProductCarousel({ products, loading }: ProductCarouselProps) {
  return (
    <div className="product-carousel">
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={20}
        breakpoints={{
          320: { slidesPerView: 1 },
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        className="w-full"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .product-carousel .swiper-button-next,
        .product-carousel .swiper-button-prev {
          color: #1f2937;
          background-color: rgba(229, 231, 235, 0.8);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .product-carousel .swiper-button-next:after,
        .product-carousel .swiper-button-prev:after {
          font-size: 16px;
        }
        .product-carousel .swiper-button-next:hover,
        .product-carousel .swiper-button-prev:hover {
          background-color: rgba(209, 213, 219, 1);
        }
        .product-carousel .swiper-button-next:disabled,
        .product-carousel .swiper-button-prev:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
