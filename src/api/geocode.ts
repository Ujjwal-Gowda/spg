// to get the details of a place with the help of the name or it scordinates
export async function search(q: string, cords?: [number, number], signal?: AbortSignal) {
    const url = new URL(`https://photon.komoot.io/api/`)
    url.searchParams.set("q", q)
    url.searchParams.set("limit", "5")

    if (cords) {
        url.searchParams.set("lat", String(cords[0]))
        url.searchParams.set("log", String(cords[1]))
    }
    // caller's signal cancels a superseded search; the timeout still caps a slow one
    const timeout = AbortSignal.timeout(8000)
    const res = await fetch(url, {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })

    if (!res.ok) {
        throw new Error(`geocode failed : ${res.status}`)
    }
    const data = await res.json();

    console.log(data)
    return data.features.map((f: any) => ({
        name: [f.properties.name, f.properties.city, f.properties.state]
            .filter(Boolean).join(', '),
        cords: f.geometry.coordinates,
    }))
}

// To get a place with the help of longitude and latitude
export async function reverseGeocoding(lat: number, lng: number) {
    const res = await fetch(`https://photon.komoot.io/reverse/?lon=${lng}&lat=${lat}`)
    const data = await res.json()
    return data.features[0]?.properties ?? null
}
