import { NextRequest, NextResponse } from "next/server"

import { getPreferredLocale, t } from "@/lib/i18n"

export async function POST(req: NextRequest) {
  try {
    const locale = getPreferredLocale(req.headers.get("accept-language"))

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: t(locale, "NO_FILE"), code: "NO_FILE" },
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
      console.error("ML Service error:", errorText)
      return NextResponse.json(
        { error: t(locale, "ML_SERVICE_ERROR"), code: "ML_SERVICE_ERROR" },
        { status: 502 }
      )
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error analyzing file:', error);
    return NextResponse.json(
      { error: t(getPreferredLocale(req.headers.get("accept-language")), "ANALYZE_FAILED"), code: "ANALYZE_FAILED" },
      { status: 500 }
    );
  }
}
