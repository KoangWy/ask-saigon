import { describe, expect, it } from 'vitest';
import places from '../../lib/data/generated/dia_diem.json';
import { searchPlaces, checkPlaceLive } from '../../lib/tools';

const ctx = { location: { lat: 10.7724, lng: 106.698 }, now: new Date('2026-11-18T14:00:00Z'), lang: 'en' as const };

// Regression: "Có nên đi Thảo Cầm Viên không?" missed because search_places' default radius
// dropped the zoo (~1.9 km away) and fuzzy tokens matched "Bùi Viện"/"Công viên" instead.
// Every checked name of every active place must resolve through the lookups the agent uses,
// whatever the place's distance from the demo location.
describe('checked place names resolve', () => {
  it('finds every active place by each ten_vi, ten_en and ten_khac alias', () => {
    const failures: string[] = [];
    for (const p of places.filter(row => row.trang_thai === 'hoat_dong')) {
      const names = [p.ten_vi, p.ten_en, ...p.ten_khac.split(';')].map(n => n.trim()).filter(Boolean);
      for (const name of names) {
        const viaSearch = searchPlaces({ query: name, limit: 5 }, ctx).some(card => card.id === p.id);
        const viaLive = checkPlaceLive({ name }, ctx).place?.id === p.id;
        if (!viaSearch || !viaLive) failures.push(`${p.id} / "${name}": search=${viaSearch} live=${viaLive}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
