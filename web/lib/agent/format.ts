import type { Block } from '../schema';

function cardDetails(blocks: Block[]): string[] {
  return blocks.flatMap(block => {
    if (block.type !== 'place_cards') return [];
    return block.places.flatMap(place => {
      const distance = place.distance_m === null ? '' : place.distance_m >= 1000
        ? `${(place.distance_m / 1000).toFixed(1)} km`
        : `${place.distance_m} m`;
      const opening = place.open_now === null ? '' : place.open_now ? 'open now' : 'closed now';
      const closing = place.closes_at ? `closes at ${place.closes_at}` : '';
      return [place.address, place.source, place.checked_at, place.hours_note, distance, opening, closing]
        .filter(value => value && value.length >= 4);
    });
  });
}

export function sanitizeReplyText(value: string, blocks: Block[] = []): string {
  const text = value
    .replace(/```[\s\S]*?```/g, match => match.replace(/```/g, ''))
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, '$1')
    .replace(/[*_`~#>]/g, '')
    .replace(/^\s*[-+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/https?:\/\/[^\s)]+/gi, '')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?/gi, '')
    .replace(/\(\s*(?:source\s*)?\)/gi, '')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  const details = cardDetails(blocks).map(detail => detail.toLocaleLowerCase());
  const hasPlaceCards = blocks.some(block => block.type === 'place_cards');
  const protectedText = text.replace(/\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|e\.g|i\.e)\./gi, match => match.replaceAll('.', '\u2024')).replace(/(?<=\d)\.(?=\d)/g, '\u2024');
  const fragments = (protectedText.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).map(fragment => fragment.replaceAll('\u2024', '.'));
  const sentences = fragments
    .map(sentence => sentence.trim())
    .filter(sentence => sentence && (!hasPlaceCards || !/\b(address|opening hours|hours|source|distance|open now|open until|open at|closed now|closes at)\b/i.test(sentence)))
    .filter(sentence => !hasPlaceCards || !/\b\d+(?:[.,]\d+)?\s*(?:km|m|meters?|metres?)\b/i.test(sentence))
    .filter(sentence => {
      const lower = sentence.toLocaleLowerCase();
      return !details.some(detail => lower.includes(detail));
    })
    .slice(0, 2);

  return sentences.join(' ');
}
