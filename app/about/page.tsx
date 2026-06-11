"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/Logo";

import { PageContainer } from "@/components/PageContainer";

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-primary font-semibold text-base mb-4 tracking-wide uppercase">
        {number}. {title}
      </h2>

      <div className="space-y-4 text-on-surface-variant text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function ValueCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-secondary font-medium">{title}</h3>

      <p className="text-[13px] leading-relaxed text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <PageContainer>
      {/* Back */}
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="mb-2 flex items-center gap-2 text-on-surface-variant transition-colors cursor-pointer hover:text-on-surface-variant/80"
      >
        <ArrowLeft size={12} />
        back
      </button>

      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-headline-xl italic">About</h1>
        </div>

        <p className="text-body-base text-on-surface-variant max-w-md">
          Last updated: June 2026
        </p>
      </div>

      <div className="flex flex-col items-center mt-12 mb-12 text-center">
        <div className="w-24 h-24 mb-6 text-primary drop-shadow-2xl">
          <Logo />
        </div>

        <h2 className="text-6xl font-serif italic text-primary mb-1">MINT</h2>

        <p className="text-on-surface-variant text-body-base uppercase tracking-[0.4em] text-[10px] font-bold">
          Minimal Habit and Task Tracker
        </p>
      </div>

      {/* Content */}
      <div className="max-w-none space-y-12 text-on-surface-variant text-sm leading-relaxed pb-24">
        <Section number="01" title="The Big Idea">
          <p className="text-lg font-light text-primary/90 leading-relaxed italic">
            &ldquo;Building tools that prioritize speed, privacy, and functional
            design over digital clutter.&rdquo;
          </p>

          <p>
            Most productivity systems are designed to hold everything, yet they
            often end up holding you back. MINT is Digi Click Studio&apos;s
            open-source, self-hostable mission to strip away the noise.
          </p>

          <p>
            We believe true impact isn&apos;t about doing more, but about having
            the clarity to do what actually matters, without relying on
            third-party SaaS platforms.
          </p>
        </Section>

        <Section number="02" title="Core Values">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            <ValueCard
              title="Minimalism"
              description="Every pixel must earn its place. No clutter, no distractions — just a clean interface that lets your thoughts breathe."
            />

            <ValueCard
              title="Performance"
              description="We prioritize responsiveness and efficiency over superficial aesthetics. If it doesn’t feel instant, it isn’t finished."
            />

            <ValueCard
              title="Privacy-First"
              description="Your data belongs to you. Privacy isn’t a feature — it’s a foundation."
            />
          </div>
        </Section>

        <Section number="03" title="The Origin">
          <p>
            MINT didn&apos;t start as a product; it started as a frustration.
            Existing productivity tools felt bloated, noisy, and detached from
            actual work.
          </p>

          <p>
            MINT is an open-source project created and maintained by{" "}
            <strong className="text-secondary">Manovikram K</strong> under{" "}
            <strong className="text-primary/90 font-medium">
              Digi Click Studio
            </strong>
            . Our goal is to give developers and teams absolute control over
            their tasks and protocols.
          </p>

          <p>
            We focus on bridging clean, self-hostable engineering with
            intentional design.
          </p>
        </Section>

        <Section number="04" title="The Technical Edge">
          <p>
            At <strong className="text-secondary">Digi Click Studio</strong>,
            our stack is selected for fluidity, scalability, and reliability.
          </p>

          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li>
              <strong className="text-secondary">Frontend:</strong>{" "}
              <strong className="text-primary/80 font-medium">
                Next.js 16
              </strong>{" "}
              +{" "}
              <strong className="text-primary/80 font-medium">React 19</strong>{" "}
              +{" "}
              <strong className="text-primary/80 font-medium">
                Framer Motion
              </strong>
            </li>

            <li>
              <strong className="text-secondary">Authentication:</strong>{" "}
              <strong className="text-primary/80 font-medium">
                NextAuth.js
              </strong>{" "}
              (Secure Credentials Authentication)
            </li>

            <li>
              <strong className="text-secondary">Data Layer:</strong>{" "}
              <strong className="text-primary/80 font-medium">
                Postgres (PostgreSQL)
              </strong>{" "}
              +{" "}
              <strong className="text-primary/80 font-medium">
                Drizzle ORM
              </strong>
            </li>

            <li>
              <strong className="text-secondary">Design Philosophy:</strong>{" "}
              Creating interfaces that feel calm, responsive, and intentional.
            </li>
          </ul>
        </Section>

        <Section number="05" title="Transparency">
          <p>
            MINT is free and open-source software distributed under the MIT
            License. We believe in building in public, making it easy for the
            community to review the code, host their own instances, and
            contribute improvements.
          </p>

          <div className="space-y-2">
            <h3 className="text-secondary font-medium italic">
              Digital Silence & Focus
            </h3>

            <p>
              Our roadmap is driven by clarity, not feature overload. Every
              update aims to reduce friction and help users focus on what
              matters.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-secondary font-medium italic">The Agency</h3>

            <p>
              MINT is a product of{" "}
              <strong className="text-primary font-bold">
                Digi Click Studio
              </strong>
              .
            </p>

            <p>
              Based in{" "}
              <strong className="text-secondary">Tamil Nadu, India</strong>, we
              build software that balances engineering precision with
              intentional design.
            </p>
          </div>
        </Section>

        <Section number="06" title="Philosophy of Time">
          <p>
            We don&apos;t see time as something to squeeze — but something to
            use intentionally.
          </p>

          <p>
            MINT is built around the{" "}
            <strong className="text-secondary font-medium italic">
              Clean Slate
            </strong>{" "}
            philosophy.
          </p>

          <p>
            Every day is a reset. The goal is simple: focus on what matters now.
          </p>
        </Section>

        <p className="text-[12px] opacity-70">
          Fun fact: Outside software, we explore minimalist architecture,
          sensory design, and calm digital experiences.
        </p>
      </div>
    </PageContainer>
  );
}
