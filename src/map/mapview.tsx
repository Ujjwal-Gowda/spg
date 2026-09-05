import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Marker, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStyle } from './mapstyle';
import { SearchBox } from '../ui/searchbox';
import type { Place } from '../api/geocode';

const FALLBACK: [number, number] = [0, 0];

export function MapView({ onReady }: { onReady?: (m: Map) => void }) {
    const [me, setMe] = useState<[number, number] | null>(null);
    const [from, setFrom] = useState<Place | null>(null);
    const [to, setTo] = useState<Place | null>(null);

    const container = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const meMarker = useRef<Marker | null>(null);
    const fromMarker = useRef<Marker | null>(null);
    const toMarker = useRef<Marker | null>(null);
    const centered = useRef(false);
    // once a place is picked the map stops chasing the gps position
    const follow = useRef(true);

    // map on the first render
    useEffect(() => {
        if (map.current || !container.current) return;

        map.current = new Map({
            container: container.current,
            style: osmStyle,
            center: FALLBACK,   // [lng, lat]
            zoom: 2,
        });

        map.current.addControl(new NavigationControl(), 'top-right');
        map.current.on('load', () => onReady?.(map.current!));
        map.current.on('error', (e) => console.error('map', e.error));

        return () => {
            map.current?.remove();
            map.current = null;
            meMarker.current = null;
            fromMarker.current = null;
            toMarker.current = null;
            centered.current = false;
        };
    }, []);

    // location retrieval
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setMe((prev) =>
                    prev && prev[0] === longitude && prev[1] === latitude
                        ? prev
                        : [longitude, latitude]
                );
            },
            (err) => console.warn('geo', err.message),
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    // marker code
    useEffect(() => {
        if (!map.current || !me) return;

        if (!meMarker.current) {
            meMarker.current = new Marker({ color: '#007AFF' })
                .setLngLat(me)
                .addTo(map.current);
        } else {
            meMarker.current.setLngLat(me);
        }

        if (!follow.current) return;

        // snap on the first relocation and then smooth follow to save on tiles
        if (centered.current) {
            map.current.easeTo({ center: me });
        } else {
            centered.current = true;
            map.current.jumpTo({ center: me, zoom: 13 });
        }
    }, [me]);

    // the picked from / to places
    useEffect(() => {
        const m = map.current;
        if (!m) return;

        for (const [place, ref, color] of [
            [from, fromMarker, '#16a34a'],
            [to, toMarker, '#dc2626'],
        ] as const) {
            if (!place) {
                ref.current?.remove();
                ref.current = null;
            } else if (ref.current) {
                ref.current.setLngLat(place.cords);
            } else {
                ref.current = new Marker({ color }).setLngLat(place.cords).addTo(m);
            }
        }

        if (from && to) {
            m.fitBounds(new LngLatBounds(from.cords, to.cords), { padding: 120, maxZoom: 15 });
        } else if (from || to) {
            m.flyTo({ center: (from ?? to)!.cords, zoom: 14 });
        }
    }, [from, to]);

    function pin(setter: (p: Place | null) => void) {
        return (place: Place) => {
            follow.current = false;
            setter(place);
        };
    }

    return (
        <>
            {/* maplibre-gl.css forces position:relative on this div (it wins over
                tailwind's layered utilities), so size it instead of absolute-inset it */}
            <div ref={container} className="h-full w-full" />

            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
                <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-xl backdrop-blur">
                    <SearchBox
                        placeholder="From"
                        near={me}
                        onSelect={pin(setFrom)}
                        onClear={() => setFrom(null)}
                    />
                    <SearchBox
                        placeholder="To"
                        near={me}
                        onSelect={pin(setTo)}
                        onClear={() => setTo(null)}
                    />
                </div>
            </div>
        </>
    );
}
