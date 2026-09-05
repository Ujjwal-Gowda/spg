import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { search, type Place } from '../api/geocode';

type Props = {
    placeholder: string
    near?: [number, number] | null
    onSelect: (place: Place) => void
    onClear?: () => void
}

export function SearchBox({ placeholder, near, onSelect, onClear }: Props) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [active, setActive] = useState(-1);

    // picking a suggestion writes its name into the input; that edit must not re-search
    const justPicked = useRef(false);
    // kept in a ref so a new position doesn't retrigger the search on every gps tick
    const nearRef = useRef(near);
    nearRef.current = near;

    useEffect(() => {
        if (justPicked.current) {
            justPicked.current = false;
            return;
        }

        const term = q.trim();
        if (term.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }

        const ctrl = new AbortController();
        // debounce: only fire once the typing pauses
        const timer = setTimeout(() => {
            setBusy(true);
            search(term, nearRef.current ?? undefined, ctrl.signal)
                .then((r) => {
                    setResults(r);
                    setActive(-1);
                    setOpen(true);
                })
                .catch((err) => {
                    // the cleanup below aborts a search the next keystroke superseded
                    if (err.name !== 'AbortError') console.warn('geocode', err);
                })
                .finally(() => setBusy(false));
        }, 300);

        return () => {
            clearTimeout(timer);
            ctrl.abort();
        };
    }, [q]);

    function pick(place: Place) {
        justPicked.current = true;
        setQ(place.name);
        setOpen(false);
        setResults([]);
        onSelect(place);
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (!open || results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(results[active === -1 ? 0 : active]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={q}
                placeholder={placeholder}
                onChange={(e) => {
                    setQ(e.target.value);
                    if (e.target.value.trim() === '') onClear?.();
                }}
                onKeyDown={onKeyDown}
                onFocus={() => results.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            />

            {busy && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                    …
                </span>
            )}

            {open && results.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                    {results.map((r, i) => (
                        <li key={`${r.name}-${r.cords.join(',')}-${i}`}>
                            <button
                                type="button"
                                // mousedown fires before blur, so the click isn't lost to the dropdown closing
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    pick(r);
                                }}
                                onMouseEnter={() => setActive(i)}
                                className={`block w-full px-3 py-2 text-left text-sm text-neutral-800 ${i === active ? 'bg-neutral-100' : 'bg-white'}`}
                            >
                                {r.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
