'use client';
import { useLanguage } from '@/lib/client/language';

export default function LanguageToggle() {
  const { lang, changeLanguage } = useLanguage();
  return (
    <button type="button" className="lang-toggle" onClick={() => changeLanguage(lang === 'en' ? 'vi' : 'en')} aria-label={lang === 'en' ? 'Change language' : 'Đổi ngôn ngữ'}>
      <span data-active={lang === 'en'}>EN</span>
      <span data-active={lang === 'vi'}>VI</span>
    </button>
  );
}
