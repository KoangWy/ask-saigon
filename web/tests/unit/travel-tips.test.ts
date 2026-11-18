import { describe, expect, it } from 'vitest';
import { getTravelTips } from '../../lib/tools';
import tips from '../../lib/data/generated/meo_du_lich.json';

const top = (query: string, lang: 'en' | 'vi' = 'en') => getTravelTips({ query }, lang).tips.map(t => t.id);

describe('travel tips', () => {
  it('finds the checked tip for common traveller questions in both languages', () => {
    expect(top('How do I cross the street?')).toContain('tip-di_lai-01');
    expect(top('Có cần tip ở nhà hàng không?', 'vi')).toContain('tip-tien_te-05');
    expect(top('What should I wear to a pagoda?')).toContain('tip-phep_lich_su-01');
    expect(top('số cấp cứu là gì', 'vi')).toContain('tip-an_toan-02');
    expect(top('Can I drink tap water or ice?')).toContain('tip-an_uong-06');
  });

  it('returns nothing for a question no tip covers, and every tip carries a source line', () => {
    expect(getTravelTips({ query: 'quantum computing stocks' }).found).toBe(false);
    for (const t of getTravelTips({ query: 'street', limit: 5 }, 'vi').tips) expect(t.source.source).toMatch(/^https:\/\//);
    expect(tips.every(t => t.trich_dan.length > 0)).toBe(true);
  });
});
