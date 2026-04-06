import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { useHeroSlides } from '@/hooks/useHeroSlides';

export function HeroSlider() {
  const { data: slides = [], isLoading } = useHeroSlides();

  if (isLoading) {
    return (
      <div
        className="w-full skeleton"
        style={{ height: 'clamp(280px, 50vw, 560px)' }}
      />
    );
  }

  if (slides.length === 0) return null;

  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      navigation
      loop={slides.length > 1}
      className="hero-slider"
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={slide.id}>
          <section
            className="relative text-white overflow-hidden"
            style={{ height: `clamp(280px, 50vw, ${slide.height_px}px)` }}
          >
            {/* Background image — eager + high priority on first slide for LCP */}
            <img
              src={slide.image_url}
              alt={slide.title ?? ''}
              className="absolute inset-0 w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'low'}
            />
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg_overlay}`} />

            {/* Content */}
            {slide.show_text && (
              <div className="relative z-10 h-full flex items-center">
                <div className="section w-full">
                  <div className="max-w-2xl">
                    {slide.title && (
                      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 hero-fade-in drop-shadow-lg leading-tight">
                        {slide.title}
                      </h1>
                    )}
                    {slide.description && (
                      <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 hero-fade-in drop-shadow text-white/90 leading-relaxed max-w-lg">
                        {slide.description}
                      </p>
                    )}
                    {slide.show_button && slide.cta_label && slide.cta_href && (
                      <a
                        href={slide.cta_href}
                        className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200 active:scale-[0.97] hero-fade-in shadow-soft"
                      >
                        {slide.cta_label}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </SwiperSlide>
      ))}

      <style>{`
        .hero-slider .swiper-pagination-bullet {
          background-color: rgba(255,255,255,0.5);
          opacity: 1;
          width: 8px;
          height: 8px;
          transition: all 0.3s;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background-color: white;
          width: 24px;
          border-radius: 4px;
        }
        .hero-slider .swiper-button-next,
        .hero-slider .swiper-button-prev {
          display: none;
        }
        @media (min-width: 640px) {
          .hero-slider .swiper-button-next,
          .hero-slider .swiper-button-prev {
            display: flex;
            color: white;
            background-color: rgba(255,255,255,0.15);
            backdrop-filter: blur(8px);
            width: 48px;
            height: 48px;
            border-radius: 16px;
            transition: all 0.2s;
          }
          .hero-slider .swiper-button-next:hover,
          .hero-slider .swiper-button-prev:hover {
            background-color: rgba(255,255,255,0.25);
          }
          .hero-slider .swiper-button-next:after,
          .hero-slider .swiper-button-prev:after { font-size: 16px; font-weight: bold; }
        }
        @keyframes hero-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-in { animation: hero-fade-in 0.8s ease-out; }
      `}</style>
    </Swiper>
  );
}
