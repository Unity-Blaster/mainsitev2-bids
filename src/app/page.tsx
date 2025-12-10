"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Github } from 'lucide-react';
import { midChipSkeleton, topLeftChipSkeleton, topRightChipSkeleton, bottomChipSkeleton} from '~/app/_components/chipSkeleton';
import { mainHeader, midChip, topLeftChip, topRightChip, bottomChip } from '~/app/_components/chips';

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
  b_id: string[];
  b_id_parent: string[];
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

const BOKARO_SEARCH_PARAMS: SearchParameters = {
    searchType: "ministry-search",
    ministry: "Ministry of Steel",
    buyerState: "",
    organization: "Bokaro Steel Plant",
    department: "Steel Authority of India Limited",
    bidEndFromMin: "",
    bidEndToMin: "",
    page: 1, // Will be incremented in the loop
    rows: RESULTS_PER_PAGE, // Fixed to 10 for multi-page requests
};

// Main application component
export default function App() {
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
    const fetchBids = async (RSP: boolean) => {
        setBids([]); // Clear previous results
        setLoading(true);
        setError(null);
        
        // Configuration for retries
        const maxRetries = 3; 
        const baseDelayMs = 1000; // 1 second base delay

        // Calculate how many pages we need to fetch
        const numPagesToFetch = requestedResults / RESULTS_PER_PAGE; 
        const allBids: BidDocument[] = [];

        try {
            for (let page = 1; page <= numPagesToFetch; page++) {
                
				const apiUrl = '/api/search-bids';
				let success = false;
				// FIX: Explicitly type lastError as Error | null to satisfy ESLint and TypeScript
				let lastError: Error | null = null;
	
				if (RSP === true) {
					// Construct search parameters for the current page
					const searchParamsForPage: SearchParameters = {
						...DEFAULT_SEARCH_PARAMS,
						page: page, // Use the current page number in the loop
						rows: RESULTS_PER_PAGE, // Always request the max per page (10)
					};	
					
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
								if (response.status === 504) {
									errorMessage = 'Error, possibly GeM is down or in maintainence';
								} else {
									try {
										const errorData = await response.json() as ApiErrorData;
										errorMessage = errorData.message ?? errorData.error ?? errorMessage;
									} catch (e) {
										// Ignore if response body isn't JSON
									}
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
				
				} else {
					// Construct search parameters for the current page
					const searchParamsForPage: SearchParameters = {
						...BOKARO_SEARCH_PARAMS,
						page: page, // Use the current page number in the loop
						rows: RESULTS_PER_PAGE, // Always request the max per page (10)
					};		
					
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
								if (response.status === 504) {
									errorMessage = 'Error, possibly GeM is down or in maintainence';
								} else {
									try {
										const errorData = await response.json() as ApiErrorData;
										errorMessage = errorData.message ?? errorData.error ?? errorMessage;
									} catch (e) {
										// Ignore if response body isn't JSON
									}
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

	const fetchBidsBSP = async () => {
		setBids([]);
		fetchBids(false).catch((err) => {
			setError(`Failed to fetch bids: ${err instanceof Error ? err.message : 'Unknown error'}`);
			console.error(err);
		});
	};

	const fetchBidsRSP = async () => {
		setBids([]);
		fetchBids(true).catch((err) => {
			setError(`Failed to fetch bids: ${err instanceof Error ? err.message : 'Unknown error'}`);
			console.error(err);
		});
	};

    const year = new Date().getFullYear();

	useEffect(() => {
        // Initial client-side fetch on load (10 results)
        fetchBids(true).catch((err) => {
            setError(`Failed to fetch bids: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        });
    }, []);

    return (
        // Max-width changed to 50vw as requested
        <div className="p-6 min-[1650]:w-[1400] max-w-full mx-auto font-sans bg-white dark:bg-gray-950 min-h-screen">
            <script async src="https://cdn.tailwindcss.com"></script>
            <h1 className="text-3xl font-bold text-center text-indigo-700 dark:text-indigo-400">GeM Ongoing Bids Search Results</h1>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-4xl shadow-lg border border-gray-200 dark:border-gray-700 my-6">
				<div className="flex justify-between flex-col md:flex-row items-center md:items-start relative">
					<label htmlFor="result-slider" className="block text-lg font-medium text-gray-700 dark:text-gray-400 mb-2 md:mb-0">
						Results Count: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{requestedResults}</span>
					</label>
					<span className="flex justify-center items-center gap-2 absolute top-20 md:top-8 lg:top-0 w-full">

						{loading ? (
						
							<button
								disabled={loading}
								className="w-fit bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900 py-2 px-4 rounded-2xl hover:bg-indigo-700 dark:hover:bg-indigo-500 transition duration-150 disabled:opacity-50 flex items-center justify-center shadow-md font-semibold"
							>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{`Loading ${requestedResults} Bids`}
							</button>

						) : (

							<div className="flex gap-2 flex-col sm:flex-row">
								<button
									onClick={fetchBidsRSP}
									className="w-fit bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900 py-2 px-4 rounded-t-2xl rounded-b-lg sm:rounded-l-2xl sm:rounded-r-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition duration-150 disabled:opacity-50 flex items-center justify-center shadow-md font-semibold"
								>
									{`Fetch ${requestedResults} Bids from RSP`}
								</button>
								<button
									onClick={fetchBidsBSP}
									className="w-fit bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900 py-2 px-4 rounded-t-lg rounded-b-2xl sm:rounded-r-2xl sm:rounded-l-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition duration-150 disabled:opacity-50 flex items-center justify-center shadow-md font-semibold"
								>
									{`Fetch ${requestedResults} Bids from BSP`}
								</button>
							</div>

						)}

					</span>
					<div className="text-sm text-gray-500 dark:text-gray-400 my-2 md:my-0">
						Displaying {bids.length} bids (Requested: {requestedResults})
					</div>	
				</div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-28 sm:mt-16 md:mt-14 lg:mt-5">
                    <span>10 Results</span>
					<span>100</span>
					<span>200</span>
					<span>300</span>
					<span>400</span>
                    <span>500 Results</span>
                </div>
                <input
                    id="result-slider"
					name="result-slider"
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={sliderValue} 
                    onChange={handleSliderChange}
                    className="w-[94%] h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg transition-colors duration-200 mx-[3%]"
                />
            </div>

            {error && (
                <div className="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-300 text-red-700 dark:text-red-200 px-4 py-3 rounded-2xl relative mb-4">
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {!loading && bids.length === 0 && !error && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10 border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900">
                    No bids found for the current search parameters.
                </div>
            )}

            {/* Two-column grid for results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				
				{loading ? (
							
					<BidSkeleton />
					
				) : (

					bids.map((bid) => (
						<a 
							key={bid.id} 
							href={`https://bidplus.gem.gov.in/showbidDocument/${bid.b_id_parent?.length > 0 ? bid.b_id_parent[0] : bid.b_id[0]}`}
							target="_blank"
							rel="noopener noreferrer"
							className={
							bid.b_id_parent?.length > 0
								? "bg-red-100 dark:bg-red-800 p-4 shadow-lg border border-red-400 dark:border-red-300 hover:shadow-xl hover:shadow-red-100 dark:hover:shadow-red-900 hover:border-red-500 dark:hover:border-red-400 transition-all duration-300 cursor-pointer flex flex-col justify-between rounded-4xl"
								: "bg-gray-50 dark:bg-gray-900 p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 cursor-pointer flex flex-col justify-between rounded-4xl"
						}
						>
							{mainHeader({child: bid.b_category_name[0]})}	
							<div className="text-sm text-gray-600 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-2">
								{topLeftChip({child: `Ministry: `, child2: bid.ba_official_details_minName[0]})}
								{topRightChip({child: `Department: `, child2: bid.ba_official_details_deptName[0]?.replaceAll('Steel Authority of India Limited', 'SAIL')})}
								<p className="font-medium text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-700">
									{`Starting Date: `}
									<span className="text-gray-600 dark:text-gray-400">{new Date(bid.final_start_date_sort[0]!).toLocaleDateString('en-GB')}</span>
								</p>
								<p className="font-medium text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-700">
									{`Closing Date: `}
									<span className="text-gray-600 dark:text-gray-400">{new Date(bid.final_end_date_sort[0]!).toLocaleDateString('en-GB')}</span>
								</p>
								<p className="font-medium text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-700">
									{`Created By: `}
									<span className="text-gray-600 dark:text-gray-400">{bid['b.b_created_by'][0]}</span>
								</p>
								<p className="font-medium text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-700">
									{`Total Quantity: `}
									<span className="text-gray-600 dark:text-gray-400">{bid.b_total_quantity[0]}</span>
								</p>
								<p className="font-medium text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-700">
									{`ID: `}
									<span className="text-gray-600 dark:text-gray-400">{bid.b_id[0]}</span>
								</p>
								<p className="font-medium text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-700">
									{`ID Parent: `}
									<span className="text-gray-600 dark:text-gray-400">{bid.b_id_parent?.length > 0 ? bid.b_id_parent[0] : "N/A"}</span>
								</p>
								<p className="font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-b-2xl rounded-t-md border border-indigo-300 dark:border-indigo-600 col-span-1 md:col-span-2 flex items-center justify-center">
									{`Bid Number: `}{bid.b_bid_number[0]}
								</p>
							</div>
						</a>
					))
				
				)}

            </div>


			{/* Footer */}

			<div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-4xl shadow-lg border border-gray-200 dark:border-gray-700 my-6 text-center text-gray-600 dark:text-gray-400 flex justify-center items-center gap-4 flex-col md:flex-row">
				{`© `}{year}
				<Link 
					href="https://unityblaster.xyz" 
					className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-700 dark:hover:text-indigo-500 font-semibold" 
					target="_blank"
					rel="noopener noreferrer"
				>
					Unity Blaster
				</Link>
				{`(Vedant Srivastava). All rights reserved.`}
				<Link
					href="https://github.com/Unity-Blaster/mainsitev2-bids"
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center font-bold border border-black dark:border-gray-700 px-2 py-1 rounded-md w-fit"
				>
					<Github className="h-4 w-4 mr-1" /> GitHub
				</Link>
			</div>
        </div>
    );
};

/**
 * Skeleton component to show loading state for a single bid card.
 * Uses pulsing animation for a modern feel.
 */
const BidSkeleton: React.FC = () => {
	const elements = [];
	for (let i = 0; i < 9; i++) {
	  	elements.push(
			<div
				key={i}
				className="bg-gray-50 dark:bg-gray-900 p-4 shadow-md border border-gray-200 dark:border-gray-700 flex flex-col justify-between rounded-4xl animate-pulse"
			>
				{/* Title/Category Placeholder */}
				<div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-2xl w-full mb-2"></div>
				
				{/* Details Grid Placeholder */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					{topLeftChipSkeleton()}
					{topRightChipSkeleton()}
					{midChipSkeleton()}
					{midChipSkeleton()}
					{midChipSkeleton()}
					{midChipSkeleton()}
					{midChipSkeleton()}
					{midChipSkeleton()}
					{bottomChipSkeleton()}
				</div>
			</div>
		);
	}
 
	return elements;
};