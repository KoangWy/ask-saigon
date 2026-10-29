const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export type HoursRange = { days: number[]; start: number; end: number };
export function parseHours(input: string): HoursRange[] {
  if (!input.trim()) return [];
  const ranges: HoursRange[] = [];
  for (const segment of input.split(';')) {
    const match = segment.trim().match(/^(daily|mon|tue|wed|thu|fri|sat|sun)(?:-(mon|tue|wed|thu|fri|sat|sun))?\s+(closed|(?:\d{2}:\d{2}-\d{2}:\d{2})(?:\s*,\s*\d{2}:\d{2}-\d{2}:\d{2})*)$/i);
    if (!match) throw new Error('invalid hours grammar');
    const startDay = days.indexOf(match[1].toLowerCase());
    const selected = match[1].toLowerCase() === 'daily' ? days.map((_, i) => i) : [startDay];
    if (match[2]) { let d = startDay; const end = days.indexOf(match[2].toLowerCase()); while (d !== end) { d = (d + 1) % 7; selected.push(d); } }
    if (match[3] === 'closed') continue;
    for (const span of match[3].split(',')) {
      const [a,b] = span.trim().split('-').map(t => { const [h,m] = t.split(':').map(Number); if (h > 23 || m > 59) throw new Error('invalid time'); return h * 60 + m; });
      ranges.push({days: selected, start: a, end: b});
    }
  }
  return ranges;
}
export function openingStatus(input: string, now: Date): {open_now: boolean | null; closes_at: string | null} {
  if (!input.trim()) return {open_now:null, closes_at:null};
  const shifted = new Date(now.getTime() + 7 * 3600000), day = shifted.getUTCDay(), minute = shifted.getUTCHours()*60+shifted.getUTCMinutes();
  for (const r of parseHours(input)) {
    const overnight = r.end <= r.start;
    if ((r.days.includes(day) && minute >= r.start && (overnight || minute < r.end)) || (overnight && r.days.includes((day+6)%7) && minute < r.end)) return {open_now:true, closes_at:`${String(Math.floor(r.end/60)).padStart(2,'0')}:${String(r.end%60).padStart(2,'0')}`};
  }
  return {open_now:false, closes_at:null};
}
