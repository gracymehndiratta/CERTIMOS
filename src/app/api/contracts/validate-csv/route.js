import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('csvFile');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    
    // Parse CSV
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'CSV parsing failed',
          details: parseResult.errors
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const requiredColumns = ['participant_name', 'wallet_address'];
    const headers = Object.keys(data[0] || {});
    
    // Check required columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required columns',
          missingColumns,
          requiredColumns,
          foundColumns: headers
        },
        { status: 400 }
      );
    }

    // Validate data
    const errors = [];
    const validData = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Check participant name
      if (!row.participant_name || row.participant_name.trim() === '') {
        rowErrors.push(`Row ${index + 1}: participant_name is required`);
      }
      
      // Check wallet address format (basic validation)
      if (!row.wallet_address || row.wallet_address.trim() === '') {
        rowErrors.push(`Row ${index + 1}: wallet_address is required`);
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(row.wallet_address.trim())) {
        rowErrors.push(`Row ${index + 1}: wallet_address format is invalid`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validData.push({
          participantName: row.participant_name.trim(),
          walletAddress: row.wallet_address.trim().toLowerCase()
        });
      }
    });

    // Check for duplicate wallet addresses
    const walletAddresses = validData.map(item => item.walletAddress);
    const duplicates = walletAddresses.filter((item, index) => walletAddresses.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate wallet addresses found: ${[...new Set(duplicates)].join(', ')}`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'CSV validation failed',
          errors,
          validRowCount: validData.length,
          totalRowCount: data.length
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CSV validation successful',
      data: validData,
      rowCount: validData.length,
      preview: validData.slice(0, 5) // Show first 5 rows as preview
    });

  } catch (error) {
    console.error('CSV validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during CSV validation' },
      { status: 500 }
    );
  }
}