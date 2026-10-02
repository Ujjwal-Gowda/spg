const DEV_DEFAULTS = import.meta.env.DEV
    ? {
        tile: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        routing: 'https://router.project-osrm.org/route/v1/driving',
        geocoder: 'https://photon.komoot.io',
    }
    : null;

function endpoint(value: string | undefined, key: keyof NonNullable<typeof DEV_DEFAULTS>, name: string): string {
    if (value) return value;
    if (DEV_DEFAULTS) return DEV_DEFAULTS[key];
    throw new Error(
        `${name} is not set. Copy .env.example to .env and point it at your own ` +
        `tile/routing/geocoding provider before building — the public demo servers ` +
        `are not licensed for distributed apps.`
    );
}

export const TILE_URL = endpoint(import.meta.env.VITE_TILE_URL, 'tile', 'VITE_TILE_URL');
export const ROUTING_URL = endpoint(import.meta.env.VITE_ROUTING_URL, 'routing', 'VITE_ROUTING_URL');
export const GEOCODER_URL = endpoint(import.meta.env.VITE_GEOCODER_URL, 'geocoder', 'VITE_GEOCODER_URL');

/** ODbL requires the data credit to stay visible whatever the tile source is. */
export const TILE_ATTRIBUTION =
    import.meta.env.VITE_TILE_ATTRIBUTION ??
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

