import type { LineString } from 'geojson';

export type LngLat = [number, number];

export type Route = {
    geometry: LineString;
    distance: number;  //meteres
    duration: number;   //seconds
};

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

export async function fetchRoute(from: LngLat, to: LngLat, signal?: AbortSignal): Promise<Route> {
    const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
    const url = `${OSRM}/${coords}?overview=full&geometries=geojson`;

    const timeout = AbortSignal.timeout(15000);
    const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });

    if (!res.ok) throw new Error(`Routing failed (${res.status})`);

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error(data.message ?? 'No route between these places.');
    }

    const [route] = data.routes;
    return {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
    };
}
