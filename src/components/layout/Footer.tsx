// src/components/layout/Footer.tsx
// Footer component - minimal, clean

"use client";

import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";
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
    Explore: [
      { label: "About", href: "/about" },
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
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  };

  const socialLinks = [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/eogungbure/",
      icon: Linkedin,
    },
    { label: "GitHub", href: "https://github.com/ciemmo", icon: Github },
    { label: "Email", href: "mailto:eogungbure@gmail.com", icon: Mail },
  ];

  return (
    <footer className="border-t border-border/50 bg-muted/30" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 mb-12 md:grid-cols-5">
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

          {/* Contact and social links */}
          <nav aria-label="Contact and social links" className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href.startsWith("https://") ? "_blank" : undefined}
                rel={social.href.startsWith("https://") ? "noopener noreferrer" : undefined}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
