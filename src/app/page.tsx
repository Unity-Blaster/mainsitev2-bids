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
  ba_official_details_deptName: string[];
  'b.b_created_by': string[];
  b_total_quantity: string[];
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

// Utility to introduce delay (required for backoff)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        
        // Configuration for retries
        const maxRetries = 3; 
        const baseDelayMs = 1000; // 1 second base delay

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
                let success = false;
                // FIX: Explicitly type lastError as Error | null to satisfy ESLint and TypeScript
                let lastError: Error | null = null;

                for (let attempt = 0; attempt < maxRetries; attempt++) {
                    try {
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
                            // Treat HTTP errors (4xx, 5xx) as temporary for retry, unless it's the last attempt
                            if (attempt === maxRetries - 1) {
                                throw new Error(errorMessage);
                            } else {
                                lastError = new Error(errorMessage);
                            }
                        } else {
                            const data = (await response.json()) as BidResponse;

                            if (data.status === 1 && data.response?.response?.docs) {
                                allBids.push(...data.response.response.docs);
                                
                                // Check if this is the last page and break if necessary
                                if (data.response.response.docs.length < RESULTS_PER_PAGE) {
                                    success = true; // Request successful
                                    break; // Break the retry loop and the page loop
                                }
                                success = true;
                                break; // Break the retry loop, continue to next page
                            } else {
                                // Treat unexpected data structure as fatal error
                                throw new Error(data.message || `Received unexpected data structure on page ${page}.`);
                            }
                        }
                    } catch (err) {
                        // Ensure we assign a proper Error object or null here
                        if (err instanceof Error) {
                            lastError = err;
                        } else if (typeof err === 'string') {
                            lastError = new Error(err);
                        } else {
                            lastError = new Error("An unknown fetch error occurred.");
                        }

                        if (attempt === maxRetries - 1) {
                            // On the last attempt, re-throw the error to exit the outer try/catch
                            throw err;
                        }
                    }

                    if (!success) {
                        // Exponential backoff: 1s, 2s, 4s...
                        const waitTime = baseDelayMs * Math.pow(2, attempt);
                        console.log(`Retrying fetch for page ${page} in ${waitTime}ms... (Attempt ${attempt + 1} of ${maxRetries})`);
                        await delay(waitTime);
                    }
                } // End of retry loop
                
                if (!success && lastError) {
                    throw lastError; // Propagate error if all retries failed for a page
                } else if (!success) {
                    // This handles the case where the bid list might be shorter than requested
                    break;
                }

            } // End of page loop

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
        <div className="p-6 min-[1400]:w-[80vw] max-w-full mx-auto font-sans bg-white min-h-screen">
            <script async src="https://cdn.tailwindcss.com"></script>
            <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Bid Search Results</h1>
            
            {/* Slider for Results Count Selection */}
            <div className="mb-4 bg-gray-50 p-4 rounded-xl shadow-lg border border-gray-200">
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
                        className="block bg-gray-50 p-4 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-indigo-500 transition-all duration-300 group cursor-pointer"
                    >
						<div className="text-sm text-gray-600 mb-1 grid grid-cols-1 md:grid-cols-2 gap-2">
							<h2 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 wrap-break-word pr-2 transition-colors duration-300 col-span-2">
								{bid.b_category_name[0]}
							</h2>
                            <p className="font-medium text-gray-700">Ministry: <span className="text-gray-600 font-light">{bid.ba_official_details_minName[0]}</span></p>
							<p className="font-medium text-gray-700">Department: <span className="text-gray-600 font-light">{bid.ba_official_details_deptName[0]}</span></p>
                            <p className="font-medium text-gray-700">Starting Date: <span className="text-gray-600 font-light">{new Date(bid.final_start_date_sort[0]!).toLocaleDateString()}</span></p>
                            <p className="font-medium text-gray-700">Closing Date: <span className="text-gray-600 font-light">{new Date(bid.final_end_date_sort[0]!).toLocaleDateString()}</span></p>
							<p className="font-medium text-gray-700">Created By: <span className="text-gray-600 font-light">{bid['b.b_created_by'][0]}</span></p>
							<p className="font-medium text-gray-700">Total Quantity: <span className="text-gray-600 font-light">{bid.b_total_quantity[0]}</span></p>
							<span className="shrink-0 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full col-span-2 flex items-center justify-center">
								Bid Number: {bid.b_bid_number[0]}
							</span>
						</div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default App;
