import { LngLatBounds } from 'maplibre-gl';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import type { LineString } from 'geojson';
import type { LngLat } from '../api/route';

const SOURCE = 'route';
const CASING_LAYER = 'route-casing';
const LINE_LAYER = 'route-line';

export function drawRoute(map: Map, line: LineString | null) {
    const data = line
        ? { type: 'Feature' as const, properties: {}, geometry: line }
        : { type: 'FeatureCollection' as const, features: [] };

    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    if (source) {
        source.setData(data);
        return;
    }

    if (!line) return;

    map.addSource(SOURCE, { type: 'geojson', data });

    map.addLayer({
        id: CASING_LAYER,
        type: 'line',
        source: SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#1e3a8a', 'line-width': 9 },
    });
    map.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 5 },
    });
}

export function boundsOf(points: LngLat[]): LngLatBounds {
    return points.reduce((bounds, point) => bounds.extend(point), new LngLatBounds());
}
