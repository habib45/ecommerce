import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useTranslation } from "react-i18next";
import { ProductSearch } from "@/components/product/ProductSearch";

export function HeroSlider() {
  const { t } = useTranslation();

  const slides = [
    {
      id: 1,
      title: t("seo.homeTitle"),
      description: t("seo.homeDescription"),
      bgGradient: "from-blue-600 to-blue-800",
      accent: "blue",
    },
    {
      id: 2,
      title: t("product.featured"),
      description: "Discover our exclusive collection of premium products",
      bgGradient: "from-purple-600 to-indigo-800",
      accent: "purple",
    },
    {
      id: 3,
      title: "Special Offers",
      description: "Get up to 50% off on selected items",
      bgGradient: "from-pink-600 to-rose-800",
      accent: "pink",
    },
  ];

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation
      loop
      className="hero-slider"
    >
      {slides.map((slide) => (
        <SwiperSlide key={slide.id}>
          <section
            className={`bg-gradient-to-r ${slide.bgGradient} text-white py-40 md:py-40 relative`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-opacity-90 mb-8 animate-fade-in">
                {slide.description}
              </p>
              <div className="max-w-md mx-auto">
                <ProductSearch />
              </div>
            </div>
          </section>
        </SwiperSlide>
      ))}

      <style>{`
        .hero-slider .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.8);
          opacity: 0.8;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background-color: rgba(255, 255, 255, 1);
          opacity: 1;
        }
        .hero-slider .swiper-button-next,
        .hero-slider .swiper-button-prev {
          color: white;
          background-color: rgba(0, 0, 0, 0.9);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-slider .swiper-button-next:after,
        .hero-slider .swiper-button-prev:after {
          font-size: 18px;
        }
        .hero-slider .swiper-button-next:hover,
        .hero-slider .swiper-button-prev:hover {
          background-color: rgba(0, 0, 0, 0.9);
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-in-out;
        }
        .swiper-navigation-icon{
         height: 16px !important;
          width: 16px !important;
        }
         .swiper-button-next .swiper-navigation-icon::after {
          content: '>';
        }
        .swiper-button-prev .swiper-navigation-icon::after {
          content: '<';
          }
      `}</style>
    </Swiper>
  );
}
