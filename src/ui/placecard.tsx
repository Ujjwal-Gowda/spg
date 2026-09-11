import type { Place } from '../api/geocode';
import type { LngLat } from '../api/route';
import { CloseIcon } from './icons';

type Props = {
    cords: LngLat
    /** null while the reverse lookup is still in flight */
    place: Place | null
    canNavigate: boolean
    onDirections: () => void
    onClose: () => void
}

const sentence = (v: string) => v.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function PlaceCard({ cords, place, canNavigate, onDirections, onClose }: Props) {
    const street = place?.housenumber && place.street ? `${place.housenumber} ${place.street}` : place?.street;

    const details: [string, string | undefined][] = [
        ['Street', street],
        ['Neighbourhood', place?.district ?? place?.locality],
        ['City', place?.city],
        ['County', place?.county],
        ['State', place?.state],
        ['Postcode', place?.postcode],
        ['Country', place?.country],
        ['Coordinates', `${cords[1].toFixed(5)}, ${cords[0].toFixed(5)}`],
    ];

    return (
        <section className="pointer-events-auto w-full overflow-hidden rounded-2xl bg-white/95 shadow-[0_2px_24px_rgba(0,0,0,0.12)] ring-1 ring-neutral-900/5 backdrop-blur sm:w-[21rem]">
            <div className="max-h-[42dvh] overflow-y-auto overscroll-contain p-3.5 sm:max-h-[60dvh]">
                <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-[15px] font-semibold text-neutral-900">
                            {place?.name ?? 'Finding this place…'}
                        </h2>
                        {place?.category && (
                            <p className="mt-0.5 text-[12px] text-neutral-400">{sentence(place.category)}</p>
                        )}
                        {place?.address && (
                            <p className="mt-1 text-[13px] leading-snug text-neutral-500">{place.address}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close place details"
                        className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-800"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onDirections}
                    disabled={!canNavigate}
                    title={canNavigate ? undefined : 'Your location is unavailable'}
                    className="mt-3 w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
                >
                    Directions from your location
                </button>

                <dl className="mt-3 border-t border-neutral-100 pt-2 text-[13px]">
                    {details.map(([term, value]) =>
                        value ? (
                            <div key={term} className="flex gap-3 py-1">
                                <dt className="w-28 shrink-0 text-neutral-400">{term}</dt>
                                <dd className="min-w-0 flex-1 break-words text-neutral-800">{value}</dd>
                            </div>
                        ) : null
                    )}
                </dl>
            </div>
        </section>
    );
}
