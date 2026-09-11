import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { search, type Place } from '../api/geocode';
import type { LngLat } from '../api/route';
import { CloseIcon, CrosshairIcon } from './icons';

type Props = {
    placeholder: string
    value: string
    near?: LngLat | null
    /** Offered as the first row of the dropdown; omitted when there is no fix. */
    onUseMyLocation?: () => void
    onSelect: (place: Place) => void
    onClear: () => void
}

/**
 * One row of the dropdown. "Use my location" lives in the list rather than as a
 * button beside the input: it keeps the panel to two controls per field.
 */
type Row = { kind: 'locate' } | { kind: 'place'; place: Place }

export function SearchBox({ placeholder, value, near, onUseMyLocation, onSelect, onClear }: Props) {
    const [q, setQ] = useState(value);
    const [results, setResults] = useState<Place[]>([]);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [active, setActive] = useState(-1);

    // picking a suggestion writes its name into the input; that edit must not re-search
    const skipNextSearch = useRef(false);
    // kept in a ref so a new position doesn't retrigger the search on every gps tick
    const nearRef = useRef(near);
    nearRef.current = near;

    const rows: Row[] = [
        ...(onUseMyLocation ? [{ kind: 'locate' } as const] : []),
        ...results.map((place) => ({ kind: 'place', place }) as const),
    ];

    useEffect(() => {
        setQ((current) => {
            if (current === value) return current;
            skipNextSearch.current = true;
            setOpen(false);
            setResults([]);
            return value;
        });
    }, [value]);

    useEffect(() => {
        if (skipNextSearch.current) {
            skipNextSearch.current = false;
            return;
        }

        const term = q.trim();
        if (term.length < 2) {
            setResults([]);
            return;
        }

        const ctrl = new AbortController();
        // debounce: only fire once the typing pauses
        const timer = setTimeout(() => {
            setBusy(true);
            search(term, nearRef.current ?? undefined, ctrl.signal)
                .then((found) => {
                    setResults(found);
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

    function choose(row: Row) {
        skipNextSearch.current = true;
        setOpen(false);
        setResults([]);

        if (row.kind === 'locate') {
            onUseMyLocation?.();
            return;
        }
        setQ(row.place.name);
        onSelect(row.place);
    }

    function clear() {
        skipNextSearch.current = true;
        setQ('');
        setOpen(false);
        setResults([]);
        onClear();
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Escape') {
            setOpen(false);
            return;
        }
        if (!open || rows.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % rows.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            choose(rows[active === -1 ? 0 : active]);
        }
    }

    return (
        <div className="relative min-w-0 flex-1">
            <input
                type="text"
                value={q}
                placeholder={placeholder}
                aria-label={placeholder}
                autoComplete="off"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => rows.length > 0 && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                className="w-full rounded-lg bg-neutral-100 py-2 pl-3 pr-8 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-900/10"
            />

            {busy && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">…</span>
            )}

            {!busy && q && (
                <button
                    type="button"
                    aria-label={`Clear ${placeholder.toLowerCase()}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={clear}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700"
                >
                    <CloseIcon className="size-3.5" />
                </button>
            )}

            {open && rows.length > 0 && (
                // the panel sits at the bottom of a phone screen, so the list opens upward there
                <ul className="absolute inset-x-0 bottom-full z-20 mb-1.5 max-h-[40dvh] overflow-y-auto sm:max-h-64 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-1.5">
                    {rows.map((row, i) => (
                        <li key={row.kind === 'locate' ? 'locate' : `${row.place.name}-${row.place.cords.join(',')}`}>
                            <button
                                type="button"
                                // mousedown fires before blur, so the click isn't lost to the dropdown closing
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    choose(row);
                                }}
                                onMouseEnter={() => setActive(i)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                                    i === active ? 'bg-neutral-100' : 'bg-white'
                                } ${row.kind === 'locate' ? 'font-medium text-neutral-900' : 'text-neutral-700'}`}
                            >
                                {row.kind === 'locate' ? (
                                    <>
                                        <CrosshairIcon className="size-4 shrink-0 text-neutral-500" />
                                        Use my location
                                    </>
                                ) : (
                                    <span className="truncate">{row.place.name}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
