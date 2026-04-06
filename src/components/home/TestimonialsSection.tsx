import { useTranslation } from "react-i18next";

export function TestimonialsSection() {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: "Sarah J.",
      rating: 5,
      text: t(
        "home.testimonial1",
        "Amazing quality and fast shipping. The multilingual support is a game-changer for my family.",
      ),
      avatar: "SJ",
    },
    {
      name: "Rahman K.",
      rating: 5,
      text: t(
        "home.testimonial2",
        "Finally an e-commerce platform that supports Bangla! The shopping experience feels truly local.",
      ),
      avatar: "RK",
    },
    {
      name: "Erik L.",
      rating: 4,
      text: t(
        "home.testimonial3",
        "Great product selection and the Swedish language support with local currency is very convenient.",
      ),
      avatar: "EL",
    },
  ];

  return (
    <section className="section section-padding">
      <div className="text-center mb-16">
        <h2 className="section-title text-balance">
          {t("home.testimonials", "What Our Customers Say")}
        </h2>
        <p className="section-subtitle">
          {t("home.testimonialsDesc", "Real reviews from real customers")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="card p-8 hover-lift">
            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < testimonial.rating ? "text-yellow-400 fill-current" : "text-muted"}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Text */}
            <blockquote className="text-muted-foreground mb-6 text-pretty">
              "{testimonial.text}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {testimonial.avatar}
                </span>
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {testimonial.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  Verified Customer
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
