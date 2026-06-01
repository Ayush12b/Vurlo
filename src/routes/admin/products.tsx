import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminProductsComponent = React.lazy(() => import("@/components/products-component"));

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsLazy,
});

function AdminProductsLazy() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-white/40">Loading Product Catalog...</p>
        </div>
      }
    >
      <AdminProductsComponent />
    </Suspense>
  );
}
