import { useEffect, useState } from 'react';
import type { LngLat } from '../api/route';

export function useGeolocation() {
    const [position, setPosition] = useState<LngLat | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            ({ coords }) =>
                setPosition((prev) =>
                    prev && prev[0] === coords.longitude && prev[1] === coords.latitude
                        ? prev
                        : [coords.longitude, coords.latitude]
                ),
            (err) => console.warn('geolocation', err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { position };
}
