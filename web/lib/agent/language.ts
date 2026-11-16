import type { ChatRequest } from '../schema';
export function replyLanguage(request: ChatRequest): 'en' | 'vi' {
  const text = request.input.kind === 'text' ? request.input.text : request.input.kind === 'image' ? request.input.text ?? '' : '';
  if (/\b(where|what|when|how|is|are|can|find|recommend|please|want|i am|i'm)\b/i.test(text) && !/\b(tôi|mình|muốn|giá|gần|ăn|có|không|hãy)\b/i.test(text)) return 'en';
  return /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01a0\u01a1\u01af\u01b0\u1ea0-\u1ef9]/i.test(text) || /[àáâãèéêìíòóôõùúý]/i.test(text) ? 'vi' : request.state.lang;
}
export const normalizeText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
export function outsideArea(text: string): boolean { return /\b(thu duc|vung tau|ha noi|hanoi|da nang|da lat|quan (2|4|5|6|7|8|10|11|12)|district (2|4|5|6|7|8|10|11|12)|binh thanh|phu nhuan|go vap|tan binh|tan phu|binh tan|cu chi|can gio|nha be|hoc mon|cho lon|nha trang|phu quoc|hoi an|sapa|sa pa|mui ne|phan thiet|can tho|mekong)\b/.test(normalizeText(text)); }
// Without accents "quận" and "quán" are both "quan", and "an toàn" (safe) starts with "ăn": drop those first.
const NOT_FOOD = /\b(an toan|an ninh|an tam|binh an|an nhien|quan \d+|quan (mot|ba|nhat)|district \d+)\b/g;
export function foodIntent(text: string): boolean { return /\b(food|eat|eating|hungry|meal|dinner|lunch|breakfast|restaurant|vegetarian|vegan|pho|noodle|cafe|coffee|com|an|mon|quan|doi|chay|ca phe|uong|nhau|bia|do uong)\b/.test(normalizeText(text).replace(NOT_FOOD, ' ')); }
