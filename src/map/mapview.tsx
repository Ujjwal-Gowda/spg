import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Marker } from 'maplibre-gl';
import type { Map, MapMouseEvent, PaddingOptions } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapInstance } from './usemapinstance';
import { boundsOf, drawRoute } from './routelayer';
import type { Place } from '../api/geocode';
import type { LngLat, Route } from '../api/route';

type Props = {
    me: LngLat | null
    from: Place | null
    to: Place | null
    picked: LngLat | null
    route: Route | null
    onPick: (cords: LngLat) => void
    onReady?: (map: Map) => void
}

const WIDE = 640;

function framePadding(map: Map): PaddingOptions {
    const { clientWidth, clientHeight } = map.getContainer();
    const wide = clientWidth >= WIDE;

    const padding = wide
        ? { top: 64, right: 56, bottom: 56, left: 400 }
        : { top: 88, right: 40, bottom: 248, left: 40 };

    const fits = padding.left + padding.right < clientWidth && padding.top + padding.bottom < clientHeight;
    return fits ? padding : { top: 24, right: 24, bottom: 24, left: 24 };
}

export function MapView({ me, from, to, picked, route, onPick, onReady }: Props) {
    const container = useRef<HTMLDivElement>(null);
    const { map, ready } = useMapInstance(container, onReady);

    const meMarker = useRef<Marker | null>(null);
    const fromMarker = useRef<Marker | null>(null);
    const toMarker = useRef<Marker | null>(null);
    const pickedMarker = useRef<Marker | null>(null);
    const located = useRef(false);

    const pick = useRef(onPick);
    pick.current = onPick;

    useEffect(() => {
        const m = map.current;
        if (!ready || !m || !me) return;

        if (meMarker.current) meMarker.current.setLngLat(me);
        else meMarker.current = new Marker({ color: '#2563eb', scale: 0.7 }).setLngLat(me).addTo(m);

        if (!located.current) {
            located.current = true;
            if (!from && !to) m.jumpTo({ center: me, zoom: 13 });
        }
    }, [map, ready, me, from, to]);

    useEffect(() => {
        const m = map.current;
        if (!ready || !m) return;

        const pins: [LngLat | null, RefObject<Marker | null>, string][] = [
            [from?.cords ?? null, fromMarker, '#059669'],
            [to?.cords ?? null, toMarker, '#dc2626'],
            [picked, pickedMarker, '#404040'],
        ];

        for (const [cords, marker, color] of pins) {
            if (!cords) {
                marker.current?.remove();
                marker.current = null;
            } else if (marker.current) {
                marker.current.setLngLat(cords);
            } else {
                marker.current = new Marker({ color }).setLngLat(cords).addTo(m);
            }
        }
    }, [map, ready, from, to, picked]);

    useEffect(() => {
        const m = map.current;
        if (!ready || !m) return;

        drawRoute(m, route?.geometry ?? null);
        if (route) m.fitBounds(boundsOf(route.geometry.coordinates as LngLat[]), { padding: framePadding(m) });
    }, [map, ready, route]);

    useEffect(() => {
        const m = map.current;
        if (!ready || !m || route) return;

        if (from && to) m.fitBounds(boundsOf([from.cords, to.cords]), { padding: framePadding(m) });
        else if (from || to) m.flyTo({ center: (from ?? to)!.cords, zoom: 14 });
    }, [map, ready, from, to, route]);

    useEffect(() => {
        const m = map.current;
        if (!ready || !m) return;

        const handleClick = (e: MapMouseEvent) => pick.current([e.lngLat.lng, e.lngLat.lat]);

        m.on('click', handleClick);
        return () => {
            m.off('click', handleClick);
        };
    }, [map, ready]);

    return <div ref={container} className="h-full w-full" />;
}
