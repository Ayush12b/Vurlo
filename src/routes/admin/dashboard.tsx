import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminDashboardComponent = React.lazy(() => import("@/components/dashboard-component"));

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardLazy,
});

function AdminDashboardLazy() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-white/40">Loading Dashboard...</p>
        </div>
      }
    >
      <AdminDashboardComponent />
    </Suspense>
  );
}
