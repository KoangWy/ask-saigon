import { describe, expect, it } from 'vitest';
import { foodIntent, replyLanguage } from '../../lib/agent/language';

const lang = (text: string, stateLang: 'en' | 'vi' = 'en'): 'en' | 'vi' => replyLanguage({
  input: { kind: 'text', text }, history: [],
  state: { lang: stateLang, location: { lat: 10.7724, lng: 106.698, label: 'Ben Thanh', source: 'picked' }, now: '2026-11-18T03:45:00.000Z', offline: false },
});

describe('foodIntent does not fire on accent-stripped non-food words', () => {
  for (const text of [
    'Sài Gòn có an toàn không?', 'an ninh ở quận 1 thế nào?', 'quận 1 có gì hay?',
    'Tôi muốn đổi lịch', 'Tôi đang đợi bạn', 'xem môn thể thao', 'trang web .com này',
    'quan tam', 'quan sat', 'an tri', 'an nhien', 'doi sang', 'doi thu', 'com doi',
  ]) it(`ignores ${text}`, () => expect(foodIntent(text)).toBe(false));
  for (const text of [
    'Tôi đói', 'đói bụng', 'doi bung', 'Có gì ăn ngon?', 'cơm tấm ở đâu?', 'com tam gan day',
    'món ăn ngon', 'mon an ngon', 'quán ăn', 'quan an', 'quán cà phê', 'quan ca phe',
    'phở gần đây', 'coffee near me', 'uống gì đây?', 'ăn chay', 'nhậu', 'muốn ăn',
  ]) it(`accepts ${text}`, () => expect(foodIntent(text)).toBe(true));
});

describe('replyLanguage detects short questions with and without diacritics', () => {
  for (const text of [
    'pho gan day co ngon khong?', 'co gi hay o Dinh Doc Lap?', 'quan 1 co gi an ngon?',
    'mo cua may gio?', 'di dau choi toi nay?', 'Dinh Độc Lập mở cửa mấy giờ?', 'Có nên đi không?',
  ]) it(`Vietnamese: ${text}`, () => expect(lang(text)).toBe('vi'));
  for (const text of [
    'coffee near me', 'where is Ben Thanh Market?', 'worth it?', 'is it open now?',
    'What time does the museum open?', 'What time does Chợ Bến Thành open?', 'should I go tonight?',
    'Suggest a backpacking day by metro',
  ]) it(`English: ${text}`, () => expect(lang(text)).toBe('en'));
  it('keeps the state language when there is no signal', () => expect(lang('hello there', 'vi')).toBe('vi'));
});

describe('language edge cases from the travel-tips eval', () => {
  it('answers an English question that uses "can" in English', async () => {
    const { replyLanguage } = await import('../../lib/agent/language');
    const state = { lang: 'vi' as const, location: { lat: 10.77, lng: 106.69, label: 'x', source: 'picked' as const }, now: '2026-11-18T02:00:00Z', offline: false };
    expect(replyLanguage({ input: { kind: 'text', text: 'Can I drink tap water or have ice?' }, history: [], state })).toBe('en');
    expect(replyLanguage({ input: { kind: 'text', text: 'can mua sim o dau' }, history: [], state })).toBe('vi');
  });
  it('keeps TP.HCM in a reply while removing bare domains', async () => {
    const { sanitizeReplyText } = await import('../../lib/agent/format');
    expect(sanitizeReplyText('Cả hai đều hoạt động ở TP.HCM. Xem vietnam.travel nhé.')).toBe('Cả hai đều hoạt động ở TP.HCM. Xem nhé.');
  });
});
