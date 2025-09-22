import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In-memory storage for deployments (in a real app, this would be a database)
let deployments = [];

// File path for persistent storage
const deploymentsFilePath = path.join(process.cwd(), 'data', 'deployments.json');

// Initialize deployments from file if it exists
const initializeDeployments = () => {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(deploymentsFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load existing deployments
    if (fs.existsSync(deploymentsFilePath)) {
      const data = fs.readFileSync(deploymentsFilePath, 'utf8');
      deployments = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error initializing deployments:', error);
    deployments = [];
  }
};

// Save deployments to file
const saveDeployments = () => {
  try {
    const dataDir = path.dirname(deploymentsFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(deploymentsFilePath, JSON.stringify(deployments, null, 2));
  } catch (error) {
    console.error('Error saving deployments:', error);
  }
};

// Initialize on module load
initializeDeployments();

// GET - Fetch all deployments
export async function GET() {
  try {
    // Refresh from file in case of external updates
    initializeDeployments();
    
    // Return complete contract structure with guaranteed fields
    const contracts = deployments.map(deployment => ({
      contractAddress: deployment.contractAddress || '',
      network: deployment.network || 'apothem',
      contractName: deployment.contractName || 'Unnamed Contract',
      deployedAt: deployment.deployedAt || deployment.createdAt || new Date().toISOString(),
      deployer: deployment.deployer || deployment.deployerAddress || 'unknown',
      owner: deployment.owner || deployment.deployer || deployment.deployerAddress || 'unknown',
      deploymentId: deployment.id || deployment.contractAddress || Date.now().toString(),
      transactionHash: deployment.transactionHash || '',
      blockNumber: deployment.blockNumber || 0
    }));
    
    return NextResponse.json({
      success: true,
      contracts: contracts,
      count: contracts.length
    });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch deployments',
        contracts: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// POST - Add a new deployment
export async function POST(request) {
  try {
    const deployment = await request.json();
    
    // Validate required fields
    const requiredFields = ['contractAddress', 'network', 'contractName'];
    for (const field of requiredFields) {
      if (!deployment[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create deployment object with all required fields
    const newDeployment = {
      contractAddress: deployment.contractAddress,
      contractName: deployment.contractName,
      contractSymbol: deployment.contractSymbol || 'CERT',
      network: deployment.network,
      blockNumber: deployment.blockNumber || 0,
      transactionHash: deployment.transactionHash || '',
      deployedAt: deployment.deployedAt || new Date().toISOString(),
      deployer: deployment.deployer || 'unknown',
      owner: deployment.owner || deployment.deployer || 'unknown',
      createdAt: new Date().toISOString(),
      id: Date.now().toString() // Simple ID generation
    };

    // Add to deployments array
    deployments.push(newDeployment);
    
    // Save to file
    saveDeployments();
    
    return NextResponse.json({
      success: true,
      deployment: newDeployment,
      message: 'Deployment saved successfully'
    });
  } catch (error) {
    console.error('Error saving deployment:', error);
    return NextResponse.json(
      { error: 'Failed to save deployment' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a deployment by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    const initialLength = deployments.length;
    deployments = deployments.filter(deployment => deployment.id !== id);
    
    if (deployments.length === initialLength) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      );
    }

    // Save updated deployments
    saveDeployments();
    
    return NextResponse.json({
      success: true,
      message: 'Deployment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deployment:', error);
    return NextResponse.json(
      { error: 'Failed to delete deployment' },
      { status: 500 }
    );
  }
}
