# GeM Bids Watcher

## Project Overview

**GeM Bids Watcher** is a Next.js web application designed to monitor and display ongoing bids from the Government e-Marketplace (GeM) website. It serves as a specialized, real-time dashboard for tracking procurement opportunities specifically for:

- **Rourkela Steel Plant (RSP)**
- **Bokaro Steel Plant (BSP)**

The application provides a clean, responsive interface to view bid details such as Ministry, Department, Dates, and Quantity, with direct links to the official bid documents.

## Features

- **Live Bid Search:** Fetches real-time bid data via a Next.js API route that proxies requests to GeM.
- **Organization Filtering:** One-click presets for fetching bids from RSP and BSP.
- **Responsive UI:** Built with Tailwind CSS v4 for a seamless experience on desktop and mobile.
- **Pagination & Load Handling:**  Supports fetching multiple pages of results with retry logic and exponential backoff to handle API rate limits or instability.

## Tech Stack

Scaffolded with the [T3 Stack](https://create.t3.gg/), this application leverages:

- **Framework:** [Next.js 15](https://nextjs.org) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Validation:** [Zod](https://zod.dev/) & [@t3-oss/env-nextjs](https://env-nextjs.vercel.app/)
- **Package Manager:** [pnpm](https://pnpm.io/) (v10+)

*Note: While initialized with T3, this project currently uses standard Next.js API routes (`src/app/api/...`) rather than tRPC for backend logic.*

## Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- pnpm (v10.24.0 or compatible)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mainsitev2-bids
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Currently, `src/env.js` validates `NODE_ENV`. No external API keys are strictly required for local development yet, as authentication tokens are currently hardcoded (see "Known Issues").*

4. **Run the development server:**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/search-bids/    # Proxy API route for fetching GeM data
│   │   ├── page.tsx            # Main dashboard UI & client-side logic
│   │   └── layout.tsx          # Root layout
│   ├── env.js                  # Environment variable schema & validation
│   └── styles/                 # Global styles (Tailwind)
├── public/                     # Static assets
└── ...config files
```

## Available Scripts

- `pnpm dev`: Starts the development server with Turbopack.
- `pnpm build`: Builds the application for production.
- `pnpm start`: Runs the built application.
- `pnpm check`: Runs linting (ESLint) and type checking (TypeScript).
- `pnpm format:write`: Formats code using Prettier.

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the project into Vercel.
3. Vercel will automatically detect Next.js and configure the build settings.
4. Deploy!

## Known Issues & Roadmap

### ⚠️ Hardcoded Authentication
The API route at `src/app/api/search-bids/route.ts` currently relies on hardcoded session headers (Cookies, CSRF tokens) to communicate with the GeM portal.

```typescript
// src/app/api/search-bids/route.ts
const headers = {
    'Cookie': 'themeOption=0; TS01dc9e29=...; GeM=...; csrf_gem_cookie=<REDACTED>; ...',
};
```

**Impact:** When these tokens expire, the API will return `403 Forbidden` or `401 Unauthorized` errors.
**Future Fix:** Implement a dynamic session scraping mechanism (e.g., using Puppeteer/Playwright) or a proper authentication flow to retrieve fresh tokens before fetching bids.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---
*Generated with ❤️ by the T3 Stack*
