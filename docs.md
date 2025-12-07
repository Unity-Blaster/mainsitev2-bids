# GeM Bids Watcher Documentation

## Project Overview

This project is a Next.js web application designed to watch and display ongoing bids from the Government e-Marketplace (GeM) website. It provides a user interface to fetch and view bid details from specific departments, namely Rourkela Steel Plant (RSP) and Bokaro Steel Plant (BSP).

The application is built with the T3 Stack, which includes:

- [Next.js](https://nextjs.org)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org/)
- [tRPC](https://trpc.io) (although not explicitly used in the provided code)

## Getting Started

To get the project up and running, follow these steps:

1. **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd mainsitev2-bids
    ```

2. **Install dependencies:**

    The project uses `pnpm` as the package manager.

    ```bash
    pnpm install
    ```

3. **Set up environment variables:**

    The project uses `@t3-oss/env-nextjs` to manage environment variables. Create a `.env` file in the root of the project by copying the `.env.example` file.

    ```bash
    cp .env.example .env
    ```

    The following environment variables are defined in `src/env.js`:

    - `NODE_ENV`: The runtime environment (`development`, `test`, or `production`).

4. **Run the development server:**

    ```bash
    pnpm dev
    ```

    The application will be available at `http://localhost:3000`.

## Project Structure

The project follows a standard Next.js App Router structure.

```directory
.
├── src
│   ├── app
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main page component
│   │   └── api
│   │       └── search-bids
│   │           └── route.ts # API route for fetching bids
│   ├── env.js             # Environment variable validation
│   └── styles
│       └── globals.css      # Global CSS styles
├── next.config.js         # Next.js configuration
├── package.json           # Project dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## API Endpoint

### `/api/search-bids`

This is a `POST` API route that acts as a proxy to the external GeM API.

- **Method:** `POST`
- **Request Body:**

    ```json
    {
      "searchType": "ministry-search",
      "ministry": "Ministry of Steel",
      "buyerState": "",
      "organization": "Rourkela Steel Plant" | "Bokaro Steel Plant",
      "department": "Steel Authority of India Limited",
      "bidEndFromMin": "",
      "bidEndToMin": "",
      "page": 1,
      "rows": 10
    }
    ```

- **Response:**

    The API route returns the JSON response from the external GeM API.

## Potential Issues

### Hardcoded CSRF Token and Cookie

The API route at `src/app/api/search-bids/route.ts` uses a hardcoded CSRF token and a hardcoded cookie to make requests to the external GeM API.

```typescript
// src/app/api/search-bids/route.ts

const CSRF_TOKEN = '341a0cd222a0eacceb68eaa4e2887aac';

const headers = {
    // ...
    'Cookie': 'themeOption=0; TS01dc9e29=01e393167df3e3c0e6ad8d16ee707e9aa4ef062707eef0e3001f6f44cd0250c0a0349be290e0f907b6bc457cdbe83b785e5fbb047ee0159449e74f714f958e4d72ff5533c1; GeM=1474969956.20480.0000; _ga=GA1.3.1621276125.1761280079; _gid=GA1.3.636807168.1761280079; ci_session=57c53bd88419aaa6cbcae894e999ebf4f827ca1a; csrf_gem_cookie=341a0cd222a0eacceb68eaa4e2887aac; TS0174a79d=01e393167df7b0f6acd2ecc5139c5d9f815b61d8321f0127de80522966d813212daa0288f47d6944a9252a7839e38b3287857fd30781b2f2cb19f38c4385e0ad2b682b9fec8edd9758570c06a006ae21e4f8c37c0e25986d9b6099614f4721f93466ef40ab',
};
```

**This is a significant issue.** CSRF tokens and session cookies are temporary and will expire. When they expire, the application will no longer be able to fetch data from the GeM API and will fail with a `403 Forbidden` error.

To fix this, the application needs a mechanism to dynamically fetch a valid CSRF token and cookie before making a request to the `search-bids` endpoint.
