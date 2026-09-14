import { z } from 'astro/zod';

/**
 * Demo copies of the innova-astro collection contracts — same folders, same field
 * names, same rules — filled with invented content. Image fields that use Astro's
 * `image()` helper are wired in src/content.config.ts, because `image()` only exists
 * inside the schema context.
 */

export const langs = ['en', 'fr'] as const;
export type Lang = (typeof langs)[number];

/** Articles serve their hero from a media bucket, never from git. */
export const MEDIA_ORIGIN = 'https://media.example.com';

export const translationKey = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'translationKey is kebab-case and locale-neutral');

// ─── articles (authored in-house, EN + FR mirror) ───────────────────────────

export const articleSchema = z.object({
  title: z.string().trim().min(1),
  lang: z.enum(langs),
  translationKey,
  summary: z.string().trim().min(1).max(200),
  publishDate: z.coerce.date(),
  hero: z
    .object({
      src: z.string().startsWith(`${MEDIA_ORIGIN}/`, `hero.src must be served from ${MEDIA_ORIGIN}`),
      alt: z.string().trim().min(1),
    })
    .optional(),
  draft: z.boolean().default(false),
});
export type Article = z.infer<typeof articleSchema>;

/** Published articles must pair exactly 1:1 across locales on translationKey. Drafts are exempt. */
export function assertFrMirror(
  entries: readonly { id: string; lang: Lang; translationKey: string; draft: boolean }[]
): void {
  const defects: string[] = [];
  const byKey = new Map<string, typeof entries>();
  for (const entry of entries.filter((e) => !e.draft)) {
    byKey.set(entry.translationKey, [...(byKey.get(entry.translationKey) ?? []), entry]);
  }
  for (const [key, group] of byKey) {
    for (const lang of langs) {
      const count = group.filter((e) => e.lang === lang).length;
      if (count !== 1) {
        defects.push(`translationKey "${key}" has ${count} published ${lang} entries (needs exactly 1)`);
      }
    }
  }
  if (defects.length > 0) {
    throw new Error(
      'The articles collection failed the FR-mirror gate:\n' +
        defects.map((d) => `  - ${d}`).join('\n') +
        '\nMark work-in-progress entries draft: true.'
    );
  }
}

// ─── hot-topics + latest-news (ported archive articles) ─────────────────────

export const hotTopicCategories = {
  'case-studies-success-stories': 'Case Studies & Success Stories',
  events: 'Past Events',
  'emerging-trends-innovation': 'Emerging Trends & Innovation',
  'indoor-air-quality-ventilation': 'Indoor Air Quality & Ventilation',
  'system-performance-efficiency': 'System Performance & Efficiency',
} as const;
type HotTopicCategory = keyof typeof hotTopicCategories;

export const archiveArticleSchema = z.object({
  title: z.string().trim().min(1),
  lang: z.enum(langs),
  translationKey,
  standfirst: z.string().trim().min(1).max(480),
  publishDate: z.coerce.date(),
  /** Card only — no local page is generated for the entry. */
  liveOnly: z.boolean().default(false),
});

export const hotTopicSchema = archiveArticleSchema.extend({
  categories: z
    .array(z.enum(Object.keys(hotTopicCategories) as [HotTopicCategory, ...HotTopicCategory[]]))
    .min(1),
});

// ─── projects ───────────────────────────────────────────────────────────────

export const projectCountries = { US: 'US', CA: 'Canada' } as const;
type ProjectCountry = keyof typeof projectCountries;

export const projectSchema = z.object({
  title: z.string().trim().min(1),
  lang: z.enum(langs),
  translationKey,
  address: z.string().trim().min(1),
  country: z.enum(Object.keys(projectCountries) as [ProjectCountry, ...ProjectCountry[]]),
  buildingType: z.string().trim().min(1),
  modelsInstalled: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  /** Listing position, not publish date. */
  order: z.number().int().positive(),
  caseStudy: z.string().url().optional(),
  quote: z
    .object({
      text: z.string().trim().min(1),
      name: z.string().trim().min(1),
      role: z.string().trim().min(1),
    })
    .optional(),
  featuredModel: z.object({
    name: z.string().trim().min(1),
    href: z.string().startsWith('/'),
    ctaLabel: z.string().trim().min(1),
  }),
});

// ─── events ─────────────────────────────────────────────────────────────────

/** An event never declares which list it is in — its dates decide, at build time. */
export const eventSchema = z
  .object({
    title: z.string().trim().min(1),
    lang: z.enum(langs),
    translationKey,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    description: z.string().trim().min(1).max(320),
    presence: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).optional(),
    href: z.string().url().optional(),
    ctaLabel: z.string().trim().min(1).optional(),
  })
  .refine((e) => !e.endDate || e.endDate >= e.startDate, 'endDate cannot precede startDate');

/** Upcoming until the last day is over (dates are UTC midnight). */
export function isUpcoming(event: { startDate: Date; endDate?: Date }, now = new Date()): boolean {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return (event.endDate ?? event.startDate).getTime() >= today;
}
