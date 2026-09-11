import { SearchBox } from './searchbox';
import { RouteSummary } from './routesummary';
import { SwapIcon } from './icons';
import type { Place } from '../api/geocode';
import type { LngLat, Route } from '../api/route';

export type Field = 'from' | 'to'

type Props = {
    from: Place | null
    to: Place | null
    me: LngLat | null
    route: Route | null
    pending: boolean
    error: string | null
    onPick: (field: Field, place: Place) => void
    onClearField: (field: Field) => void
    onUseMyLocation: (field: Field) => void
    onSwap: () => void
    onRoute: () => void
    onReset: () => void
}

export function RoutePanel(props: Props) {
    const { from, to, me, route, pending, error, onPick, onClearField, onUseMyLocation, onSwap, onRoute, onReset } = props;

    const field = (name: Field, place: Place | null, placeholder: string, dot: string) => (
        <div className="flex items-center gap-3">
            <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${dot}`} />
            <SearchBox
                placeholder={placeholder}
                value={place?.name ?? ''}
                near={me}
                onUseMyLocation={me ? () => onUseMyLocation(name) : undefined}
                onSelect={(p) => onPick(name, p)}
                onClear={() => onClearField(name)}
            />
        </div>
    );

    return (
        <section className="pointer-events-auto relative z-20 w-full rounded-2xl bg-white/95 shadow-[0_2px_24px_rgba(0,0,0,0.12)] ring-1 ring-neutral-900/5 backdrop-blur sm:w-[21rem]">
            <div className="flex flex-col gap-3 p-3.5">
                <div className="flex items-center gap-2">
                    <div className="relative flex flex-1 flex-col gap-2">
                        {/* the rail joining the two dots, inset so it meets neither */}
                        <span aria-hidden className="absolute left-[4px] top-[23px] bottom-[23px] w-0.5 rounded-full bg-neutral-200" />
                        {field('from', from, 'From', 'bg-emerald-500')}
                        {field('to', to, 'To', 'bg-red-500')}
                    </div>

                    <button
                        type="button"
                        onClick={onSwap}
                        disabled={!from || !to}
                        aria-label="Swap start and destination"
                        className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800 disabled:pointer-events-none disabled:opacity-30"
                    >
                        <SwapIcon />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onRoute}
                        disabled={!from || !to || pending}
                        className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
                    >
                        {pending ? 'Finding route…' : 'Get route'}
                    </button>

                    {(from || to) && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="rounded-lg px-3 py-2 text-sm text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            </div>

            {route && <RouteSummary route={route} />}
        </section>
    );
}
