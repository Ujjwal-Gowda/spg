export function formatDistance(metres: number): string {
    if (metres < 1000) return `${Math.round(metres)} m`;
    const km = metres / 1000;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatArrival(seconds: number): string {
    const at = new Date(Date.now() + seconds * 1000);
    return at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
