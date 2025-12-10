import { CheckCircle, ArrowRight, Shield, PhoneCall, CalendarDays, Users, Sparkles, Layers, BarChart2, Play } from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    title: "Centralizovana zajednica",
    description: "Objavite obavijesti, pratite projekte i održavajte sve džematske aktivnosti na jednom mjestu.",
    icon: <Layers className="h-6 w-6 text-indigo-600" />,
  },
  {
    title: "Upravljanje članstvom",
    description: "Članarine, prijave i značke za angažmane su automatizovane i pregledne.",
    icon: <Users className="h-6 w-6 text-indigo-600" />,
  },
  {
    title: "Događaji i prijave",
    description: "Planirajte, naplaćujte i pratite prisustvo na jedinstvenom panelu sa QR check-inom.",
    icon: <CalendarDays className="h-6 w-6 text-indigo-600" />,
  },
  {
    title: "Finansijski uvidi",
    description: "Transparentno izvještavanje, donacije i KPI pokazatelji za Upravni odbor.",
    icon: <BarChart2 className="h-6 w-6 text-indigo-600" />,
  },
];

const stats = [
  { value: "35+", label: "Digitalizovanih džemata" },
  { value: "12k", label: "Aktivnih članova" },
  { value: "180%", label: "Brži odgovor na upite" },
  { value: "24/7", label: "Podrška i sigurnost" },
];

const benefits = [
  "Moderan izgled i mobilna aplikacija spremna za članove",
  "Notifikacije, livestream i online trgovina u jednom ekosistemu",
  "Planovi prilagođeni veličini džemata sa jasnim SLA uslovima",
  "Sigurnost podataka uz višeslojnu autentikaciju i audit-log",
];

const sections = [
  {
    title: "Aktivnosti na jednom mjestu",
    description: "Delegirajte zadatke, nadgledajte rokove i povežite timove sa jasnim prioritetima i oznakama.",
  },
  {
    title: "Članarine bez papira",
    description: "Online prijave, automatska naplata i statusi članova vidljivi u realnom vremenu.",
  },
  {
    title: "Program za mlade",
    description: "Gamifikacija kroz značke, mentorski programi i sadržaji prilagođeni generaciji koja sve radi preko telefona.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 text-slate-900">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,102,255,0.12),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-24 pt-12 md:flex-row md:items-center md:justify-between">
          <div className="space-y-6 md:max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm ring-1 ring-indigo-100">
              <Sparkles className="h-4 w-4" /> Novi izgled DžematApp platforme
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl md:text-5xl">
                Digitalna platforma za džematske timove i članove
              </h1>
              <p className="text-lg text-slate-600">
                Izgradili smo iskustvo po uzoru na moderne task-management SaaS stranice: elegantan hero, jasne prednosti
                i sve ključne funkcionalnosti koje vaš džemat koristi svakodnevno.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700">
                <Play className="h-4 w-4" /> Pogledaj demo
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-indigo-700 ring-1 ring-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-50">
                Cjenovnik i paketi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" /> ISO-ready sigurnosni procesi
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-emerald-500" /> Namjenska podrška za džemate
              </div>
            </div>
          </div>
          <div className="relative w-full md:max-w-xl">
            <div className="absolute -left-12 -top-8 h-24 w-24 rounded-full bg-indigo-100 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl shadow-indigo-100 ring-1 ring-indigo-50">
              <div className="flex items-center justify-between bg-slate-50 px-6 py-4 text-sm font-medium text-slate-500">
                <span>Livestream · Događaji · Članarine</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Aktivno</span>
              </div>
              <div className="space-y-4 px-6 py-6">
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-4 text-white shadow-lg">
                  <div>
                    <p className="text-sm text-indigo-100">Današnji plan</p>
                    <p className="text-2xl font-semibold">Ramazanski iftar za mlade</p>
                  </div>
                  <div className="rounded-full bg-white/15 px-4 py-2 text-sm">18:30 · Sala 1</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {sections.map((section) => (
                    <div key={section.title} className="rounded-2xl bg-slate-50 p-4 shadow-sm ring-1 ring-slate-100">
                      <p className="text-xs uppercase tracking-wide text-indigo-600">{section.title}</p>
                      <p className="mt-2 text-slate-700">{section.description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div>
                    <p className="text-sm text-slate-500">Broj aktivnih članova</p>
                    <p className="text-2xl font-semibold text-slate-900">12,483</p>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">+18% ovaj mjesec</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-20 px-6 pb-24">
        <section className="grid gap-6 rounded-3xl bg-white/80 p-6 shadow-xl shadow-indigo-50 ring-1 ring-indigo-100 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1 text-center">
              <p className="text-3xl font-semibold text-indigo-700">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl bg-white p-6 shadow-lg shadow-indigo-50 ring-1 ring-indigo-100">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-500 p-10 text-white shadow-2xl shadow-indigo-200">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-wide text-indigo-100">Zašto DžematApp</p>
              <h2 className="text-3xl font-semibold leading-tight">Kombinujemo tehnologiju, zajednicu i sigurnost</h2>
              <p className="max-w-2xl text-lg text-indigo-50">
                Dizajn smo inspirisali Task Management SaaS rješenjima: čiste sekcije, jasna tipografija i ilustrativni widgeti
                koji govore o mogućnostima platforme.
              </p>
            </div>
            <Link href="/guest" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-indigo-700 shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5">
              Pogledaj kao gost <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4">
                <CheckCircle className="mt-1 h-5 w-5 text-emerald-200" />
                <p className="text-indigo-50">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl shadow-indigo-50 ring-1 ring-indigo-100">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wide text-indigo-600">Onboarding u 7 dana</p>
              <h3 className="text-2xl font-semibold text-slate-900">Prelazak bez stresa</h3>
              <p className="max-w-2xl text-slate-600">
                Pomažemo vam da migrirate podatke, podesite module (od Livestream-a do Shop-a) i obučite tim kroz interaktivne radionice.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/pricing" className="rounded-full bg-indigo-600 px-5 py-3 text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5">
                Odaberi paket
              </Link>
              <a
                href="mailto:info@dzematapp.ba"
                className="rounded-full bg-white px-5 py-3 text-indigo-700 ring-1 ring-indigo-100 transition hover:-translate-y-0.5"
              >
                Kontaktiraj nas
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
