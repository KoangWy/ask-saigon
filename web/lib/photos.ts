import landmarks from '@/public/images/saigon/credits-landmarks.json';
import night from '@/public/images/saigon/credits-night.json';
import street from '@/public/images/saigon/credits-street.json';
import type { Lang } from '@/lib/i18n';

// Every photo is from Wikimedia Commons; author and license come from the Commons API (see /credits).
export type Photo = { file: string; slug: string; subject_en: string; subject_vi: string; commons_title: string; page_url: string; author: string; license: string; license_url: string; width: number; height: number; orientation: string; taken?: string };

export const photos: Photo[] = [...landmarks, ...night, ...street].map(p => ({ ...p, author: p.author.replace(/\s*\(more photos\)\s*$/, '') }));
const bySlug = new Map(photos.map(p => [p.slug, p]));

export function photo(slug: string): Photo {
  const found = bySlug.get(slug);
  if (!found) throw new Error(`Unknown photo: ${slug}`);
  return found;
}
// First slug that exists wins, so sections keep working while a photo batch is still pending.
export function photoOr(...slugs: string[]): Photo {
  for (const slug of slugs) { const found = bySlug.get(slug); if (found) return found; }
  throw new Error(`Unknown photos: ${slugs.join(', ')}`);
}
export const photoAlt = (p: Photo, lang: Lang) => (lang === 'vi' ? p.subject_vi : p.subject_en);
