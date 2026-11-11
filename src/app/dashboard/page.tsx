import Link from "next/link";
import { ArrowRight, BarChart3, CreditCard, History, MessageSquare } from "lucide-react";
import { Footer, Header } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const dashboardLinks = [
  {
    title: "Analyze",
    description:
      "Check the tone and severity of a message, and get suggestions before you send it.",
    href: "/dashboard/analyze",
    icon: MessageSquare,
  },
  {
    title: "History",
    description:
      "Review previous analyses, search your messages, and revisit suggestions.",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Analytics",
    description:
      "Explore your analysis trends, verdict breakdowns, and communication insights.",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Billing",
    description:
      "View your current plan, usage, and subscription options.",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-brand">
              Your workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome to ShouldISay
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Choose a place to start. Analyze a message, revisit past results,
              or see how your communication patterns change over time.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {dashboardLinks.map(({ title, description, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Card className="h-full transition-colors group-hover:border-brand-border group-hover:bg-accent/40">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-muted text-brand">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="flex items-center justify-between text-xl">
                      {title}
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" aria-hidden="true" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
