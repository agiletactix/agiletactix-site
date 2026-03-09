import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string().default('Danny Liu'),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const podcastCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    episodeNumber: z.number().optional(),
    description: z.string(),
    pubDate: z.date(),
    duration: z.string(),
    audioUrl: z.string().url(),
    episodeType: z.enum(['full', 'trailer', 'bonus']).default('full'),
    season: z.number().default(1),
    explicit: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
  }),
});

export const collections = {
  'blog': blogCollection,
  'podcast': podcastCollection,
};
