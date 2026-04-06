import type { Product } from "@/types/domain";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  loading,
}: {
  products: Product[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="product-image skeleton" />
            <div className="p-4 space-y-3">
              <div className="h-3 skeleton rounded w-1/4" />
              <div className="h-4 skeleton rounded w-3/4" />
              <div className="h-5 skeleton rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
