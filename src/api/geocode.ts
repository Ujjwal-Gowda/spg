import type { LngLat } from './route';
import { GEOCODER_URL } from '../config';

export type Place = {
    name: string;
    address?: string;
    cords: LngLat;
    category?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
};

type PhotonFeature = {
    properties: Record<string, string | undefined>
    geometry: { coordinates: LngLat }
}

function join(parts: (string | undefined)[]): string {
    const out: string[] = [];
    for (const part of parts) if (part && !out.includes(part)) out.push(part);
    return out.join(', ');
}

function toPlace(feature: PhotonFeature): Place {
    const p = feature.properties;
    const street = p.housenumber && p.street ? `${p.housenumber} ${p.street}` : (p.street ?? p.housenumber);

    const name = p.name || street || p.locality || p.district || p.city || p.county || p.state || p.country || 'Dropped pin';
    const address = join(
        [street, p.district, p.locality, p.city, p.county, p.state, p.postcode, p.country].filter((v) => v !== name)
    );

    return {
        name,
        address,
        cords: feature.geometry.coordinates,
        category: p.osm_value ?? p.osm_key,
        housenumber: p.housenumber,
        street: p.street,
        district: p.district,
        locality: p.locality,
        city: p.city,
        county: p.county,
        state: p.state,
        postcode: p.postcode,
        country: p.country,
    };
}

function signalFor(signal?: AbortSignal, ms = 8000) {
    const timeout = AbortSignal.timeout(ms);
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export async function search(q: string, near?: LngLat, signal?: AbortSignal): Promise<Place[]> {
    const url = new URL(`${GEOCODER_URL}/api/`);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '5');

    if (near) {
        url.searchParams.set('lon', String(near[0]));
        url.searchParams.set('lat', String(near[1]));
    }

    const res = await fetch(url, { signal: signalFor(signal) });
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

    const data = await res.json();
    return (data.features as PhotonFeature[]).map(toPlace);
}

export async function reverseGeocode(cords: LngLat, signal?: AbortSignal): Promise<Place | null> {
    const url = new URL(`${GEOCODER_URL}/reverse/`);
    url.searchParams.set('lon', String(cords[0]));
    url.searchParams.set('lat', String(cords[1]));

    const res = await fetch(url, { signal: signalFor(signal) });
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data.features?.[0] as PhotonFeature | undefined;
    if (!feature) return null;

    return { ...toPlace(feature), cords };
}
