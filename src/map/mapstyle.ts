import type { StyleSpecification } from 'maplibre-gl';
import { TILE_URL, TILE_ATTRIBUTION } from '../config';

export const osmStyle: StyleSpecification = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256,
            attribution: TILE_ATTRIBUTION,
        },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};
