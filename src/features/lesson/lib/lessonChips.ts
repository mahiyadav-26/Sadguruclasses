/**
 * Pure helpers for the LessonView chip strip and progress maths.
 *
 * Kept free of React/DOM so the rules (which chips show, what the Like chip
 * is labelled, how progress rounds) can be unit-tested without rendering the
 * 2.5k-line lesson page.
 */

export type LessonChipIcon =
  | "comments"
  | "attachment"
  | "notes"
  | "ask-doubt"
  | "timeline"
  | "my-doubts"
  | "bookmarks"
  | "mentors"
  | "like"
  | "rating";

export interface LessonChip {
  id: string;
  label: string;
  icon: LessonChipIcon;
  /** Chips with an action fire a callback instead of switching the panel. */
  action?: "like";
}

export interface LessonChipOptions {
  /** Lesson has saved smart notes (transcript markdown). */
  hasNotes: boolean;
  /** Admin/teacher can add notes even when none exist yet. */
  isAdminOrTeacher: boolean;
  hasLiked: boolean;
  likeCount: number;
}

/** Label shown on the Like chip — mirrors the previous inline expression. */
export function likeChipLabel(hasLiked: boolean, likeCount: number): string {
  if (hasLiked) return likeCount > 0 ? `Liked ${likeCount}` : "Liked";
  return likeCount > 0 ? `Like ${likeCount}` : "Like";
}

export function buildLessonChips(opts: LessonChipOptions): LessonChip[] {
  const { hasNotes, isAdminOrTeacher, hasLiked, likeCount } = opts;
  return [
    { id: "comments", label: "Comments", icon: "comments" },
    { id: "attachment", label: "Attachment", icon: "attachment" },
    ...(hasNotes || isAdminOrTeacher
      ? [{ id: "notes", label: "Smart Notes", icon: "notes" as const }]
      : []),
    { id: "ask-doubt", label: "Ask Doubt", icon: "ask-doubt" },
    { id: "timeline", label: "Timeline", icon: "timeline" },
    { id: "my-doubts", label: "My Doubts", icon: "my-doubts" },
    { id: "bookmarks", label: "Bookmarks", icon: "bookmarks" },
    { id: "mentors", label: "Mentors", icon: "mentors" },
    {
      id: "like",
      label: likeChipLabel(hasLiked, likeCount),
      icon: "like",
      action: "like",
    },
    { id: "rating", label: "Rating", icon: "rating" },
  ];
}

/** Course completion percentage, rounded, safe for an empty lesson list. */
export function lessonProgressPercent(completedCount: number, totalLessons: number): number {
  if (!totalLessons || totalLessons <= 0) return 0;
  const pct = Math.round((completedCount / totalLessons) * 100);
  return Math.max(0, Math.min(100, pct));
}

const DOCUMENT_TYPES = ["PDF", "DPP", "DPP_ATTEMPT", "NOTES"];

/** True when a lesson should open in the full-page document reader. */
export function isDocumentLessonType(lectureType?: string | null): boolean {
  return DOCUMENT_TYPES.includes((lectureType ?? "").toUpperCase());
}
