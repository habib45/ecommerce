import { Link } from "react-router-dom";
import { useLocale } from "@/hooks/useLocale";
import { t as tr } from "@/lib/translate";
import type { Category, TranslationMap } from "@/types/domain";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const { locale } = useLocale();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {categories.map((category) => {
        const slug =
          (category.slug as TranslationMap)[locale as keyof TranslationMap] ??
          (category.slug as TranslationMap).en ??
          "";
        const name = tr(category.name as TranslationMap, locale as 'en' | 'bn-BD' | 'sv');

        return (
          <Link
            key={category.id}
            to={`/${locale}/categories/${slug}`}
            className="group card p-6 hover-lift text-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>
        );
      })}
    </div>
  );
}