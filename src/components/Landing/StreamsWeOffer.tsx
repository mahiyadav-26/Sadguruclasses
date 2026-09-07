import { memo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mic, PenLine, GraduationCap, Trophy } from "lucide-react";

const streams = [
  { icon: BookOpen, label: "Board English", tint: "bg-primary/10 text-primary" },
  { icon: Mic, label: "Spoken English", tint: "bg-emerald-500/10 text-emerald-600" },
  { icon: PenLine, label: "Grammar & Writing", tint: "bg-amber-500/10 text-amber-600" },
  { icon: GraduationCap, label: "Class 9–12", tint: "bg-violet-500/10 text-violet-600" },
  { icon: Trophy, label: "CG Lecturer", tint: "bg-pink-500/10 text-pink-600" },
];

const StreamsWeOffer = memo(() => (
  <section aria-label="Streams we offer" className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto max-w-5xl px-5 md:px-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Streams We Offer
        </h2>
        <p className="mt-3 text-base md:text-lg text-muted-foreground">
          Board exams se lekar competitive papers tak — har stream ki poori taiyari.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {streams.map(({ icon: Icon, label, tint }) => (
          <Link
            key={label}
            to="/courses"
            className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className={`h-14 w-14 rounded-full flex items-center justify-center ${tint}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <span className="text-sm font-bold text-foreground text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  </section>
));

StreamsWeOffer.displayName = "StreamsWeOffer";
export default StreamsWeOffer;
