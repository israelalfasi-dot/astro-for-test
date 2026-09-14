import { getCollection } from 'astro:content';
import { isUpcoming } from './schemas';

export const demoCollections = [
  { name: 'articles', label: 'Articles', note: 'Authored in-house · EN + FR mirror · hero from media bucket' },
  { name: 'events', label: 'Events', note: 'Upcoming / recent decided by dates at build time' },
  { name: 'hot-topics', label: 'Hot Topics', note: 'Archive article · 1+ categories' },
  { name: 'latest-news', label: 'Latest News', note: 'Archive article' },
  { name: 'projects', label: 'Projects', note: 'Structured record · no body · ordered by `order`' },
] as const;

export type DemoCollection = (typeof demoCollections)[number]['name'];

export async function getDemoEntries(name: DemoCollection) {
  return getCollection(name);
}

/** A short subtitle for a card, per collection shape. */
export function cardLine(name: DemoCollection, data: Record<string, any>): string {
  switch (name) {
    case 'articles':
      return data.summary;
    case 'events':
      return `${isUpcoming(data as any) ? 'Upcoming' : 'Recent'} · ${data.location ?? ''}`;
    case 'projects':
      return `${data.address} · ${data.buildingType}`;
    default:
      return data.standfirst;
  }
}
