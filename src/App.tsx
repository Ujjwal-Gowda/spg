import { MapView } from './map/mapview'
import { useRef } from 'react';
import { Map } from 'maplibre-gl';

function App() {
    const mapRef = useRef<Map | null>(null);

    return (
        <div className="relative h-full w-full overflow-hidden">
            <MapView
                onReady={(map) => {
                    mapRef.current = map;
                }}
            />
        </div>
    );
}

export default App
