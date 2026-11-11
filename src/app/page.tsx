// src/app/page.tsx
// Landing page - ChatGPT/Claude style

import Link from "next/link";
import { LandingHeader, Footer } from "@/components/layout";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  AlertTriangle,
  Zap,
  Shield,
  BarChart2,
  Users,
  ArrowRight,
  Check,
  Sparkles,
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
      "Get a 1–5 severity rating so you know exactly how problematic your message might be perceived.",
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
      "Your messages are analyzed securely. We never store your raw conversations without consent.",
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

const steps = [
  {
    number: "01",
    title: "Paste Your Message",
    description: "Copy any text — a text, email, Slack message, or tweet draft.",
    icon: MessageSquare,
  },
  {
    number: "02",
    title: "Get Instant Analysis",
    description: "See verdict, severity, categories, and suggestions in seconds.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Refine & Send",
    description: "Use suggested rephrasing or edit manually, then send with confidence.",
    icon: Check,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              {/* Trust badge */}
              <div className="animate-fade-in-up delay-1 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-muted text-brand-foreground text-sm font-medium border border-brand-border">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand/50 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                  </span>
                  Now in Beta — Free during early access
                </span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in-up delay-2 text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Say What You Mean,{" "}
                <span className="gradient-text">Not What They Fear</span>
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-in-up delay-3 text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                ShouldISay analyzes your message tone in real-time — detecting rudeness,
                passive-aggression, and 10+ other categories — so you can communicate
                confidently and avoid unintentional hurt.
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up delay-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-brand text-brand-foreground hover:bg-brand/90">
                    Start Free Analysis
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/dashboard/analyze">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 border-brand-border hover:bg-brand-muted">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Try Demo
                  </Button>
                </Link>
              </div>

              {/* Trust line */}
              <p className="animate-fade-in-up delay-5 text-sm text-muted-foreground">
                No credit card required · 500 chars free · Cancel anytime
              </p>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-16 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <dt className="text-4xl md:text-5xl font-bold text-foreground">{stat.value}</dt>
                  <dd className="text-sm text-muted-foreground mt-2">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to Communicate Better
              </h2>
              <p className="text-lg text-muted-foreground">
                From instant tone checks to deep conversation insights — all in one tool.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className="group animate-fade-in-up relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:border-brand-border/50 hover:shadow-xl"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-brand-muted text-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Simple workflow, powerful insights.
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Connecting line */}
              <div className="hidden lg:block absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%-4rem)] bg-gradient-to-b from-brand/30 to-transparent" aria-hidden="true" />

              <div className="grid lg:grid-cols-3 gap-8">
                {steps.map((step, index) => (
                  <div
                    key={step.number}
                    className="relative animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    {/* Number circle */}
                    <div className="relative flex items-center justify-center mb-6">
                      <div className="relative z-10 w-20 h-20 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-bold text-2xl border-4 border-background">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center lg:text-left">
                      <div className="w-12 h-12 rounded-xl bg-brand-muted text-brand flex items-center justify-center mb-4 lg:mb-4 mx-auto lg:mx-0">
                        <step.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center animate-fade-in-up gradient-border rounded-2xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Communicate with Confidence?
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Join thousands who are already improving their communication, one message at a time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-brand text-brand-foreground hover:bg-brand/90">
                    Start Free — No Credit Card
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 border-brand-border hover:bg-brand-muted">
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