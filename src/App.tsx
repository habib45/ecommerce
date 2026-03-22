import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import { router } from "./router";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useInitCart } from "@/hooks/useInitCart";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function AppInitializer() {
  const initialize = useAuthStore((s) => s.initialize);
  useInitCart(); // Initialize cart on app load and sync with auth

  useEffect(() => {
    initialize();
  }, [initialize]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AppInitializer />
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </HelmetProvider>
    </QueryClientProvider>
  );
}
