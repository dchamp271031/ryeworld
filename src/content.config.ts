import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.string(),
    category: z.enum([
      'news',
      'food',
      'events',
      'things-to-do',
      'sports',
      'community',
      'guide',
      'ranked',
      'history',
    ]),
    excerpt: z.string(),
    town: z.string().default('rye'),
    quality_score: z.number().optional(),
    author: z.string().optional(),
    readTime: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { articles };
