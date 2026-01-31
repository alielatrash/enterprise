'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/layout/logo'
import {
  BarChart3,
  Truck,
  ClipboardList,
  Calendar,
  ArrowRight,
  Zap,
  Shield,
  Target,
  LineChart,
  CheckCircle2,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a3a34] text-white">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2d5d52]/30 via-transparent to-[#1a3a34]" />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl">
          <div className="container mx-auto flex h-20 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <span className="text-xl font-bold">Trella Planning</span>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-32">
          <div className="mx-auto max-w-5xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium">Intelligent Supply Chain Planning</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-8 animate-fade-in-up text-6xl font-black leading-tight tracking-tight sm:text-7xl md:text-8xl">
              <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Optimize Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-lime-400 to-green-400 bg-clip-text text-transparent">
                Supply Chain
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-12 animate-fade-in-up text-xl text-gray-400 delay-100 sm:text-2xl">
              AI-powered demand forecasting and supply optimization that transforms your logistics operations.
              <br />
              Plan smarter. Execute faster. Deliver better.
            </p>

            {/* CTA Buttons */}
            <div className="flex animate-fade-in-up flex-col items-center justify-center gap-4 delay-200 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group h-14 bg-gradient-to-r from-emerald-600 to-lime-500 px-8 text-lg font-semibold shadow-2xl shadow-emerald-500/50 transition-all hover:scale-105 hover:from-emerald-500 hover:to-lime-400 hover:shadow-emerald-500/70"
              >
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-emerald-500/20 bg-emerald-500/5 px-8 text-lg font-semibold backdrop-blur-sm transition-all hover:bg-emerald-500/10"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="mt-20 grid animate-fade-in-up grid-cols-3 gap-8 delay-300">
              <div>
                <div className="mb-2 text-4xl font-bold text-emerald-400">98%</div>
                <div className="text-sm text-gray-400">Forecast Accuracy</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-lime-400">24/7</div>
                <div className="text-sm text-gray-400">Real-time Sync</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-green-400">10x</div>
                <div className="text-sm text-gray-400">Faster Planning</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 py-32">
          <div className="mb-20 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm backdrop-blur-sm">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span>Powerful Features</span>
            </div>
            <h2 className="mb-6 text-5xl font-bold">
              Everything You Need,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                Nothing You Don&apos;t
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            {[
              {
                icon: ClipboardList,
                title: 'Demand Forecasting',
                description: 'AI-powered demand prediction with real-time accuracy tracking across all routes and time periods.',
                color: 'from-emerald-500 to-cyan-500',
              },
              {
                icon: Truck,
                title: 'Supply Optimization',
                description: 'Intelligent capacity allocation and supplier commitment tracking with gap analysis.',
                color: 'from-lime-500 to-emerald-500',
              },
              {
                icon: Calendar,
                title: 'Smart Dispatch',
                description: 'Automated dispatch sheets with real-time updates and intelligent load allocation.',
                color: 'from-green-500 to-teal-500',
              },
              {
                icon: BarChart3,
                title: 'Analytics & Insights',
                description: 'Deep insights with predictive analytics, performance benchmarking, and trend analysis.',
                color: 'from-emerald-400 to-lime-400',
              },
              {
                icon: Target,
                title: 'Route Intelligence',
                description: 'Dynamic route planning with capacity optimization and real-time adjustments.',
                color: 'from-lime-400 to-yellow-400',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-level encryption with complete audit trails and granular access control.',
                color: 'from-green-600 to-emerald-600',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 backdrop-blur-sm transition-all hover:scale-105 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-10" style={{ backgroundImage: `linear-gradient(135deg, ${feature.color})` }} />
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof / Benefits */}
        <section className="container mx-auto px-4 py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>Built for Scale</span>
              </div>
              <h2 className="mb-6 text-5xl font-bold">
                Enterprise Power,
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                  Startup Speed
                </span>
              </h2>
              <p className="mb-10 text-xl text-gray-400">
                Built by supply chain experts who understand the complexity of logistics operations at scale.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: 'Lightning Fast',
                    description: 'Sub-second response times with real-time collaboration across teams.',
                  },
                  {
                    icon: Shield,
                    title: 'Bank-Grade Security',
                    description: 'SOC 2 compliant with end-to-end encryption and audit trails.',
                  },
                  {
                    icon: LineChart,
                    title: 'Predictive Analytics',
                    description: 'Machine learning models that improve with every forecast.',
                  },
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                      <benefit.icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="mb-2 text-lg font-semibold">{benefit.title}</h4>
                      <p className="text-gray-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Element */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-r from-emerald-500/30 to-lime-400/30 blur-3xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  {[
                    { label: 'Routes', value: '500+', color: 'from-emerald-500 to-cyan-500' },
                    { label: 'Loads/Day', value: '10K+', color: 'from-lime-500 to-emerald-500' },
                    { label: 'Accuracy', value: '99.2%', color: 'from-green-500 to-emerald-500' },
                    { label: 'Uptime', value: '99.9%', color: 'from-emerald-400 to-lime-400' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-8 text-center backdrop-blur-xl ring-1 ring-white/5"
                    >
                      <div className={`mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-4xl font-bold text-transparent`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-32">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 via-lime-500/20 to-green-500/20 p-16 text-center backdrop-blur-xl">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b98108_1px,transparent_1px),linear-gradient(to_bottom,#10b98108_1px,transparent_1px)] bg-[size:2rem_2rem]" />
            <div className="relative">
              <h2 className="mb-6 text-5xl font-bold">
                Ready to Transform
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-lime-400 to-green-400 bg-clip-text text-transparent">
                  Your Supply Chain?
                </span>
              </h2>
              <p className="mb-10 text-xl text-gray-300">
                Join leading logistics companies optimizing with Trella Planning
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group h-14 bg-white px-8 text-lg font-semibold text-black shadow-2xl transition-all hover:scale-105"
                >
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-14 border-emerald-500/20 bg-emerald-500/5 px-8 text-lg font-semibold backdrop-blur-sm transition-all hover:bg-emerald-500/10"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-emerald-500/10 bg-black/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-16">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <Logo size="sm" />
                  <span className="font-bold">Trella Planning</span>
                </div>
                <p className="text-sm text-gray-400">
                  Next-generation supply chain planning platform.
                </p>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-emerald-400">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Demand Forecasting</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Supply Planning</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Dispatch Operations</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Analytics</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-emerald-400">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">About</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Careers</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Contact</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Support</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-emerald-400">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Privacy</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Terms</li>
                  <li className="cursor-pointer transition-colors hover:text-emerald-400">Security</li>
                </ul>
              </div>
            </div>
            <div className="mt-12 border-t border-emerald-500/10 pt-8 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Trella Planning. All rights reserved.
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.625, 0.05, 0, 1) forwards;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}
