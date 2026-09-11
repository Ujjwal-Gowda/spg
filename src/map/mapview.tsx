import { useEffect, useRef } from 'react';
import { Marker } from 'maplibre-gl';
import type { Map, PaddingOptions } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapInstance } from './usemapinstance';
import { boundsOf, drawRoute } from './routelayer';
import type { Place } from '../api/geocode';
import type { LngLat, Route } from '../api/route';

type Props = {
    me: LngLat | null
    from: Place | null
    to: Place | null
    route: Route | null
    onReady?: (map: Map) => void
}

const WIDE = 640;

/** Keeps framed geometry clear of the panel: docked left on desktop, along the bottom on a phone. */
function framePadding(map: Map): PaddingOptions {
    const { clientWidth, clientHeight } = map.getContainer();
    const wide = clientWidth >= WIDE;

    // room for the marker pins, which draw upward from the point they sit on
    const padding = wide
        ? { top: 64, right: 56, bottom: 56, left: 400 }
        : { top: 88, right: 40, bottom: 248, left: 40 };

    // a box larger than the canvas has no centre to fit to
    const fits = padding.left + padding.right < clientWidth && padding.top + padding.bottom < clientHeight;
    return fits ? padding : { top: 24, right: 24, bottom: 24, left: 24 };
}

export function MapView({ me, from, to, route, onReady }: Props) {
    const container = useRef<HTMLDivElement>(null);
    const { map, ready } = useMapInstance(container, onReady);

    const meMarker = useRef<Marker | null>(null);
    const fromMarker = useRef<Marker | null>(null);
    const toMarker = useRef<Marker | null>(null);
    const located = useRef(false);

    // the user's own position: a dot that lands once, then only moves
    useEffect(() => {
        const m = map.current;
        if (!ready || !m || !me) return;

        if (meMarker.current) meMarker.current.setLngLat(me);
        else meMarker.current = new Marker({ color: '#2563eb', scale: 0.7 }).setLngLat(me).addTo(m);

        // centre on the first fix only — after that the map is the user's to move
        if (!located.current) {
            located.current = true;
            if (!from && !to) m.jumpTo({ center: me, zoom: 13 });
        }
    }, [map, ready, me, from, to]);

    // the picked endpoints
    useEffect(() => {
        const m = map.current;
        if (!ready || !m) return;

        for (const [place, marker, color] of [
            [from, fromMarker, '#059669'],
            [to, toMarker, '#dc2626'],
        ] as const) {
            if (!place) {
                marker.current?.remove();
                marker.current = null;
            } else if (marker.current) {
                marker.current.setLngLat(place.cords);
            } else {
                marker.current = new Marker({ color }).setLngLat(place.cords).addTo(m);
            }
        }
    }, [map, ready, from, to]);

    // the route owns the camera whenever there is one
    useEffect(() => {
        const m = map.current;
        if (!ready || !m) return;

        drawRoute(m, route?.geometry ?? null);
        if (route) m.fitBounds(boundsOf(route.geometry.coordinates as LngLat[]), { padding: framePadding(m) });
    }, [map, ready, route]);

    // until then, frame whatever the user has picked so far
    useEffect(() => {
        const m = map.current;
        if (!ready || !m || route) return;

        if (from && to) m.fitBounds(boundsOf([from.cords, to.cords]), { padding: framePadding(m) });
        else if (from || to) m.flyTo({ center: (from ?? to)!.cords, zoom: 14 });
    }, [map, ready, from, to, route]);

    // maplibre-gl.css forces position:relative here, so size the div rather than inset it
    return <div ref={container} className="h-full w-full" />;
}
