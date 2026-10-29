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
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const details = cardDetails(blocks).map(detail => detail.toLocaleLowerCase());
  const hasPlaceCards = blocks.some(block => block.type === 'place_cards');
  const fragments = text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];
  const sentences = fragments
    .map(sentence => sentence.trim())
    .filter(sentence => sentence && (!hasPlaceCards || !/\b(address|opening hours|hours|source|distance|open now|open until|open at|closed now|closes at)\b/i.test(sentence)))
    .filter(sentence => !hasPlaceCards || !/\b\d+(?:[.,]\d+)?\s*(?:km|m|meters?|metres?)\b/i.test(sentence))
    .filter(sentence => {
      const lower = sentence.toLocaleLowerCase();
      return !details.some(detail => lower.includes(detail));
    })
    .slice(0, 2)
    .map(sentence => {
      const words = sentence.split(/\s+/);
      return words.length > 28 ? `${words.slice(0, 28).join(' ')}…` : sentence;
    });

  return sentences.join(' ');
}
