import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Basic certificate contract ABI (you'll need to replace with your actual contract ABI)
const CERTIFICATE_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "symbol", "type": "string" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mintCertificate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// You'll need to replace this with your actual contract bytecode
const CERTIFICATE_CONTRACT_BYTECODE = "0x608060405234801561001057600080fd5b50..."; // Placeholder

export async function POST(request) {
  try {
    const { network, contractName } = await request.json();

    // Validate input
    if (!network || !contractName) {
      return NextResponse.json(
        { error: 'Missing required fields: network, contractName' },
        { status: 400 }
      );
    }

    // Get network configuration
    const networkConfigs = {
      'localhost': {
        rpcUrl: 'http://localhost:8545',
        chainId: 1337
      },
      'apothem': {
        rpcUrl: 'https://rpc.apothem.network',
        chainId: 51
      },
      'xdc-mainnet': {
        rpcUrl: 'https://rpc.xinfin.network',
        chainId: 50
      }
    };

    const config = networkConfigs[network];
    if (!config) {
      return NextResponse.json(
        { error: 'Unsupported network', supportedNetworks: Object.keys(networkConfigs) },
        { status: 400 }
      );
    }

    // Check if private key is available
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      );
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Check wallet balance
    const balance = await wallet.getBalance();
    const minBalance = ethers.parseEther('0.1'); // Minimum 0.1 ETH/XDC required

    if (balance < minBalance) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance for deployment',
          currentBalance: ethers.formatEther(balance),
          minimumRequired: ethers.formatEther(minBalance),
          walletAddress: wallet.address
        },
        { status: 400 }
      );
    }

    // Create contract factory
    const contractFactory = new ethers.ContractFactory(
      CERTIFICATE_CONTRACT_ABI,
      CERTIFICATE_CONTRACT_BYTECODE,
      wallet
    );

    // Deploy contract with default symbol
    console.log('Deploying contract...');
    const defaultSymbol = "CERT"; // Default symbol for all certificates
    const contract = await contractFactory.deploy(contractName, defaultSymbol);
    
    // Wait for deployment
    const deploymentReceipt = await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    // Get deployment transaction details
    const deploymentTx = await provider.getTransaction(contract.deploymentTransaction().hash);

    const deploymentData = {
      contractAddress,
      transactionHash: contract.deploymentTransaction().hash,
      blockNumber: deploymentReceipt.blockNumber,
      gasUsed: deploymentReceipt.gasUsed.toString(),
      network,
      contractName,
      deployerAddress: wallet.address,
      deployer: wallet.address,
      deployedAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    // Save deployment to our deployments API
    try {
      const deploymentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/contracts/deployments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentData),
      });
      
      if (!deploymentsResponse.ok) {
        console.warn('Failed to save deployment to deployments API');
      }
    } catch (deploymentSaveError) {
      console.warn('Error saving deployment:', deploymentSaveError);
    }

    return NextResponse.json({
      success: true,
      message: 'Contract deployed successfully',
      deployment: deploymentData,
      explorerUrl: network === 'apothem' 
        ? `https://explorer.apothem.network/tx/${contract.deploymentTransaction().hash}`
        : network === 'xdc-mainnet'
        ? `https://explorer.xinfin.network/tx/${contract.deploymentTransaction().hash}`
        : null
    });

  } catch (error) {
    console.error('Contract deployment error:', error);
    
    // Parse different types of errors
    let errorMessage = 'Contract deployment failed';
    let statusCode = 500;

    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for deployment';
      statusCode = 400;
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = 'Network connection error';
      statusCode = 503;
    } else if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || 'Unknown error occurred'
      },
      { status: statusCode }
    );
  }
}

export async function GET() {
  try {
    // Return deployment validation info
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    
    return NextResponse.json({
      ready: !!privateKey,
      supportedNetworks: ['localhost', 'apothem', 'xdc-mainnet'],
      requirements: {
        DEPLOYER_PRIVATE_KEY: !!privateKey ? 'Configured' : 'Missing'
      },
      message: privateKey 
        ? 'Deployment environment is ready'
        : 'Please configure DEPLOYER_PRIVATE_KEY environment variable'
    });
  } catch (error) {
    console.error('Deployment validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate deployment environment' },
      { status: 500 }
    );
  }
}