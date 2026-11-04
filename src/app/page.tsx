// src/app/page.tsx
// Landing page with hero, features, and CTA

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Header, Footer } from "@/components/layout";
import {
  MessageSquare,
  AlertTriangle,
  Zap,
  Shield,
  BarChart2,
  Users,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Tone Analysis",
    description:
      "Instantly detect if your message sounds rude, dismissive, aggressive, or passive-aggressive before you hit send.",
  },
  {
    icon: AlertTriangle,
    title: "Severity Scoring",
    description:
      "Get a 1-5 severity rating so you know exactly how problematic your message might be perceived.",
  },
  {
    icon: Zap,
    title: "Smart Suggestions",
    description:
      "Receive specific rephrasing suggestions that preserve your intent while improving how you come across.",
  },
  {
    icon: BarChart2,
    title: "Conversation Context",
    description:
      "Pro users get conversation flow analysis — detect escalating tension and communication patterns over time.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your messages are analyzed locally or via secure API. We never store your raw conversations without consent.",
  },
  {
    icon: Users,
    title: "Built for Everyone",
    description:
      "Designed for socially awkward communicators, neurodivergent folks, and anyone who wants to communicate more thoughtfully.",
  },
];

const stats = [
  { value: "4", label: "Analysis Types" },
  { value: "10+", label: "Tone Categories" },
  { value: "5", label: "Severity Levels" },
  { value: "∞", label: "Free Analyses" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Now in Beta — Free during early access
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                Say What You Mean,{" "}
                <span className="text-primary">Not What They Fear</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                ShouldISay analyzes your message tone in real-time — detecting rudeness,
                passive-aggression, and 10+ other categories — so you can communicate
                confidently and avoid unintentional hurt.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Analysis
                  </Button>
                </Link>
                <Link href="/dashboard/analyze">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Try Demo
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required · 500 chars free · Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-12 border-y border-border bg-muted/30">
          <div className="container mx-auto px-4">
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</dt>
                  <dd className="text-sm text-muted-foreground mt-1">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Everything You Need to Communicate Better
              </h2>
              <p className="text-lg text-muted-foreground">
                From instant tone checks to deep conversation insights — all in one tool.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="group p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Simple workflow, powerful insights.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  1
                </div>
                <div className="pt-16 text-center">
                  <h3 className="text-xl font-semibold mb-2">Paste Your Message</h3>
                  <p className="text-muted-foreground">
                    Copy any text — a text, email, Slack message, or tweet draft.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  2
                </div>
                <div className="pt-16 text-center">
                  <h3 className="text-xl font-semibold mb-2">Get Instant Analysis</h3>
                  <p className="text-muted-foreground">
                    See verdict, severity, categories, and suggestions in seconds.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                  3
                </div>
                <div className="pt-16 text-center">
                  <h3 className="text-xl font-semibold mb-2">Refine & Send</h3>
                  <p className="text-muted-foreground">
                    Use suggested rephrasing or edit manually, then send with confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Communicate with Confidence?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands who are already improving their communication, one message at a time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free — No Credit Card
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}