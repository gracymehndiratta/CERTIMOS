# Certimos Frontend

A Next.js frontend application for the Certimos blockchain certificate platform.

## Overview

Certimos is a decentralized certificate verification platform built on the XDC Apothem testnet. This frontend allows users to:

- Connect their MetaMask wallet
- Deploy certificate contracts 
- Mint NFT certificates with IPFS metadata
- View and verify certificates in a participant dashboard
- Admin dashboard for managing certificate deployments

## Configuration

The application is configured to use the deployed backend at:
```
https://certimos-backend.onrender.com
```

Environment variables are set in `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=https://certimos-backend.onrender.com
```

## Getting Started

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Landing Page**: Connect wallet and navigate to dashboards
- **Admin Dashboard**: Deploy contracts, upload CSV files, mint certificates
- **Participant Dashboard**: View owned certificates and their metadata
- **Certificate Verification**: Verify certificate authenticity via blockchain
- **IPFS Integration**: Decentralized metadata and image storage

## Technology Stack

- Next.js 15.5.3
- React 19
- ethers.js for blockchain interaction
- MetaMask wallet integration
- XDC Apothem testnet
- IPFS via Pinata for metadata storage
