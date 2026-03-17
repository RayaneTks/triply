import { NextResponse } from 'next/server';

const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

async function getAmadeusToken(): Promise<string> {
    const clientId = (process.env.AMADEUS_CLIENT_ID || '').trim();
    const clientSecret = (process.env.AMADEUS_CLIENT_SECRET || '').trim();
    if (!clientId || !clientSecret) {
        throw new Error('AMADEUS_CLIENT_ID et AMADEUS_CLIENT_SECRET requis');
    }

    const authResponse = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
        }).toString(),
    });

    const authData = await authResponse.json();
    if (!authResponse.ok || !authData.access_token) {
        console.error('Amadeus auth error:', authData);
        throw new Error(authData.error_description || 'Échec auth Amadeus');
    }
    return authData.access_token;
}

function normalizeLocation(loc: Record<string, unknown>): Record<string, unknown> {
    const address = (loc.address as Record<string, unknown>) || {};
    const cityName = (address.cityName as string) || (loc.cityName as string) || (loc.name as string);
    const countryName = (address.countryName as string) || (loc.countryName as string) || '';

    return {
        id: loc.id || loc.iataCode || 'unknown',
        name: loc.name || cityName,
        iataCode: loc.iataCode || '',
        subType: loc.subType || 'CITY',
        address: { cityName, countryName },
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword')?.trim();

    if (!keyword || keyword.length < 2) {
        return NextResponse.json([]);
    }

    try {
        const accessToken = await getAmadeusToken();
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'places/route.ts:auth',message:'Auth OK',data:{keyword,hasToken:!!accessToken},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        const url = `${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(keyword)}&page[limit]=10&view=FULL`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        });

        const data = await response.json();
        const raw = data.data || [];
        const firstLoc = raw[0] as Record<string, unknown> | undefined;

        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'places/route.ts:amadeus',message:'Amadeus response',data:{ok:response.ok,status:response.status,rawCount:raw.length,hasErrors:!!data.errors,firstLocKeys:firstLoc?Object.keys(firstLoc):[],firstIata:firstLoc?.iataCode??firstLoc?.iata_code},hypothesisId:'B,C',timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        if (!response.ok) {
            console.error('Amadeus locations error:', data);
            return NextResponse.json([]);
        }

        const normalized = raw.map((loc: Record<string, unknown>) => normalizeLocation(loc));

        return NextResponse.json(normalized);
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'places/route.ts:catch',message:'API error',data:{error:String(error)},hypothesisId:'B',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.error('Erreur API Places:', error);
        return NextResponse.json([], { status: 500 });
    }
}