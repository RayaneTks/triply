/** URL Amadeus : doit correspondre au type de clés (test vs prod) dans le portail développeur. */
export function getAmadeusBaseUrl(): string {
    const raw = (process.env.AMADEUS_API_BASE_URL || 'https://test.api.amadeus.com').trim().replace(/\/$/, '');
    return raw || 'https://test.api.amadeus.com';
}
