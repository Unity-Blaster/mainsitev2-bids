"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Interface definitions matching your route.ts for strict typing
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
  rows: number; // Number of results per page (now fixed at 10 for multi-page fetching)
}

interface BidDocument {
  id: string;
  b_bid_number: string[];
  b_category_name: string[];
  final_start_date_sort: string[];
  final_end_date_sort: string[];
  ba_official_details_minName: string[];
}

interface InnerResponse {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: BidDocument[];
}

interface BidResponse {
  status: number;
  code: number;
  message: string;
  response: {
    response: InnerResponse;
  };
  current_page: number;
}

interface ApiErrorData {
    message?: string;
    error?: string;
    [key: string]: unknown;
}

// The assumed hard limit the external API returns per page
const RESULTS_PER_PAGE = 10;

// Default number of rows (will be overridden by slider, but used for initial state)
const DEFAULT_ROWS = RESULTS_PER_PAGE;

// Default search query payload
const DEFAULT_SEARCH_PARAMS: SearchParameters = {
    searchType: "ministry-search",
    ministry: "Ministry of Steel",
    buyerState: "",
    organization: "Rourkela Steel Plant",
    department: "Steel Authority of India Limited",
    bidEndFromMin: "",
    bidEndToMin: "",
    page: 1, // Will be incremented in the loop
    rows: RESULTS_PER_PAGE, // Fixed to 10 for multi-page requests
};

// Main application component
const App: React.FC = () => {
    const [bids, setBids] = useState<BidDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // sliderValue represents the number of rows to fetch (10, 20, ..., 100)
    const [sliderValue, setSliderValue] = useState(DEFAULT_ROWS); 
    
    // The current number of results requested (10, 20, 30, etc.)
    const requestedResults = sliderValue;

    // Validate and set the slider state
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setSliderValue(value);
        }
    };

    // Function to fetch data from the Next.js API Route
    const fetchBids = async () => {
        setLoading(true);
        setError(null);
        setBids([]); // Clear previous results
        
        // Calculate how many pages we need to fetch
        const numPagesToFetch = requestedResults / RESULTS_PER_PAGE; 
        const allBids: BidDocument[] = [];

        try {
            for (let page = 1; page <= numPagesToFetch; page++) {
                
                // Construct search parameters for the current page
                const searchParamsForPage: SearchParameters = {
                    ...DEFAULT_SEARCH_PARAMS,
                    page: page, // Use the current page number in the loop
                    rows: RESULTS_PER_PAGE, // Always request the max per page (10)
                };
                
                const apiUrl = '/api/search-bids';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(searchParamsForPage),
                });

                if (!response.ok) {
                    let errorMessage = `HTTP error! Status: ${response.status} on page ${page}`;
                    try {
                        const errorData = await response.json() as ApiErrorData;
                        errorMessage = errorData.message ?? errorData.error ?? errorMessage;
                    } catch (e) {
                        // Ignore if response body isn't JSON
                    }
                    throw new Error(errorMessage);
                }

                const data = (await response.json()) as BidResponse;

                if (data.status === 1 && data.response?.response?.docs) {
                    allBids.push(...data.response.response.docs);
                    
                    // Break early if we didn't get a full page of results, meaning we hit the end of the search results
                    if (data.response.response.docs.length < RESULTS_PER_PAGE) {
                        break;
                    }
                } else {
                     throw new Error(data.message || `Received unexpected data structure on page ${page}.`);
                }
            }

            setBids(allBids);

        } catch (err) {
            setError(`Failed to fetch bids: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

	useEffect(() => {
        // Initial client-side fetch on load (10 results)
        fetchBids().catch((err) => {
            setError(`Failed to fetch bids: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        });
    }, []);

    return (
        // Max-width changed to 50vw as requested
        <div className="p-6 w-[80vw] mx-auto font-sans bg-gray-50 min-h-screen">
            <script async src="https://cdn.tailwindcss.com"></script>
            <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Bid Search Results</h1>
            
            {/* Slider for Results Count Selection */}
            <div className="mb-4 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <label htmlFor="result-slider" className="block text-lg font-medium text-gray-700 mb-3">
                    Results Count: <span className="text-indigo-600 font-bold">{requestedResults}</span>
                </label>
                <input
                    id="result-slider"
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={sliderValue} 
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg transition-colors duration-200"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>10 Results</span>
                    <span>500 Results</span>
                </div>
            </div>

            <button
                onClick={fetchBids}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-150 mb-4 disabled:opacity-50 flex items-center justify-center shadow-md font-semibold"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Fetching Data...' : `Fetch ${requestedResults} Bids`}
            </button>
            <div className="pb-4 text-center text-sm text-gray-500">
                Displaying {bids.length} bids (Requested: {requestedResults}).
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4">
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {!loading && bids.length === 0 && !error && (
                <div className="text-center text-gray-500 py-10 border border-gray-300 rounded-lg bg-white">
                    No bids found for the current search parameters.
                </div>
            )}

            {/* Two-column grid for results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bids.map((bid) => (
                    // Replaced div with <a> tag and added the link structure
                    <a 
                        key={bid.id} 
                        href={`https://bidplus.gem.gov.in/showbidDocument/${bid.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white p-4 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 group cursor-pointer"
                    >
						<span className="shrink-0 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
							{bid.b_bid_number[0]}
						</span>
						<h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 wrap-break-word pr-2 transition-colors duration-300">
							{bid.b_category_name[0]}
						</h2>						
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium text-gray-700">Ministry:</span> {bid.ba_official_details_minName[0]}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Starting Date:</span> {new Date(bid.final_start_date_sort[0]!).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-700">Closing Date:</span> {new Date(bid.final_end_date_sort[0]!).toLocaleDateString()}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default App;
