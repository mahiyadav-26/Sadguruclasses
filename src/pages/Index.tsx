import { useEffect, useRef, useState } from "react";
import { usePlatformStats } from "../hooks/usePlatformStats";
import { useLandingCourses } from "../hooks/useLandingCourses";
import { useHero } from "../hooks/useHero";
import Hero from "../components/Landing/Hero";
import StreamsWeOffer from "../components/Landing/StreamsWeOffer";
import ExamTracks from "../components/Landing/ExamTracks";
import Subjects from "../components/Landing/Subjects";
import WhyChooseUs from "../components/Landing/WhyChooseUs";
import GraduationBanner from "../components/Landing/GraduationBanner";
import StudyMaterials from "../components/Landing/StudyMaterials";
import FreeContent from "../components/Landing/FreeContent";
import LeadForm from "../components/Landing/LeadForm";
import Testimonials from "../components/Landing/Testimonials";
import Footer from "../components/Landing/Footer";
import WhatsAppButton from "../components/common/WhatsAppButton";
import FloatingAuthButton from "../components/common/FloatingAuthButton";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePlatformStats();
  const { data: heroData, loading: heroLoading } = useHero();
  const { data: landingCourses } = useLandingCourses();
  const [statsArr, setStatsArr] = useState<{ stat_key: string; stat_value: string }[]>([]);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (statsLoading) return;
    const arr: { stat_key: string; stat_value: string }[] = [];
    if (stats.total_students) arr.push({ stat_key: "students", stat_value: `${stats.total_students}+` });
    if (stats.total_courses) arr.push({ stat_key: "courses", stat_value: `${stats.total_courses}+` });
    if (stats.total_teachers) arr.push({ stat_key: "teachers", stat_value: `${stats.total_teachers}+` });
    setStatsArr(arr);
  }, [stats, statsLoading]);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-4");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [heroLoading, landingCourses]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <Hero data={heroData} stats={statsArr} />
        <StreamsWeOffer />
        <ExamTracks />
        <Subjects />
        <WhyChooseUs />
        <GraduationBanner />
        <StudyMaterials />
        <FreeContent />
        <LeadForm />
        <Testimonials />
      </main>
      <Footer ref={footerRef} />
      {!user && <WhatsAppButton />}
      <FloatingAuthButton />
    </div>
  );
}
