import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin-controlled toggles for the lesson page.
 *
 * Same storage + cache shape as usePlayerReaderControls: one row per flag in
 * `site_settings` (key/value text), read once and cached for 5 minutes.
 * Every flag defaults to ON so nothing changes until an admin flips it.
 */
export const LESSON_FEATURE_KEYS = {
  chipStrip: "lesson_chip_strip",
  chipComments: "lesson_chip_comments",
  chipAttachment: "lesson_chip_attachment",
  chipNotes: "lesson_chip_notes",
  chipAskDoubt: "lesson_chip_ask_doubt",
  chipTimeline: "lesson_chip_timeline",
  chipMyDoubts: "lesson_chip_my_doubts",
  chipBookmarks: "lesson_chip_bookmarks",
  chipMentors: "lesson_chip_mentors",
  chipLike: "lesson_chip_like",
  chipRating: "lesson_chip_rating",
  pdfDownload: "lesson_pdf_download",
  notesAutoScroll: "lesson_notes_autoscroll",
  readerAutoScroll: "lesson_reader_autoscroll",
} as const;

export type LessonFeatureFlag = keyof typeof LESSON_FEATURE_KEYS;

export type LessonFeatureFlags = Record<LessonFeatureFlag, boolean>;

export const LESSON_FEATURE_DEFAULTS: LessonFeatureFlags = {
  chipStrip: true,
  chipComments: true,
  chipAttachment: true,
  chipNotes: true,
  chipAskDoubt: true,
  chipTimeline: true,
  chipMyDoubts: true,
  chipBookmarks: true,
  chipMentors: true,
  chipLike: true,
  chipRating: true,
  pdfDownload: true,
  notesAutoScroll: true,
  readerAutoScroll: true,
};

export const LESSON_FEATURE_QUERY_KEY = ["site_settings", "lesson_features"] as const;

function isTruthy(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true; // unset → default ON
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "on" || v === "yes";
}

export function parseLessonFeatureRows(
  rows: { key: string; value: string | null }[],
): LessonFeatureFlags {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = { ...LESSON_FEATURE_DEFAULTS };
  (Object.keys(LESSON_FEATURE_KEYS) as LessonFeatureFlag[]).forEach((flag) => {
    const raw = map.get(LESSON_FEATURE_KEYS[flag]);
    out[flag] = raw === undefined ? LESSON_FEATURE_DEFAULTS[flag] : isTruthy(raw);
  });
  return out;
}

export function useLessonFeatureFlags(): LessonFeatureFlags & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: LESSON_FEATURE_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", Object.values(LESSON_FEATURE_KEYS));

      if (error) throw error;
      return parseLessonFeatureRows(rows || []);
    },
  });

  return { ...LESSON_FEATURE_DEFAULTS, ...(data || {}), isLoading };
}
