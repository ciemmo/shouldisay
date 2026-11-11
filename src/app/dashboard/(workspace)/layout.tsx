// Dashboard workspace layout with sidebar
// Dashboard layout with sidebar

import { Header, Sidebar } from "@/components/layout";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 lg:pl-64 container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}