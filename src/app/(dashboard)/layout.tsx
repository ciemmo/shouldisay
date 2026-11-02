// src/app/(dashboard)/layout.tsx
// Dashboard layout - TODO: implement

import { Header } from "@/components/layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}