import { defineCollection, type SchemaContext } from 'astro:content';
import { glob, type LoaderContext } from 'astro/loaders';
import { z } from 'astro/zod';
import {
  archiveArticleSchema,
  articleSchema,
  assertFrMirror,
  eventSchema,
  hotTopicSchema,
  projectSchema,
  type Article,
} from './lib/demo/schemas';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
  }),
});

// ─── Demo of the innova-astro collections (invented content) ────────────────

const articleFiles = glob({ pattern: '**/*.md', base: './src/content/articles' });

// Wrapped so the FR mirror — a property of the whole set — is checked after every file loads.
const articles = defineCollection({
  loader: {
    name: 'articles-fr-mirror',
    load: async (context: LoaderContext): Promise<void> => {
      await articleFiles.load(context);
      assertFrMirror(
        context.store.values().map((entry) => {
          const { lang, translationKey, draft } = entry.data as Article;
          return { id: entry.id, lang, translationKey, draft };
        })
      );
    },
  },
  schema: articleSchema,
});

const pictured = (image: SchemaContext['image']) =>
  z.object({ src: image(), alt: z.string().trim().min(1) });

const hotTopics = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hot-topics' }),
  schema: ({ image }: SchemaContext) => hotTopicSchema.extend({ hero: pictured(image) }),
});

const latestNews = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/latest-news' }),
  schema: ({ image }: SchemaContext) => archiveArticleSchema.extend({ hero: pictured(image) }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }: SchemaContext) =>
    projectSchema.extend({
      facade: pictured(image),
      statsBackground: pictured(image).optional(),
      video: z.object({ url: z.string().url() }).optional(),
      // The card's caption already names the project, so its alt may be empty — and the
      // CMS omits an empty optional field entirely, so a missing alt means ''.
      card: z.object({ src: image(), alt: z.string().default('') }),
      gallery: z.array(pictured(image)).default([]),
      featuredModelImage: pictured(image),
    }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: ({ image }: SchemaContext) =>
    eventSchema.and(z.object({ banner: pictured(image).optional() })),
});

export const collections = {
  posts,
  articles,
  'hot-topics': hotTopics,
  'latest-news': latestNews,
  projects,
  events,
};
