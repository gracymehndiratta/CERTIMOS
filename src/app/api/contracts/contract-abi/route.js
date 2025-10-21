import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Certificate contract ABI for frontend minting
    const contractABI = [
      {
        "inputs": [
          { "internalType": "address", "name": "initialOwner", "type": "address" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "string", "name": "tokenURI_", "type": "string" }
        ],
        "name": "mintCertificate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
        ],
        "name": "tokenURI",
        "outputs": [
          { "internalType": "string", "name": "", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "owner", "type": "address" }
        ],
        "name": "balanceOf",
        "outputs": [
          { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
        ],
        "name": "ownerOf",
        "outputs": [
          { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    return NextResponse.json({
      success: true,
      contractABI: contractABI,
      functions: {
        mint: "mintCertificate(address recipient, string tokenURI_)",
        owner: "owner()",
        tokenURI: "tokenURI(uint256 tokenId)"
      },
      usage: "Use this ABI with ethers.js to interact with certificate contracts from the frontend"
    });

  } catch (error) {
    console.error('Error getting contract ABI:', error);
    return NextResponse.json(
      { error: 'Failed to get contract ABI' },
      { status: 500 }
    );
  }
}
