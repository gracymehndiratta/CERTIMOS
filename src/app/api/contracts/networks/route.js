import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const networks = {
      localhost: {
        name: 'Local Development',
        rpcUrl: 'http://localhost:8545',
        chainId: 1337,
        currency: 'ETH',
        explorerUrl: null,
        description: 'Local development network (Hardhat/Ganache)'
      },
      apothem: {
        name: 'XDC Apothem Testnet',
        rpcUrl: 'https://rpc.apothem.network',
        chainId: 51,
        currency: 'TXDC',
        explorerUrl: 'https://explorer.apothem.network',
        description: 'XDC Network testnet for development and testing',
        faucet: 'https://faucet.apothem.network'
      },
      'xdc-mainnet': {
        name: 'XDC Mainnet',
        rpcUrl: 'https://rpc.xinfin.network',
        chainId: 50,
        currency: 'XDC',
        explorerUrl: 'https://explorer.xinfin.network',
        description: 'XDC Network mainnet for production use'
      }
    };

    return NextResponse.json({
      networks,
      defaultNetwork: 'apothem',
      supportedNetworks: Object.keys(networks),
      recommendations: {
        development: 'apothem',
        testing: 'apothem', 
        production: 'xdc-mainnet'
      }
    });
  } catch (error) {
    console.error('Error fetching networks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network information' },
      { status: 500 }
    );
  }
}