import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Forward to Python ML Service
    const pythonServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    const pythonFormData = new FormData();
    pythonFormData.append('file', file);

    const response = await fetch(`${pythonServiceUrl}/analyze`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML Service error: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error analyzing file:', error);
    return NextResponse.json(
      { error: 'Failed to analyze file' },
      { status: 500 }
    );
  }
}
