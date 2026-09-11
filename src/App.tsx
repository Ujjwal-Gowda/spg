import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Map } from 'maplibre-gl';
import { MapView } from './map/mapview';
import { useGeolocation } from './map/usegeolocation';
import { RoutePanel } from './ui/routepanel';
import type { Field } from './ui/routepanel';
import { PlaceCard } from './ui/placecard';
import { CrosshairIcon } from './ui/icons';
import { reverseGeocode } from './api/geocode';
import type { Place } from './api/geocode';
import { fetchRoute } from './api/route';
import type { LngLat, Route } from './api/route';

function App() {
    const map = useRef<Map | null>(null);
    const { position: me } = useGeolocation();

    const [from, setFrom] = useState<Place | null>(null);
    const [to, setTo] = useState<Place | null>(null);
    const [route, setRoute] = useState<Route | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [request, setRequest] = useState<{ from: Place; to: Place } | null>(null);
    const [picked, setPicked] = useState<LngLat | null>(null);
    const [pickedPlace, setPickedPlace] = useState<Place | null>(null);
    const setters: Record<Field, Dispatch<SetStateAction<Place | null>>> = { from: setFrom, to: setTo };

    useEffect(() => {
        // editing an endpoint invalidates the drawn route, but not a request just made for these two
        setRequest((current) => (current?.from === from && current?.to === to ? current : null));
        setRoute(null);
        setError(null);
    }, [from, to]);

    useEffect(() => {
        if (!picked) return;

        const ctrl = new AbortController();
        setPickedPlace(null);
        reverseGeocode(picked, ctrl.signal)
            .then(setPickedPlace)
            .catch(() => setPickedPlace(null));

        return () => ctrl.abort();
    }, [picked]);

    useEffect(() => {
        if (!request) return;

        const ctrl = new AbortController();
        let live = true;
        setPending(true);

        fetchRoute(request.from.cords, request.to.cords, ctrl.signal)
            .then((found) => live && setRoute(found))
            .catch((err) => {
                if (!live || err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Could not find a route.');
            })
            .finally(() => {
                if (live) setPending(false);
            });

        return () => {
            live = false;
            ctrl.abort();
        };
    }, [request]);

    async function useMyLocation(field: Field) {
        if (!me) return;

        const set = setters[field];
        const here: Place = { name: 'My location', cords: me };
        set(here);

        const named = await reverseGeocode(me).catch(() => null);
        if (named) set((prev) => (prev === here ? named : prev));
    }

    function directionsFromHere() {
        if (!me || !picked) return;

        const start: Place = { name: 'Your location', cords: me };
        const end: Place = pickedPlace ?? { name: 'Dropped pin', cords: picked };

        setFrom(start);
        setTo(end);
        setPicked(null);
        setRequest({ from: start, to: end });
    }

    function recenter() {
        if (!map.current || !me) return;
        map.current.easeTo({ center: me, zoom: Math.max(map.current.getZoom(), 15) });
    }

    return (
        <div className="relative h-full w-full overflow-hidden bg-neutral-100">
            <MapView
                me={me}
                from={from}
                to={to}
                picked={picked}
                route={route}
                onPick={setPicked}
                onReady={(instance) => {
                    map.current = instance;
                }}
            />

            <div
                className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end gap-3 p-3 sm:justify-start"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
                <RoutePanel
                    from={from}
                    to={to}
                    me={me}
                    route={route}
                    pending={pending}
                    error={error}
                    onPick={(field, place) => setters[field](place)}
                    onClearField={(field) => setters[field](null)}
                    onUseMyLocation={useMyLocation}
                    onSwap={() => {
                        setFrom(to);
                        setTo(from);
                    }}
                    onRoute={() => from && to && setRequest({ from, to })}
                    onReset={() => {
                        setFrom(null);
                        setTo(null);
                    }}
                />

                {picked && (
                    <PlaceCard
                        cords={picked}
                        place={pickedPlace}
                        canNavigate={Boolean(me)}
                        onDirections={directionsFromHere}
                        onClose={() => setPicked(null)}
                    />
                )}

                <button
                    type="button"
                    onClick={recenter}
                    disabled={!me}
                    aria-label="Centre on my location"
                    title={me ? 'Centre on my location' : 'Location unavailable'}
                    className="pointer-events-auto absolute right-3 top-24 rounded-full bg-white/95 p-2.5 text-neutral-600 shadow-[0_2px_12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-900/5 backdrop-blur transition hover:text-neutral-900 disabled:pointer-events-none disabled:opacity-40"
                >
                    <CrosshairIcon className="size-5" />
                </button>
            </div>
        </div>
    );
}

export default App
