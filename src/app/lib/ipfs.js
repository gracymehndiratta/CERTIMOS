import { PinataSDK } from 'pinata-web3';

class IPFSService {
  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
    });
  }

  async uploadImage(imageBuffer, filename) {
    try {
      if (!process.env.PINATA_JWT) {
        throw new Error('PINATA_JWT environment variable not configured');
      }

      const file = new File([imageBuffer], filename, { type: 'image/*' });
      const upload = await this.pinata.upload.file(file);
      
      return {
        success: true,
        ipfsHash: upload.IpfsHash,
        ipfsUrl: `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${upload.IpfsHash}`,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`
      };
    } catch (error) {
      console.error('IPFS image upload error:', error);
      throw new Error(`Failed to upload image to IPFS: ${error.message}`);
    }
  }

  async uploadMetadata(metadata) {
    try {
      if (!process.env.PINATA_JWT) {
        throw new Error('PINATA_JWT environment variable not configured');
      }

      const upload = await this.pinata.upload.json(metadata);
      
      return {
        success: true,
        ipfsHash: upload.IpfsHash,
        ipfsUrl: `https://${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${upload.IpfsHash}`,
        pinataUrl: `https://gateway.pinata.cloud/ipfs/${upload.IpfsHash}`
      };
    } catch (error) {
      console.error('IPFS metadata upload error:', error);
      throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
    }
  }

  async createCertificateMetadata(participantName, eventName, certificateName, imageUrl, tokenId, contractName) {
    const metadata = {
      name: `${certificateName || 'Certificate'} - ${eventName}`,
      description: `${certificateName || 'Certificate'} for ${eventName} awarded to ${participantName}`,
      image: imageUrl,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${tokenId}`,
      attributes: [
        {
          trait_type: "Recipient",
          value: participantName
        },
        {
          trait_type: "Event",
          value: eventName
        },
        {
          trait_type: "Certificate Name",
          value: certificateName || 'Certificate'
        },
        {
          trait_type: "Issue Date",
          value: new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Certificate Type",
          value: "Participation"
        }
      ],
      properties: {
        participant: participantName,
        event: eventName,
        certificateName: certificateName,
        contractName: contractName,
        issueDate: new Date().toISOString(),
        tokenId: tokenId
      }
    };

    // Add contract name attribute if provided
    if (contractName) {
      metadata.attributes.push({
        trait_type: "Contract",
        value: contractName
      });
    }

    return metadata;
  }

  async uploadCertificateBundle(participantName, eventName, certificateName, imageBuffer, imageFilename, tokenId, contractName) {
    try {
      let imageResult = null;
      
      // Upload image if provided
      if (imageBuffer && imageBuffer.length > 0) {
        console.log(`Uploading image for ${participantName}...`);
        imageResult = await this.uploadImage(imageBuffer, imageFilename);
      }
      
      // Create and upload metadata
      console.log(`Creating metadata for ${participantName}...`);
      const metadata = await this.createCertificateMetadata(
        participantName,
        eventName,
        certificateName,
        imageResult ? imageResult.ipfsUrl : null,
        tokenId,
        contractName
      );
      
      console.log(`Uploading metadata for ${participantName}...`);
      const metadataResult = await this.uploadMetadata(metadata);
      
      return {
        success: true,
        participant: participantName,
        tokenId,
        image: imageResult,
        metadata: metadataResult,
        tokenURI: metadataResult.ipfsUrl
      };
    } catch (error) {
      console.error(`Certificate bundle upload error for ${participantName}:`, error);
      throw error;
    }
  }

  async validateConfiguration() {
    try {
      if (!process.env.PINATA_JWT) {
        return {
          valid: false,
          error: 'PINATA_JWT environment variable not configured'
        };
      }

      // Test connection by uploading a small test file
      const testData = { test: 'connection', timestamp: Date.now() };
      await this.uploadMetadata(testData);
      
      return {
        valid: true,
        message: 'IPFS configuration is valid'
      };
    } catch (error) {
      return {
        valid: false,
        error: `IPFS configuration error: ${error.message}`
      };
    }
  }
}

export default IPFSService;