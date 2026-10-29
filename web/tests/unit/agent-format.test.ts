import { describe, expect, it } from 'vitest';
import nearby from '../../lib/canned/nearby-benthanh';
import { sanitizeReplyText } from '../../lib/agent/format';

describe('reply text formatting', () => {
  it('removes markdown, card details, and limits replies to two short sentences', () => {
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
    expect(reply).toBe('A useful pick. Try the market!');
    expect(reply.match(/[.!?](?:\s|$)/g)).toHaveLength(2);
  });

  it('removes markdown links and metadata labels', () => {
    const reply = sanitizeReplyText('**Try this.** [Details](https://example.com). Source: https://example.com.');
    expect(reply).toBe('Try this. Details.');
    expect(reply).not.toContain('https://');
  });
});
