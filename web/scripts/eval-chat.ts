// Sends a fixed set of realistic traveller questions to /api/chat and prints which path answered.
// Usage: pnpm eval:chat http://localhost:3100   (the same command works before and after a change).
// History entries follow the client's format: "text [showed places: id1, id2]".
const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');

type Msg = { role: 'user' | 'assistant'; text: string };
type Case = { label: string; lang: 'en' | 'vi'; turns: string[] };

const cases: Case[] = [
  { label: 'late-pho', lang: 'vi', turns: ['Gần đây có quán phở nào mở khuya không?'] },
  { label: 'coffee-near', lang: 'en', turns: ['coffee near me'] },
  { label: 'food-near-market', lang: 'vi', turns: ['Có quán ăn ngon gần chợ Bến Thành không?'] },
  { label: 'interesting-palace', lang: 'en', turns: ["What's interesting at the Independence Palace?"] },
  { label: 'hours-vi', lang: 'vi', turns: ['Dinh Độc Lập mở cửa mấy giờ?'] },
  { label: 'where-market', lang: 'en', turns: ['Where is Ben Thanh Market?'] },
  { label: 'ticket-en', lang: 'en', turns: ['How much is the ticket to the Independence Palace?'] },
  { label: 'worth-cathedral', lang: 'en', turns: ['Is the cathedral worth visiting?'] },
  { label: 'when-to-go', lang: 'vi', turns: ['Nên đi Dinh Độc Lập lúc nào?'] },
  { label: 'story-plus-food', lang: 'vi', turns: ['Kể chuyện Nhà thờ Đức Bà rồi gợi ý chỗ ăn tối'] },
  { label: 'price-cyclo', lang: 'vi', turns: ['Xích lô 500k một tiếng có đắt không?'] },
  { label: 'taxi-fare', lang: 'vi', turns: ['Taxi từ chợ Bến Thành tới Dinh Độc Lập bao nhiêu tiền?'] },
  { label: 'walk-time', lang: 'vi', turns: ['Từ Dinh Độc Lập đi bộ tới Nhà thờ Đức Bà mất bao lâu?'] },
  { label: 'tonight-vi', lang: 'vi', turns: ['Tối nay đi đâu chơi?'] },
  { label: 'quiet-view', lang: 'vi', turns: ['Gợi ý chỗ ngồi yên tĩnh có view đẹp gần đây'] },
  { label: 'budget-food', lang: 'en', turns: ['I have 200k, where can I eat?'] },
  { label: 'should-i-go', lang: 'vi', turns: ['Có nên đi Thảo Cầm Viên không?'] },
  { label: 'unaccented-food', lang: 'vi', turns: ['quan 1 co gi an ngon?'] },
  // Multi-turn: later turns rely on the cards shown earlier, so the model must see the history.
  { label: 'convo-market', lang: 'vi', turns: ['Có gì hay ở Chợ Bến Thành?', 'Ở đó có gì ăn ngon?', 'Cảm ơn bạn'] },
  { label: 'convo-coffee', lang: 'en', turns: ['Find a coffee place near me', 'Is it open now?'] },
  { label: 'convo-plan', lang: 'vi', turns: ['Lên lịch một ngày', 'Ngày đó trời mưa, đổi lịch giúp tôi'] },
];

const now = () => new Date().toISOString();
const client = () => `eval-${crypto.randomUUID()}`;

async function post(text: string, history: Msg[], lang: 'en' | 'vi') {
  const started = Date.now();
  const response = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': base },
    body: JSON.stringify({
      input: { kind: 'text', text },
      history,
      state: { lang, location: { lat: 10.7724, lng: 106.698, label: 'Ben Thanh', source: 'picked' }, now: now(), offline: false },
      session_id: crypto.randomUUID(),
      client_id: client(),
    }),
  });
  const body = await response.json() as { source?: string; reply_text?: string; blocks?: { type: string; places?: { id: string }[] }[]; fallback?: boolean };
  return { ms: Date.now() - started, source: body.source ?? `HTTP ${response.status}`, text: body.reply_text ?? '', blocks: (body.blocks ?? []).map(b => b.type === 'place_cards' ? `place_cards(${b.places?.map(p => p.id).slice(0, 3).join(',')})` : b.type), fallback: body.fallback };
}

async function main() {
  const tally: Record<string, number> = {};
  for (const c of cases) {
    const history: Msg[] = [];
    for (const [i, text] of c.turns.entries()) {
      let r: Awaited<ReturnType<typeof post>>;
      try { r = await post(text, history, c.lang); } catch (e) { r = { ms: -1, source: 'ERROR', text: String(e), blocks: [], fallback: false }; }
      tally[r.source] = (tally[r.source] ?? 0) + 1;
      console.log(`[${c.label}${c.turns.length > 1 ? `#${i + 1}` : ''}] ${text}`);
      console.log(`  source=${r.source}${r.fallback ? '(fallback)' : ''} ${r.ms}ms blocks=[${r.blocks.join(', ')}]`);
      console.log(`  reply_text=${JSON.stringify(r.text)}`);
      // Build the history the client would send: assistant text plus a note about the cards shown.
      history.push({ role: 'user', text });
      history.push({ role: 'assistant', text: r.text });
    }
  }
  console.log(`\nTOTAL ${Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(' ')}`);
}
void main();
