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
        className="w-full bg-gray-200 animate-pulse"
        style={{ height: 'clamp(220px, 50vw, 480px)' }}
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
          {/* Responsive height: clamp between 220px (mobile) and the admin-set height (desktop) */}
          <section
            className="relative text-white overflow-hidden"
            style={{ height: `clamp(220px, 50vw, ${slide.height_px}px)` }}
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
              <div className="relative z-10 h-full flex items-center justify-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                  {slide.title && (
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4 hero-fade-in drop-shadow-lg">
                      {slide.title}
                    </h1>
                  )}
                  {slide.description && (
                    <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 hero-fade-in drop-shadow text-white/90">
                      {slide.description}
                    </p>
                  )}
                  {slide.show_button && slide.cta_label && slide.cta_href && (
                    <a
                      href={slide.cta_href}
                      className="inline-block bg-white text-gray-900 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-gray-100 transition hero-fade-in"
                    >
                      {slide.cta_label}
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>
        </SwiperSlide>
      ))}

      <style>{`
        .hero-slider .swiper-pagination-bullet {
          background-color: rgba(255,255,255,0.8);
          opacity: 0.8;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background-color: rgba(255,255,255,1);
          opacity: 1;
        }
        /* Hide nav arrows on mobile — swipe is the natural interaction */
        .hero-slider .swiper-button-next,
        .hero-slider .swiper-button-prev {
          display: none;
        }
        @media (min-width: 640px) {
          .hero-slider .swiper-button-next,
          .hero-slider .swiper-button-prev {
            display: flex;
            color: white;
            background-color: rgba(0,0,0,0.5);
            width: 44px;
            height: 44px;
            border-radius: 50%;
          }
          .hero-slider .swiper-button-next:after,
          .hero-slider .swiper-button-prev:after { font-size: 14px; }
        }
        @keyframes hero-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-in { animation: hero-fade-in 0.8s ease-in-out; }
      `}</style>
    </Swiper>
  );
}
