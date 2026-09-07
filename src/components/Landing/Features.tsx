import { memo } from "react";
import { BookOpen, Video, Users, CalendarCheck, Award, MessageCircle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    tint: "bg-primary/10 text-primary",
    title: "Interactive Courses",
    desc: "Chapter-wise curriculum, Hindi mein samjhaya — notes, practice aur quizzes ke saath.",
  },
  {
    icon: Video,
    tint: "bg-rose-500/10 text-rose-600",
    title: "Video Lessons",
    desc: "HD recorded lectures jo aap kabhi bhi, kahin bhi dobara dekh sakte hain.",
  },
  {
    icon: Users,
    tint: "bg-emerald-500/10 text-emerald-600",
    title: "Expert Teachers",
    desc: "Ramchandra Sir aur experienced faculty — har concept simple aur yaad rehne wala.",
  },
  {
    icon: CalendarCheck,
    tint: "bg-amber-500/10 text-amber-600",
    title: "Live Classes & Tests",
    desc: "Weekly live batches aur regular tests taaki taiyari track par rahe.",
  },
  {
    icon: Award,
    tint: "bg-violet-500/10 text-violet-600",
    title: "Progress Tracking",
    desc: "Apna attendance, test score aur course progress ek hi dashboard par dekhein.",
  },
  {
    icon: MessageCircle,
    tint: "bg-sky-500/10 text-sky-600",
    title: "Doubt Solving",
    desc: "Doubts section aur WhatsApp support — sawaal poochhein, jawab turant paayein.",
  },
];

const Features = memo(() => (
  <section aria-label="Platform features" className="py-16 md:py-20 bg-background">
    <div className="container mx-auto max-w-5xl px-5 md:px-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Everything You Need
        </h2>
        <p className="mt-3 text-base md:text-lg text-muted-foreground">
          Ek complete learning platform — padhai, practice aur guidance sab ek jagah.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, tint, title, desc }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <span className={`h-12 w-12 rounded-xl flex items-center justify-center ${tint}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
));

Features.displayName = "Features";
export default Features;
