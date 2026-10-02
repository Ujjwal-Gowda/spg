import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import type { LngLat } from '../api/route';

// export function useGeolocation() {
//     const [position, setPosition] = useState<LngLat | null>(null);

//     useEffect(() => {
//         if (!navigator.geolocation) return;

//         const watchId = navigator.geolocation.watchPosition(
//             ({ coords }) =>
//                 setPosition((prev) =>
//                     prev && prev[0] === coords.longitude && prev[1] === coords.latitude
//                         ? prev
//                         : [coords.longitude, coords.latitude]
//                 ),
//             (err) => console.warn('geolocation', err.message),
//             { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
//         );

//         return () => navigator.geolocation.clearWatch(watchId);
//     }, []);

//     return { position };
// }
export function useGeolocation() {
    const [position, setPosition] = useState<LngLat | null>(null);

    useEffect(() => {
        let watchId: string | null = null;

        async function startTracking() {
            const status = await Geolocation.requestPermissions();
            if (status.location !== 'granted') return;

            watchId = await Geolocation.watchPosition(
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
                (pos, err) => {
                    if (err || !pos?.coords) return;
                    const { longitude, latitude } = pos.coords;
                    setPosition((prev) =>
                        prev && prev[0] === longitude && prev[1] === latitude
                            ? prev
                            : [longitude, latitude]
                    );
                }
            );
        }

        startTracking();

        return () => {
            if (watchId) Geolocation.clearWatch({ id: watchId });
        };
    }, []);

    return { position };
}
