import { describe, expect, it } from 'vitest';
import nearby from '../../lib/canned/nearby-benthanh';
import { sanitizeReplyText, compactToolResult } from '../../lib/agent/format';

describe('reply text formatting', () => {
  it('removes markdown and card details but keeps a short direct answer', () => {
    const cards = nearby.blocks.filter(block => block.type === 'place_cards');
    const place = cards[0]?.type === 'place_cards' ? cards[0].places[0] : undefined;
    expect(place).toBeDefined();
    const reply = sanitizeReplyText(
      `## **A useful pick**. It is at ${place!.address} and ${place!.hours_note}. ${place!.open_now ? 'It is open now.' : ''} Try \`the market\`! Another short thought. A fourth sentence with more detail.`,
      cards,
    );

    expect(reply).not.toMatch(/[\*_`#]/);
    expect(reply).not.toContain(place!.address);
    expect(reply).not.toContain(place!.hours_note);
    expect(reply).not.toMatch(/open now/i);
    expect(reply).toBe('A useful pick. Try the market! Another short thought. A fourth sentence with more detail.');
    expect(reply.match(/[.!?](?:\s|$)/g)).toHaveLength(4);
  });

  it('removes markdown links and metadata labels', () => {
    const reply = sanitizeReplyText('**Try this.** [Details](https://example.com). Source: https://example.com.');
    expect(reply).toBe('Try this. Details.');
    expect(reply).not.toContain('https://');
  });
});

it('keeps a direct closing-time answer when a place card is shown', () => {
  const cards = nearby.blocks.filter(block => block.type === 'place_cards');
  expect(sanitizeReplyText('It closes at 22:00. Go before 19:00 to avoid the crowds.', cards)).toBe('It closes at 22:00. Go before 19:00 to avoid the crowds.');
});

it('strips internal [showed places: ...] markers a small model echoes back', () => {
  expect(sanitizeReplyText('Here are two picks. [showed places: q1-004, q1-018] Want a third?')).toBe('Here are two picks. Want a third?');
});

describe('tool result compaction', () => {
  it('keeps ids and checked facts but drops card-only fields', () => {
    const cards = nearby.blocks.find(block => block.type === 'place_cards');
    const place = cards?.type === 'place_cards' ? cards.places[0] : undefined;
    expect(place).toBeDefined();
    const compact = compactToolResult('search_places', [place]) as Record<string, unknown>[];
    expect(compact[0]).toMatchObject({ id: place!.id, name: place!.name, category: place!.category, open_now: place!.open_now, checked_at: place!.checked_at });
    for (const key of ['address', 'lat', 'lng', 'maps_url', 'photo_url', 'sources', 'hours_note']) expect(compact[0]).not.toHaveProperty(key);
  });

  it('keeps the readable summary on a place-details result', () => {
    const result = compactToolResult('get_place_details', { found: true, place: { id: 'q1-018', category: 'quan_an', address: 'secret' }, summary: 'Open until 22:00.' }) as { summary: string; place: Record<string, unknown> };
    expect(result.summary).toBe('Open until 22:00.');
    expect(result.place).not.toHaveProperty('address');
  });
});

it('removes bare domains without producing domain fragments and preserves decimal and abbreviation dots',()=>{
 expect(sanitizeReplyText('It is open (source banhmihuynhhoa.vn). Want nearby dinner options?')).toBe('It is open. Want nearby dinner options?');
 expect(sanitizeReplyText('Dr. Linh suggests 1.5 hours. Ready to go?')).toBe('Dr. Linh suggests 1.5 hours. Ready to go?');
});
