import type { Route } from '../api/route';
import { formatArrival, formatDistance, formatDuration } from '../lib/format';

/**
 * Distance comes straight from OSRM and is trustworthy. The duration is a
 * free-flow estimate — the public OSRM demo server models no traffic, no
 * signals and no junction delay — so it is labelled rather than presented as a
 * promise. See the note in api/route.ts.
 */
export function RouteSummary({ route }: { route: Route }) {
    return (
        <div className="rounded-b-2xl border-t border-neutral-200 bg-neutral-50/80 px-4 py-3">
            <dl className="flex items-baseline gap-2">
                <dt className="sr-only">Distance</dt>
                <dd className="text-[15px] font-semibold tabular-nums text-neutral-900">
                    {formatDistance(route.distance)}
                </dd>

                <span aria-hidden className="text-neutral-300">·</span>

                <dt className="sr-only">Driving time</dt>
                <dd className="text-[15px] font-semibold tabular-nums text-neutral-900">
                    {formatDuration(route.duration)}
                </dd>

                <dt className="sr-only">Arrival</dt>
                <dd className="ml-auto text-[13px] tabular-nums text-neutral-500">
                    ~{formatArrival(route.duration)}
                </dd>
            </dl>

            <p className="mt-1 text-[11px] leading-tight text-neutral-400">
                Free-flow estimate — excludes traffic
            </p>
        </div>
    );
}
