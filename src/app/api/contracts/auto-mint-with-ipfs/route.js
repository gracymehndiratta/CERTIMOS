import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import Papa from 'papaparse';
import IPFSService from '../../../lib/ipfs.js';

// Certificate contract ABI for minting
const CERTIFICATE_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mintCertificate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenIdCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const eventName = formData.get('eventName');
    const certificateName = formData.get('certificateName');
    const csvFile = formData.get('csvFile');
    const contractAddress = formData.get('contractAddress');
    const contractName = formData.get('contractName');
    const network = formData.get('network') || 'apothem';

    // Validate required fields
    if (!eventName || !certificateName || !csvFile || !contractAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: eventName, certificateName, csvFile, contractAddress' },
        { status: 400 }
      );
    }

    // Parse CSV file
    const csvText = await csvFile.text();
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing failed', details: parseResult.errors },
        { status: 400 }
      );
    }

    const participants = parseResult.data.map(row => ({
      name: row.participant_name?.trim(),
      walletAddress: row.wallet_address?.trim().toLowerCase()
    })).filter(p => p.name && p.walletAddress);

    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No valid participants found in CSV' },
        { status: 400 }
      );
    }

    // Get network configuration
    const networkConfigs = {
      'localhost': { rpcUrl: 'http://localhost:8545', chainId: 1337 },
      'apothem': { rpcUrl: 'https://rpc.apothem.network', chainId: 51 },
      'xdc-mainnet': { rpcUrl: 'https://rpc.xinfin.network', chainId: 50 }
    };

    const config = networkConfigs[network];
    if (!config) {
      return NextResponse.json(
        { error: 'Unsupported network' },
        { status: 400 }
      );
    }

    // Setup blockchain connection
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CERTIFICATE_CONTRACT_ABI, wallet);

    // Initialize IPFS service
    const ipfsService = new IPFSService();
    
    // Validate IPFS configuration
    const ipfsValidation = await ipfsService.validateConfiguration();
    if (!ipfsValidation.valid) {
      return NextResponse.json(
        { error: ipfsValidation.error },
        { status: 500 }
      );
    }

    // Handle template image (optional in simplified form)
    let imageBuffer = null;
    let imageFilename = 'certificate-template.png';
    
    const templateImage = formData.get('templateImage');
    if (templateImage && templateImage.size > 0) {
      imageBuffer = Buffer.from(await templateImage.arrayBuffer());
      imageFilename = templateImage.name || 'certificate-template.png';
    }

    // Get starting token ID
    let currentTokenId;
    try {
      currentTokenId = await contract.tokenIdCounter();
    } catch (error) {
      // If tokenIdCounter doesn't exist, start from 1
      currentTokenId = BigInt(1);
    }

    const results = {
      success: [],
      failed: [],
      totalParticipants: participants.length,
      successCount: 0,
      failedCount: 0,
      startTime: new Date().toISOString()
    };

    // Process each participant
    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i];
      const tokenId = currentTokenId + BigInt(i);
      
      try {
        console.log(`Processing participant ${i + 1}/${participants.length}: ${participant.name}`);
        
        // Upload certificate bundle to IPFS
        const ipfsResult = await ipfsService.uploadCertificateBundle(
          participant.name,
          eventName,
          certificateName, // Use certificateName instead of eventDate
          imageBuffer,
          imageFilename,
          tokenId.toString(),
          contractName // Add contract name to metadata
        );

        // Mint certificate
        console.log(`Minting certificate for ${participant.name}...`);
        const mintTx = await contract.mintCertificate(
          participant.walletAddress,
          ipfsResult.tokenURI
        );

        const receipt = await mintTx.wait();
        
        results.success.push({
          participant: participant.name,
          walletAddress: participant.walletAddress,
          tokenId: tokenId.toString(),
          transactionHash: mintTx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          ipfs: ipfsResult,
          explorerUrl: network === 'apothem' 
            ? `https://explorer.apothem.network/tx/${mintTx.hash}`
            : network === 'xdc-mainnet'
            ? `https://explorer.xinfin.network/tx/${mintTx.hash}`
            : null
        });

        results.successCount++;
        console.log(`✅ Successfully minted certificate for ${participant.name}`);

      } catch (error) {
        console.error(`❌ Failed to mint certificate for ${participant.name}:`, error);
        
        results.failed.push({
          participant: participant.name,
          walletAddress: participant.walletAddress,
          error: error.message || 'Unknown error',
          tokenId: tokenId.toString()
        });
        
        results.failedCount++;
      }

      // Add small delay to avoid overwhelming the network
      if (i < participants.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    results.endTime = new Date().toISOString();
    results.duration = `${Math.round((new Date(results.endTime) - new Date(results.startTime)) / 1000)}s`;

    // Return results
    const statusCode = results.failedCount > 0 ? 207 : 200; // 207 Multi-Status if some failed

    return NextResponse.json({
      message: `Bulk minting completed. ${results.successCount} successful, ${results.failedCount} failed.`,
      results,
      summary: {
        eventName,
        certificateName,
        contractName,
        totalParticipants: results.totalParticipants,
        successfulMints: results.successCount,
        failedMints: results.failedCount,
        contractAddress,
        network,
        duration: results.duration
      }
    }, { status: statusCode });

  } catch (error) {
    console.error('Bulk minting error:', error);
    return NextResponse.json(
      { 
        error: 'Bulk minting failed',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return configuration status
    const ipfsService = new IPFSService();
    const ipfsValidation = await ipfsService.validateConfiguration();
    
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    
    return NextResponse.json({
      ready: !!privateKey && ipfsValidation.valid,
      configuration: {
        DEPLOYER_PRIVATE_KEY: !!privateKey ? 'Configured' : 'Missing',
        IPFS: ipfsValidation.valid ? 'Configured' : ipfsValidation.error
      },
      supportedNetworks: ['localhost', 'apothem', 'xdc-mainnet'],
      requirements: [
        'DEPLOYER_PRIVATE_KEY environment variable',
        'PINATA_JWT environment variable for IPFS uploads',
        'Valid contract address',
        'CSV file with participant data',
        'Template image file'
      ]
    });
  } catch (error) {
    console.error('Bulk minting validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate bulk minting configuration' },
      { status: 500 }
    );
  }
}