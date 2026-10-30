import { useId } from 'react';

// Ask Saigon mark: a speech bubble (ask) holding the S-bend of the Saigon River,
// with the sun rising out of its rim. The same sun dots the "i" in the wordmark.
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  const cut = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={`logo-mark ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <mask id={cut}>
          <rect width="40" height="40" fill="#fff" />
          <circle cx="31.2" cy="8.2" r="5" fill="#000" />
        </mask>
      </defs>
      <path
        mask={`url(#${cut})`}
        fill="var(--mark-bubble)"
        d="M20 2.5C30.2 2.5 37.5 9.6 37.5 19.2S30.2 35.9 20 35.9c-2.5 0-4.9-.4-7.1-1.2L4.6 38l1.9-7.7C4 27.3 2.5 23.4 2.5 19.2 2.5 9.6 9.8 2.5 20 2.5Z"
      />
      <path
        fill="none"
        stroke="var(--mark-river)"
        strokeWidth="3.6"
        strokeLinecap="round"
        d="M28.5 14.2c-1.6-3.6-8.3-5-11.6-2.2-3.1 2.6-.6 6.3 3.6 7.4 4.6 1.2 7.2 4.3 4.6 7.4-2.9 3.4-10.2 2.6-13.2-1"
      />
      <circle cx="31.2" cy="8.2" r="3.3" fill="var(--sun)" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} aria-hidden="true">
      <span className="wordmark-ask">Ask</span>
      <span className="wordmark-saigon">
        Sa<span className="wordmark-i">ı<span className="wordmark-sun" /></span>gon
      </span>
    </span>
  );
}

export default function Logo({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`logo ${className}`}>
      <LogoMark size={size} />
      <Wordmark />
      <span className="sr-only">Ask Saigon</span>
    </span>
  );
}
