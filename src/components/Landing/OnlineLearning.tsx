import { memo } from "react";
import { Monitor, Clock, BookOpen } from "lucide-react";
import learningImage from "../../assets/landing/hybrid-learning.jpg";

const highlights = [
  { icon: Monitor, text: "Live & Recorded Classes" },
  { icon: Clock, text: "Learn at Your Own Pace" },
  { icon: BookOpen, text: "Digital Study Materials" },
];

const OnlineLearning = memo(() => (
  <section className="py-16 md:py-20 bg-muted/30">
    <div className="container mx-auto max-w-5xl px-5 md:px-8">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            Hybrid Learning Experience
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            Ghar baithe class join karein — lectures dekhein, notes download karein aur apni progress
            track karein, sab ek hi app mein.
          </p>

          <div className="mt-7 space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-semibold text-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
          <img
            src={learningImage}
            alt="Student online class attend karte hue"
            loading="lazy"
            width={1280}
            height={800}
            className="w-full h-full object-cover aspect-[4/3]"
          />
        </div>
      </div>
    </div>
  </section>
));

OnlineLearning.displayName = "OnlineLearning";
export default OnlineLearning;
