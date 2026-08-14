import './App.css'
import { MapView } from './map/mapview'
import { useRef } from 'react';
import { Map } from 'maplibre-gl';
function App() {
    const mapRef = useRef<Map | null>(null);

    return (
        <div style={{ position: 'relative', height: '100vh' }}>

            <h1>Maps</h1>
            <MapView
                onReady={(map) => {
                    mapRef.current = map;
                    console.log('Map is ready!', map);
                }}
            />
        </div>
    );
}

export default App
