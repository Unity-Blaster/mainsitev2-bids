import { type NextRequest, NextResponse } from 'next/server';

// The target URL for the external API.
const EXTERNAL_API_URL = 'https://bidplus.gem.gov.in/search-bids';
// The CSRF token found in the original request payload.
const CSRF_TOKEN = '341a0cd222a0eacceb68eaa4e2887aac';

// --- REQUEST INTERFACE ---
/**
 * Defines the structure for the search parameters sent from your Next.js client.
 */
interface SearchParameters {
  searchType: string;
  ministry: string;
  buyerState: string;
  organization: string;
  department: string;
  bidEndFromMin: string;
  bidEndToMin: string;
  page: number;
}

// --- RESPONSE INTERFACES ---
/**
 * Defines the structure for a single bid document in the response array.
 * (Only includes a few key fields for brevity)
 */
interface BidDocument {
  id: string;
  b_bid_number: string[];
  b_category_name: string[];
  final_end_date_sort: string[];
  ba_official_details_minName: string[];
}

/**
 * Defines the inner response object containing the documents array and metadata.
 */
interface InnerResponse {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: BidDocument[];
}

/**
 * Defines the top-level structure of the response from the external API.
 */
interface BidResponse {
  status: number;
  code: number;
  message: string;
  response: {
    response: InnerResponse;
  };
  current_page: number;
}


export async function POST(req: NextRequest) {
  try {
    // 1. Read the JSON body sent from the Next.js client
    // FIX 1: Type assertion to resolve unsafe 'any' assignment warning on request body.
    const searchParams = (await req.json()) as SearchParameters;

    // 2. Construct the URL-encoded payload required by the external API
    const jsonString = JSON.stringify(searchParams);
    const encodedJsonString = encodeURIComponent(jsonString);
    const externalRequestBody = `payload=${encodedJsonString}&csrf_bd_gem_nk=${CSRF_TOKEN}`;

    // 3. Set the necessary headers to mimic the original browser request
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/122.0.0.0',
      'Origin': 'https://bidplus.gem.gov.in',
      'Referer': 'https://bidplus.gem.gov.in/advance-search',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      // FIX 403 ERROR: Adding the full Cookie string is necessary to bypass security checks.
      // WARNING: This is highly unstable as these tokens expire quickly.
      'Cookie': 'themeOption=0; TS01dc9e29=01e393167df3e3c0e6ad8d16ee707e9aa4ef062707eef0e3001f6f44cd0250c0a0349be290e0f907b6bc457cdbe83b785e5fbb047ee0159449e74f714f958e4d72ff5533c1; GeM=1474969956.20480.0000; _ga=GA1.3.1621276125.1761280079; _gid=GA1.3.636807168.1761280079; ci_session=57c53bd88419aaa6cbcae894e999ebf4f827ca1a; csrf_gem_cookie=341a0cd222a0eacceb68eaa4e2887aac; TS0174a79d=01e393167df7b0f6acd2ecc5139c5d9f815b61d8321f0127de80522966d813212daa0288f47d6944a9252a7839e38b3287857fd30781b2f2cb19f38c4385e0ad2b682b9fec8edd9758570c06a006ae21e4f8c37c0e25986d9b6099614f4721f93466ef40ab',
    };

    // 4. Make the external fetch request
    const externalResponse = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: headers,
      body: externalRequestBody,
      cache: 'no-store'
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      return NextResponse.json(
        { message: 'External API request failed', error: errorText },
        { status: externalResponse.status }
      );
    }

    // 5. Get the JSON data from the external response and return it to the client
    // FIX 2: Type assertion to resolve unsafe 'any' assignment warning on response body.
    const data = (await externalResponse.json()) as BidResponse;
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { message: 'Internal server error processing request' },
      { status: 500 }
    );
  }
}