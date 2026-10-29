import type { ChatRequest } from '../schema';
export function replyLanguage(request: ChatRequest): 'en' | 'vi' {
  const text = request.input.kind === 'text' ? request.input.text : request.input.kind === 'image' ? request.input.text ?? '' : '';
  if (/\b(where|what|when|how|is|are|can|find|recommend|please|want|i am|i'm)\b/i.test(text) && !/\b(tôi|mình|muốn|giá|gần|ăn|có|không|hãy)\b/i.test(text)) return 'en';
  return /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01a0\u01a1\u01af\u01b0\u1ea0-\u1ef9]/i.test(text) || /[àáâãèéêìíòóôõùúý]/i.test(text) ? 'vi' : request.state.lang;
}
export const normalizeText = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
export function outsideArea(text: string): boolean { return /\b(thu duc|vung tau|ha noi|hanoi|da nang|da lat)\b/.test(normalizeText(text)); }
export function foodIntent(text: string): boolean { return /\b(food|eat|eating|restaurant|vegetarian|vegan|pho|noodle|cafe|coffee|com|an|mon|quan|chay|ca phe|do uong)\b/.test(normalizeText(text)); }
