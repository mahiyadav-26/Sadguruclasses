import { memo } from "react";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { tapHaptic, selectionHaptic } from "@/lib/native/haptics";

export interface HeroData {
  title: string;
  subtitle: string;
  cta_text: string;
}

export interface HeroStat {
  stat_key: string;
  stat_value: string;
}

interface HeroProps {
  data: HeroData | null;
  stats?: HeroStat[];
}

const batchTiles = [
  {
    badge: "10",
    title: "Class 10th Board",
    body: "Neev mazboot, result solid. All subjects covered with weekly mock tests.",
    to: "/courses",
  },
  {
    badge: "12",
    title: "Class 12th Board",
    body: "Target 95%+. Special focus on PCM/PCB with Ramchandra Sir ke curated notes.",
    to: "/courses",
  },
];

const Hero = memo(({ data, stats = [] }: HeroProps) => {
  const studentCount = stats.find((s) => s.stat_key === "students")?.stat_value || "10k+";

  return (
    <section className="relative bg-background overflow-hidden">
      {/* Oversized brand watermark */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute -top-6 left-0 right-0 text-center font-display uppercase leading-none text-foreground/[0.035] text-[22vw] tracking-tighter"
      >
        Sadguru
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-10 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Hero tile */}
          <div className="md:col-span-8 bg-primary rounded-3xl p-7 md:p-12 relative overflow-hidden flex flex-col justify-end min-h-[420px] md:min-h-[500px] shadow-xl animate-fade-in">
            <div aria-hidden className="absolute top-0 right-0 p-6 md:p-8 opacity-10">
              <span className="font-display uppercase text-6xl md:text-8xl leading-none text-primary-foreground">
                Sadguru
              </span>
            </div>
            <div className="relative z-10">
              <span className="inline-block bg-gold text-gold-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                Ramchandra Sir ke saath
              </span>
              <h1 className="font-display uppercase text-primary-foreground text-4xl md:text-6xl lg:text-7xl leading-[0.92] mb-5">
                {data?.title || (
                  <>
                    Sabse behtar <span className="text-gold">results</span> ki guarantee.
                  </>
                )}
              </h1>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-md mb-7 leading-relaxed">
                {data?.subtitle ||
                  "Board English, spoken English aur CG Lecturer paper prep — sab Hindi mein samjhaya. Free video lessons, daily practice aur live doubt-clearing."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/signup" onClick={() => { void tapHaptic("light"); }}>
                  <Button
                    size="lg"
                    className="h-12 w-full sm:w-auto px-8 rounded-xl text-base font-bold gap-2 bg-gold text-gold-foreground hover:bg-gold/90 active:scale-[0.97] transition-transform duration-150 ease-out"
                  >
                    {data?.cta_text || "Free lesson dekhein"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/courses" onClick={() => { void selectionHaptic(); }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full sm:w-auto px-8 rounded-xl text-base font-semibold bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground active:scale-[0.97] transition-transform duration-150 ease-out"
                  >
                    Courses dekhein
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right column: stat + teacher */}
          <div className="md:col-span-4 grid grid-cols-1 gap-4 md:gap-6">
            <div className="bg-gold text-gold-foreground rounded-3xl p-7 flex flex-col justify-center items-center text-center shadow-lg animate-fade-in">
              <span className="font-display text-4xl md:text-5xl tabular-nums">{studentCount}</span>
              <span className="mt-1 font-semibold uppercase tracking-[0.14em] text-xs text-gold-foreground/70">
                Happy Students
              </span>
            </div>

            <div className="bg-ink text-ink-foreground rounded-3xl p-7 flex flex-col justify-center relative overflow-hidden shadow-lg animate-fade-in">
              <div aria-hidden className="absolute -right-3 -bottom-5 opacity-10">
                <span className="font-display text-7xl md:text-8xl leading-none">RCS</span>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-foreground/60">
                Meet the mentor
              </p>
              <h2 className="font-display uppercase text-2xl md:text-3xl text-gold mt-1 mb-3">Ramchandra Sir</h2>
              <p className="text-sm text-ink-foreground/70 leading-relaxed relative z-10">
                15 saal ka teaching experience. Unka signature style banayega aapko topper.
              </p>
            </div>
          </div>

          {/* Batch tiles */}
          {batchTiles.map((t) => (
            <Link
              key={t.title}
              to={t.to}
              onClick={() => { void selectionHaptic(); }}
              className="md:col-span-4 bg-card rounded-3xl p-7 shadow-md border border-border hover:border-gold transition-colors duration-200 group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary font-display text-lg flex items-center justify-center mb-5">
                {t.badge}
              </div>
              <h3 className="font-display uppercase text-xl md:text-2xl text-foreground mb-2">{t.title}</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{t.body}</p>
              <span className="text-primary font-bold text-sm inline-flex items-center gap-2 group-hover:gap-3 transition-all duration-200">
                Join Batch <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}

          <div className="md:col-span-4 bg-primary text-primary-foreground rounded-3xl p-7 shadow-md flex flex-col justify-between gap-6">
            <div>
              <h3 className="font-display uppercase text-xl md:text-2xl mb-2">Spoken &amp; Competitive</h3>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">
                Interview English, CG Lecturer paper aur daily practice — ek hi jagah.
              </p>
            </div>
            <Link to="/signup" onClick={() => { void tapHaptic("light"); }} className="block">
              <Button className="w-full h-11 rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 font-bold active:scale-[0.97] transition-transform duration-150 ease-out">
                Book Free Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";
export default Hero;
