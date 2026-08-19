import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStyle } from './mapstyle';
import { search } from '../api/geocode';

const FALLBACK: [number, number] = [0, 0];

// holds off on returning the new value until `delay` ms pass with no further changes
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// location retrival code
export function MapView({ onReady }: { onReady?: (m: Map) => void }) {
    const [Me, setMe] = useState<[number, number] | null>(null);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                console.log(pos.coords)
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

    const markerRef = useRef<Marker | null>(null);
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const centered = useRef(false);


    // map on the first render
    useEffect(() => {
        if (map.current || !container.current) return;

        map.current = new Map({
            container: container.current,
            style: osmStyle,
            center: FALLBACK,   // [lng, lat]  dont mess this up again
            zoom: 12,
        });

        map.current.addControl(new NavigationControl(), 'top-right');
        map.current.on('load', () => onReady?.(map.current!));
        map.current.on('error', (e) => console.error('map', e.error));

        return () => {
            map.current?.remove();
            map.current = null;
            markerRef.current = null;
            centered.current = false;
        };

    }, []);

    // marker code
    useEffect(() => {
        if (!map.current || !Me) return;

        if (!markerRef.current) {
            markerRef.current = new Marker({
                color: '#007AFF',
            })
                .setLngLat(Me)
                .addTo(map.current);
        } else {
            markerRef.current.setLngLat(Me);
        }

        // snap on the first relocation and then smooth follow to save on tiles
        if (centered.current) {
            map.current.easeTo({ center: Me });
        } else {
            centered.current = true;
            map.current.jumpTo({ center: Me });
        }
    }, [Me]);


    const debouncedFrom = useDebounce(from, 1000);
    useEffect(() => {
        if (!debouncedFrom) return;

        const ctrl = new AbortController();
        search(debouncedFrom, undefined, ctrl.signal)
            .then((results) => console.log('from', debouncedFrom, results))
            .catch((err) => {
                // the cleanup below aborts a search the next keystroke superseded
                if (err.name !== 'AbortError') console.warn('geocode from', err);
            });

        return () => ctrl.abort();
    }, [debouncedFrom]);

    const debouncedTo = useDebounce(to, 1000);
    useEffect(() => {
        if (!debouncedTo) return;

        const ctrl = new AbortController();
        search(debouncedTo, undefined, ctrl.signal)
            .then((results) => console.log('to', debouncedTo, results))
            .catch((err) => {
                if (err.name !== 'AbortError') console.warn('geocode to', err);
            });

        return () => ctrl.abort();
    }, [debouncedTo]);


    return <>

        <input type="text" value={from} placeholder='from' onChange={(e) => setFrom(e.target.value)} />
        <input type="text" value={to} placeholder='to' onChange={(e) => setTo(e.target.value)} />
        <div ref={container} className="absolute inset-0" />

    </>
}
