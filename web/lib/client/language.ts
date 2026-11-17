'use client';
import { useEffect, useSyncExternalStore } from 'react';
import type { Lang } from '@/lib/i18n';
const key='ask-saigon-lang'; let memory:Lang|null=null; let storageUnavailable=false;
// No saved choice yet: a phone that lists Vietnamese among its languages opens in Vietnamese.
function device():Lang { try { return [...(navigator.languages??[]),navigator.language].some(l=>l?.toLowerCase().startsWith('vi'))?'vi':'en' } catch { return 'en' } }
function current():Lang { if(storageUnavailable)return memory??device(); try { const saved=localStorage.getItem(key); return saved==='vi'||saved==='en'?saved:device() } catch { storageUnavailable=true; return memory??device() } }
function subscribe(callback:()=>void) { window.addEventListener('storage',callback); window.addEventListener('ask-saigon-language',callback); return ()=>{window.removeEventListener('storage',callback);window.removeEventListener('ask-saigon-language',callback)} }
export function useLanguage() { const lang=useSyncExternalStore(subscribe,current,()=> 'en' as Lang); useEffect(()=>{document.documentElement.lang=lang},[lang]); const changeLanguage=(next:Lang)=>{memory=next;try{localStorage.setItem(key,next);storageUnavailable=false}catch{storageUnavailable=true} document.documentElement.lang=next;window.dispatchEvent(new Event('ask-saigon-language'))}; return {lang,changeLanguage}; }
