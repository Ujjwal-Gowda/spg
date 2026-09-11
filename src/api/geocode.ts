import type { LngLat } from './route';

export type Place = {
    name: string
    cords: LngLat // [lng, lat]
}

type PhotonFeature = {
    properties: Record<string, string | undefined>
    geometry: { coordinates: LngLat }
}

const PHOTON = 'https://photon.komoot.io';

function label(props: PhotonFeature['properties']): string {
    return [props.name, props.city ?? props.county, props.state, props.country]
        .filter(Boolean)
        .join(', ');
}

export async function search(q: string, near?: LngLat, signal?: AbortSignal): Promise<Place[]> {
    const url = new URL(`${PHOTON}/api/`);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '5');

    if (near) {
        url.searchParams.set('lon', String(near[0]));
        url.searchParams.set('lat', String(near[1]));
    }

    const timeout = AbortSignal.timeout(8000);
    const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });

    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

    const data = await res.json();
    return (data.features as PhotonFeature[])
        .map((f) => ({ name: label(f.properties), cords: f.geometry.coordinates }))
        .filter((p) => p.name);
}

export async function reverseGeocode(cords: LngLat, signal?: AbortSignal): Promise<Place | null> {
    const url = new URL(`${PHOTON}/reverse/`);
    url.searchParams.set('lon', String(cords[0]));
    url.searchParams.set('lat', String(cords[1]));

    const timeout = AbortSignal.timeout(8000);
    const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });

    if (!res.ok) return null;

    const data = await res.json();
    const name = data.features?.[0] ? label(data.features[0].properties) : '';
    return name ? { name, cords } : null;
}
