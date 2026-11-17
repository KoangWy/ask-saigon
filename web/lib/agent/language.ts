import type { ChatRequest } from '../schema';
const EN = /\b(where|what|when|how|why|is|are|can|could|find|recommend|please|want|worth|open|closed|ticket|price|near|time|does|do|tell me|show me|i am|i'm)\b/gi;
const ACCENTED_VI = /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01a0\u01a1\u01af\u01b0\u1ea0-\u1ef9àáâãèéêìíòóôõùúý]/i;
const STRONG_VI = /\b(tôi|mình|muốn|không|hãy|mấy|giờ|đâu|sao|gì|đang|nhé|ạ)\b/i;
// Short questions typed without diacritics still have Vietnamese function words: use them before
// falling back to the state language, which the app may have initialised from the browser.
// "day" is deliberately absent: it is a common English word ("plan my day") and "nay" already
// marks "hôm nay". Treating it as Vietnamese answers English questions in Vietnamese.
const VI_NO_ACCENT = /\b(gan|nay|sao|khong|co|gi|pho|banh|mi|cha|quan|an|uong|bao|nhieu|ngon|dep|tot|dat|re|mo|cua|ve|di|dau|choi|muon|can|minh|toi|chieu|sang|trua|dem|khuya|nha|duong|chay|oc)\b/i;
export function replyLanguage(request: ChatRequest): 'en' | 'vi' {
  const text = request.input.kind === 'text' ? request.input.text : request.input.kind === 'image' ? request.input.text ?? '' : '';
  const enHits = text.match(EN)?.length ?? 0, accented = ACCENTED_VI.test(text), strongVi = STRONG_VI.test(text);
  // Two English function words outvote a bare accented proper noun ("What time does Chợ Bến Thành open?").
  if (enHits >= 2 && !strongVi) return 'en';
  if (enHits >= 1 && !accented && !strongVi && !VI_NO_ACCENT.test(text)) return 'en';
  if (accented || strongVi || VI_NO_ACCENT.test(text)) return 'vi';
  return request.state.lang;
}
export const normalizeText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
export function outsideArea(text: string): boolean { return /\b(thu duc|vung tau|ha noi|hanoi|da nang|da lat|quan (2|4|5|6|7|8|10|11|12)|district (2|4|5|6|7|8|10|11|12)|binh thanh|phu nhuan|go vap|tan binh|tan phu|binh tan|cu chi|can gio|nha be|hoc mon|cho lon|nha trang|phu quoc|hoi an|sapa|sa pa|mui ne|phan thiet|can tho|mekong)\b/.test(normalizeText(text)); }
// Before accent stripping these look like food but are not: an toàn, quận 1, đổi lịch, "com" in a URL.
const NOT_FOOD = /\b(an toan|an ninh|an tam|binh an|an nhien|an tri|an cu|an mac|an chap|quan \d+|quan (mot|ba|hai|nhat|trung tam)|district \d+)\b/g;
const FOOD = /\b(food|eat|eating|hungry|meal|dinner|lunch|breakfast|restaurant|restaurants|vegetarian|vegan|pho|noodle|noodles|cafe|coffee|ca phe|nhau|bia|do uong|an|uong|chay|quan|com|mon|doi)\b/;
export function foodIntent(text: string): boolean {
  const original = text.toLowerCase(), cleaned = normalizeText(text).replace(NOT_FOOD, ' ');
  // normalizeText erases the accent that decides these words: quán/quận, món/môn, đói/đổi-đợi,
  // cơm/com. Keep them only when the accented or compound form shows the food sense.
  const filtered = cleaned.replace(/\b(quan|com|mon|doi|pho)\b/g, token => {
    if (token === 'quan') return /\bquán\b/.test(original) || /\bquan (an|cafe|ca phe|nhau|com|pho|banh)\b/.test(cleaned) ? token : ' ';
    if (token === 'com') return /\bcơm\b/.test(original) || /\b(an com|com tam|com rang)\b/.test(cleaned) ? token : ' ';
    if (token === 'mon') return /\bmón\b/.test(original) || /\b(mon an|mon ngon|mon chay|mon nuong)\b/.test(cleaned) ? token : ' ';
    // "phố" (city/street) accents to the same "pho" as "phở" (noodles): only the latter is food.
    if (token === 'pho') return original.includes('phở') || /\b(pho (bo|ga|cuon|chien|soup)|an pho|quan pho)\b/.test(cleaned) ? token : ' ';
    // "đ" is not a JS \w character, so a \b before "đói" would never match.
    return original.includes('đói') || /\bdoi bung\b/.test(cleaned) ? token : ' ';
  });
  return FOOD.test(filtered);
}
