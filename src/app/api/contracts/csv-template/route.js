import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const template = {
      format: 'CSV',
      required_columns: ['participant_name', 'wallet_address'],
      description: 'CSV file format for bulk certificate minting',
      example_data: [
        {
          participant_name: 'John Doe',
          wallet_address: '0x1234567890123456789012345678901234567890'
        },
        {
          participant_name: 'Jane Smith', 
          wallet_address: '0x0987654321098765432109876543210987654321'
        }
      ],
      requirements: {
        participant_name: 'String - Name of the certificate recipient',
        wallet_address: 'String - Valid Ethereum wallet address (0x format, 42 characters)'
      },
      csv_example: 'participant_name,wallet_address\nJohn Doe,0x1234567890123456789012345678901234567890\nJane Smith,0x0987654321098765432109876543210987654321',
      validation_rules: [
        'participant_name must not be empty',
        'wallet_address must be a valid Ethereum address (0x format)',
        'No duplicate wallet addresses allowed',
        'CSV must have header row with exact column names'
      ]
    };

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV template' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Generate and return a downloadable CSV template
    const csvContent = 'participant_name,wallet_address\nJohn Doe,0x1234567890123456789012345678901234567890\nJane Smith,0x0987654321098765432109876543210987654321';
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="certificate_template.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating CSV file:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV file' },
      { status: 500 }
    );
  }
}