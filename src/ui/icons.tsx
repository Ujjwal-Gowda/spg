type IconProps = { className?: string }

const base = 'size-4 stroke-current';

export function SwapIcon({ className = '' }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
            <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />
        </svg>
    );
}

export function CrosshairIcon({ className = '' }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
    );
}

export function CloseIcon({ className = '' }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${base} ${className}`}>
            <path d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}

