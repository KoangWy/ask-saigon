import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The question is which path handles a message, so the model is replaced by a marker reply.
vi.mock('../../lib/agent', () => ({ runAgent: vi.fn() }));
vi.mock('../../lib/ratelimit', () => ({ allowAi: vi.fn().mockResolvedValue(true) }));
import { runAgent } from '../../lib/agent';
import { routeChat } from '../../lib/router';
import type { ChatRequest, Reply } from '../../lib/schema';

const marker: Reply = { reply_text: 'agent answered', blocks: [], quick_replies: [], simulated: false, fallback: false, source: 'agent' };
const request = (text: string, lang: 'en' | 'vi'): ChatRequest => ({
  input: { kind: 'text', text }, history: [],
  state: { lang, location: { lat: 10.7724, lng: 106.698, label: 'Ben Thanh', source: 'picked' }, now: '2026-11-18T03:45:00.000Z', offline: false },
  client_id: `path-test-${Buffer.from(text).toString('base64').slice(0, 12)}`,
});
type Case = { text: string; lang: 'en' | 'vi'; path: 'fast' | 'agent'; blocks?: string[] };

// Fast = decided by the checked data without a model call; agent = open-ended or constrained.
const cases: Case[] = [
  // Deterministic: food / coffee / nearby, single intent, short.
  { text: 'phở gần đây', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Gần đây có quán phở nào mở khuya không?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'coffee near me', lang: 'en', path: 'fast', blocks: ['place_cards'] },
  { text: 'Quán ăn gần Dinh Độc Lập', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Có quán ăn ngon gần chợ Bến Thành không?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Quán ốc nào ngon?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'What to eat near Ben Thanh Market?', lang: 'en', path: 'fast', blocks: ['place_cards'] },
  // Deterministic: simple facts about one named place.
  { text: 'Dinh Độc Lập mở cửa mấy giờ?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'When does the Independence Palace open?', lang: 'en', path: 'fast', blocks: ['place_cards'] },
  { text: 'Where is Ben Thanh Market?', lang: 'en', path: 'fast', blocks: ['place_cards'] },
  { text: 'Bảo tàng Lịch sử mở cửa mấy giờ?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Bảo tàng Mỹ thuật vé bao nhiêu?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Vé Bảo tàng Chứng tích Chiến tranh bao nhiêu?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Bảo tàng Tôn Đức Thắng có mất phí không?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Phố đi bộ Nguyễn Huệ mở cửa không?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Tham quan Dinh Độc Lập mất bao lâu?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Kể chuyện Nhà thờ Đức Bà', lang: 'vi', path: 'fast', blocks: ['place_cards', 'story'] },
  { text: 'Tell me the story of Ben Thanh Market', lang: 'en', path: 'fast', blocks: ['place_cards', 'story'] },
  // Deterministic: price and distance from the checked tables.
  { text: 'Xích lô 500k một tiếng có đắt không?', lang: 'vi', path: 'fast', blocks: ['price_check'] },
  { text: 'Bánh mì 60k có đắt không?', lang: 'vi', path: 'fast', blocks: ['price_check'] },
  { text: 'Từ Dinh Độc Lập đi bộ tới Nhà thờ Đức Bà mất bao lâu?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Taxi từ chợ Bến Thành tới Dinh Độc Lập bao nhiêu tiền?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  { text: 'Đi bộ tới Dinh Độc Lập mất bao lâu?', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  // Reply chips keep their fixed action.
  { text: 'Lên lịch một ngày', lang: 'vi', path: 'fast', blocks: ['itinerary'] },
  { text: "I'm hungry", lang: 'en', path: 'fast', blocks: ['place_cards'] },
  { text: 'Trời mưa', lang: 'vi', path: 'fast', blocks: ['replan'] },
  { text: 'Gần đây', lang: 'vi', path: 'fast', blocks: ['place_cards'] },
  // Open-ended, comparisons, multi-part and extra constraints go to the model.
  { text: "What's interesting at the Independence Palace?", lang: 'en', path: 'agent' },
  { text: 'Nhà thờ Đức Bà có gì hay?', lang: 'vi', path: 'agent' },
  { text: 'Nên đi Dinh Độc Lập lúc nào?', lang: 'vi', path: 'agent' },
  { text: 'Is the cathedral worth visiting?', lang: 'en', path: 'agent' },
  { text: 'Kể chuyện Nhà thờ Đức Bà rồi gợi ý chỗ ăn tối', lang: 'vi', path: 'agent' },
  { text: 'Tối nay đi đâu chơi?', lang: 'vi', path: 'agent' },
  { text: 'What to do tonight?', lang: 'en', path: 'agent' },
  { text: 'Gợi ý chỗ ngồi yên tĩnh có view đẹp gần đây', lang: 'vi', path: 'agent' },
  { text: 'I have 200k, where can I eat?', lang: 'en', path: 'agent' },
  { text: 'Có nên đi Thảo Cầm Viên không?', lang: 'vi', path: 'agent' },
  { text: 'Dinh Độc Lập hay Nhà thờ Đức Bà, cái nào hay hơn?', lang: 'vi', path: 'agent' },
  { text: 'Vì sao chợ Bến Thành nổi tiếng?', lang: 'vi', path: 'agent' },
  { text: 'Why is the market famous?', lang: 'en', path: 'agent' },
  { text: 'Phở gần đây, rồi đi cà phê', lang: 'vi', path: 'agent' },
  { text: 'Find pho and then a coffee place near me', lang: 'en', path: 'agent' },
  { text: 'Quán ăn cho 5 người, có chỗ đậu xe không?', lang: 'vi', path: 'agent' },
  { text: 'Một quán ăn lãng mạn để hẹn hò', lang: 'vi', path: 'agent' },
  { text: 'Where should I eat with a group of 6?', lang: 'en', path: 'agent' },
  { text: 'Is it going to rain tonight? Any indoor place?', lang: 'en', path: 'agent' },
  { text: 'Sài Gòn có an toàn không?', lang: 'vi', path: 'agent' },
  { text: 'Tôi đói, nhưng muốn ăn chay và có view đẹp', lang: 'vi', path: 'agent' },
  { text: 'an toàn không?', lang: 'vi', path: 'agent' },
  { text: 'Should I visit the palace or the museum?', lang: 'en', path: 'agent' },
  { text: 'How much does a cyclo cost for 2 hours?', lang: 'en', path: 'agent' },
  { text: 'cho tôi một lịch trình 2 ngày ở Quận 1', lang: 'vi', path: 'agent' },
];

beforeEach(() => {
  vi.stubEnv('AI_MODE', 'on');
  vi.stubEnv('LLM_API_KEY', 'test-key');
  vi.mocked(runAgent).mockReset().mockResolvedValue(marker);
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('router path selection', () => {
  it.each(cases)('$path: $text', async c => {
    const reply = await routeChat(request(c.text, c.lang), 'path-test');
    if (c.path === 'agent') {
      expect(vi.mocked(runAgent)).toHaveBeenCalledTimes(1);
      expect(reply.source).toBe('agent');
    } else {
      expect(vi.mocked(runAgent)).not.toHaveBeenCalled();
      expect(reply.source).toBe('rules');
      expect(reply.fallback).toBe(false);
    }
    if (c.blocks) expect(reply.blocks.map(b => b.type)).toEqual(expect.arrayContaining(c.blocks));
  });
});
