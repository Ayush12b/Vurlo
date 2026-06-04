import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const ContactsComponent = React.lazy(() => import("@/components/contacts-component"));

export const Route = createFileRoute("/admin/contacts")({
  component: ContactsLazy,
});

function ContactsLazy() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-white/40">Loading Contacts...</p>
        </div>
      }
    >
      <ContactsComponent />
    </Suspense>
  );
}
