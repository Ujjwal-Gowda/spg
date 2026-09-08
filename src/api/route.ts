
type LngLat = [number, number];
export async function Routing(from: LngLat, to: LngLat) {
    const coords = `${from[0]},${from[1]};${to[0]},${to[1]}`;
    const result = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}` +
        `?overview=full&geometries=geojson&steps=true`)
    const data = await result.json()

    if (data.code != "Ok") { throw new Error(data.message ?? " no route found ") }
    const r = data.routes[0]
    return {
        geometry: r.geometry,
        distance: r.distance / 1000,
        duration: r.duration / 60,
        steps: r.legs[0].steps,
    };
}
