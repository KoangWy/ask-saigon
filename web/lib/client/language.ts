'use client';
import { useEffect, useSyncExternalStore } from 'react';
import type { Lang } from '@/lib/i18n';
const key='ask-saigon-lang'; let memory:Lang='en'; let storageUnavailable=false;
function current():Lang { if(storageUnavailable)return memory; try { return localStorage.getItem(key)==='vi'?'vi':'en' } catch { storageUnavailable=true; return memory } }
function subscribe(callback:()=>void) { window.addEventListener('storage',callback); window.addEventListener('ask-saigon-language',callback); return ()=>{window.removeEventListener('storage',callback);window.removeEventListener('ask-saigon-language',callback)} }
export function useLanguage() { const lang=useSyncExternalStore(subscribe,current,()=> 'en' as Lang); useEffect(()=>{document.documentElement.lang=lang},[lang]); const changeLanguage=(next:Lang)=>{memory=next;try{localStorage.setItem(key,next);storageUnavailable=false}catch{storageUnavailable=true} document.documentElement.lang=next;window.dispatchEvent(new Event('ask-saigon-language'))}; return {lang,changeLanguage}; }
