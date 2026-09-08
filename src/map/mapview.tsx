import { useEffect, useRef, useState } from 'react';
import { Map, GeoJSONSource, NavigationControl, Marker, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStyle } from './mapstyle';
import { SearchBox } from '../ui/searchbox';
import type { Place } from '../api/geocode';
import { Routing } from '../api/route';

setWorkerUrl(maplibreWorkerUrl);

const FALLBACK: [number, number] = [0, 0];

export function MapView({ onReady }: { onReady?: (m: Map) => void }) {
    const [me, setMe] = useState<[number, number] | null>(null);
    const [from, setFrom] = useState<Place | null>(null);
    const [to, setTo] = useState<Place | null>(null);
    const [styleReady, setStyleReady] = useState(false);

    const container = useRef<HTMLDivElement>(null);
    const map = useRef<Map | null>(null);
    const meMarker = useRef<Marker | null>(null);
    const fromMarker = useRef<Marker | null>(null);
    const toMarker = useRef<Marker | null>(null);
    const centered = useRef(false);
    const follow = useRef(true);
    const swapping = useRef(false);

    useEffect(() => {
        if (map.current || !container.current) return;

        map.current = new Map({
            container: container.current,
            style: osmStyle,
            center: FALLBACK,   // [lng, lat]
            zoom: 2,
            renderWorldCopies: false
        });

        map.current.addControl(new NavigationControl(), 'top-right');
        map.current.on('load', () => {
            setStyleReady(true);
            onReady?.(map.current!);
        });
        map.current.on('error', (e) => console.error('map', e.error));

        return () => {
            map.current?.remove();
            map.current = null;
            meMarker.current = null;
            fromMarker.current = null;
            toMarker.current = null;
            centered.current = false;
        };
    }, []);

    // location retrieval
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {

                const { latitude, longitude, accuracy } = pos.coords;


                console.log({
                    latitude,
                    longitude,
                    accuracy,
                    accuracyKm: accuracy / 1000,
                });
                if (accuracy > 1000) {
                    console.warn(`Ignoring inaccurate location: ${accuracy}m`);
                    return;
                }

                setMe((prev) =>
                    prev && prev[0] === longitude && prev[1] === latitude
                        ? prev
                        : [longitude, latitude]
                );
            },
            (err) => console.warn('geo', err.message),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 30000,
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    // marker code
    useEffect(() => {
        if (!map.current || !me) return;

        if (!meMarker.current) {
            meMarker.current = new Marker({ color: '#007AFF' })
                .setLngLat(me)
                .addTo(map.current);
        } else {
            meMarker.current.setLngLat(me);
        }

        if (!follow.current) return;

        // snap on the first relocation and then smooth follow to save on tiles
        if (centered.current) {
            map.current.easeTo({ center: me });
        } else {
            centered.current = true;
            map.current.jumpTo({ center: me, zoom: 13 });
        }
    }, [me]);

    // the picked from / to places
    useEffect(() => {
        const m = map.current;
        if (!m) return;

        for (const [place, ref, color] of [
            [from, fromMarker, '#16a34a'],
            [to, toMarker, '#dc2626'],
        ] as const) {
            if (!place) {
                ref.current?.remove();
                ref.current = null;
            } else if (ref.current) {
                ref.current.setLngLat(place.cords);
            } else {
                ref.current = new Marker({ color }).setLngLat(place.cords).addTo(m);
            }
        }
        if (swapping.current) {
            swapping.current = false;
            return;
        }

        if (from && to) {
            m.fitBounds(
                new LngLatBounds().extend(from.cords).extend(to.cords),
                { padding: 120 }
            );
        } else if (from || to) {
            m.flyTo({
                center: (from ?? to)!.cords,
                zoom: 14
            });
        }
    }, [from, to]);

    function pin(setter: (p: Place | null) => void) {
        return (place: Place) => {
            follow.current = false;
            setter(place);
        };
    }
    const handleSwap = () => {
        // alert("location swapped");
        if (!from || !to) {
            console.warn("Both fields are required to swap positions.");
            return;
        }
        swapping.current = true;
        const temp = from;
        setFrom(to)
        setTo(temp)
        console.log("from =", from, "to =", to)
    };

    // useEffect(() => {
    //     const response = async () => {
    //         try {
    //             if (!from || !to) {
    //                 console.warn("Both fields are required to swap positions.");
    //                 return;
    //             }
    //             const result = await Routing(from.cords, to.cords)
    //             return result
    //         } catch (error) {
    //             console.error("Failed to fetch:", error);
    //         }
    //         const route = await response()
    //         if (map.current?.getSource('route')) {
    //             map.current?.setData({ data: route.geometry })
    //         } else {

    //             if (!map.current) return
    //             map.current.addSource('route', {
    //                 'type': 'geojson',
    //                 'data': route.geometry
    //             });
    //             map.current.addLayer({
    //                 'id': 'route',
    //                 'type': 'line',
    //                 'source': 'route',
    //             });
    //         }

    //     }
    // }, [from, to])
    //
    useEffect(() => {
        const m = map.current;
        if (!m || !styleReady) return;

        const source = () => m.getSource('route') as GeoJSONSource | undefined;

        if (!from || !to) {
            // drop a stale line when either end is cleared
            source()?.setData({ type: 'FeatureCollection', features: [] });
            return;
        }

        let cancelled = false;

        const fetchRoute = async () => {
            try {
                const result = await Routing(from.cords, to.cords);
                if (cancelled) return;

                const routeGeoJSON = {
                    type: 'Feature' as const,
                    properties: {},
                    geometry: result.geometry,
                };

                const existing = source();
                if (existing) {
                    existing.setData(routeGeoJSON);
                    return;
                }

                m.addSource('route', {
                    type: 'geojson',
                    data: routeGeoJSON,
                })

                m.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#2563eb',
                        'line-width': 5,
                    },
                });
            } catch (error) {
                console.error('Failed to fetch route:', error);
            }
        };

        fetchRoute();

        return () => {
            cancelled = true;
        };
    }, [from, to, styleReady]);


    return (
        <>
            {/* maplibre-gl.css forces position:relative on this div (it wins over
                tailwind's layered utilities), so size it instead of absolute-inset it */}
            <div ref={container} className="h-full w-full" />

            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
                <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-xl backdrop-blur">
                    <SearchBox
                        placeholder="From"
                        value={from?.name || ''}
                        near={me}
                        onSelect={pin(setFrom)}
                        onClear={() => setFrom(null)}
                    />

                    <button type='button' onClick={handleSwap} className=' text-black w-1/4 h-1/2 mx-auto'>swap</button>

                    <SearchBox
                        placeholder="To"
                        value={to?.name || ''}
                        near={me}
                        onSelect={pin(setTo)}
                        onClear={() => setTo(null)}
                    />
                </div>
            </div>
        </>
    );
}
