import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Map, NavigationControl, ScaleControl } from 'maplibre-gl';
import './maplibre';
import { osmStyle } from './mapstyle';
import type { LngLat } from '../api/route';

const FALLBACK: LngLat = [0, 20];

export function useMapInstance(container: RefObject<HTMLDivElement | null>, onReady?: (map: Map) => void) {
    const map = useRef<Map | null>(null);
    const [ready, setReady] = useState(false);

    const readyCallback = useRef(onReady);
    readyCallback.current = onReady;

    useEffect(() => {
        if (map.current || !container.current) return;

        const instance = new Map({
            container: container.current,
            style: osmStyle,
            center: FALLBACK,
            zoom: 2,
            renderWorldCopies: false,
            attributionControl: { compact: true },
        });
        map.current = instance;

        instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
        instance.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
        instance.on('error', (e) => console.error('map', e.error));
        instance.on('load', () => {
            setReady(true);
            readyCallback.current?.(instance);
        });

        return () => {
            instance.remove();
            map.current = null;
            setReady(false);
        };
    }, [container]);

    return { map, ready };
}
