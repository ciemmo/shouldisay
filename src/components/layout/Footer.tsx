// src/components/layout/Footer.tsx
// Footer component - minimal, clean

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Analyze", href: "/dashboard/analyze" },
      { label: "History", href: "/dashboard/history" },
      { label: "Pricing", href: "/dashboard/billing" },
      { label: "API Docs", href: "#" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Legal: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
    Resources: [
      { label: "Help Center", href: "#" },
      { label: "Community", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  };

  const socialLinks = [
    { label: "Twitter", href: "#", icon: "twitter" },
    { label: "GitHub", href: "#", icon: "github" },
    { label: "Discord", href: "#", icon: "discord" },
    { label: "LinkedIn", href: "#", icon: "linkedin" },
  ];

  return (
    <footer className="border-t border-border/50 bg-muted/30" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-foreground mb-4" aria-label="ShouldISay Home">
              <BrandMark />
              <span>ShouldISay</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Communicate with confidence. AI-powered tone analysis for thoughtful messaging.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <nav key={category} aria-label={category}>
              <h3 className="font-semibold text-sm text-foreground mb-4">{category}</h3>
              <ul className="space-y-3" role="list">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} ShouldISay. All rights reserved.
          </p>

          {/* Social links */}
          <nav aria-label="Social media" className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                  "hover:bg-accent hover:text-foreground transition-colors"
                )}
                aria-label={social.label}
              >
                {getSocialIcon(social.icon)}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function getSocialIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    twitter: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.72h-3.308l-7.227-8.26L8.548 24H5.24l7.97-9.1L2.25 3h3.31l7.23 8.27L8.25 2.25h3.32l-7.97 9.1 8.5 9.72z" />
      </svg>
    ),
    github: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    discord: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.681 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-.215.076.076 0 0 0 .032-.12 10.97 10.97 0 0 0 .399-1.098.072.072 0 0 0-.027-.104 12.16 12.16 0 0 1-.822-1.449.07.07 0 0 1-.002-.115 13.143 13.143 0 0 1 .584-1.149.076.076 0 0 1 .108-.047c.457.011.923.038 1.386.038.463 0 .929-.027 1.386-.038a.077.077 0 0 1 .108.048c.17.3.36.598.574.905a.077.077 0 0 1-.003.114 11.79 11.79 0 0 1-.812 1.436.071.071 0 0 0-.027.104 13.65 13.65 0 0 0 .428 1.076.077.077 0 0 0 .057.094 13.317 13.317 0 0 0 1.24.215.079.079 0 0 0 .084.028 19.839 19.839 0 0 0 6.003-3.03.078.078 0 0 0 .032-.054c.5-5.177-.888-9.674-3.548-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    linkedin: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003zm-.791 21.416H2.563V1.729h18.873v19.687z" />
      </svg>
    ),
  };
  return icons[name] || null;
}