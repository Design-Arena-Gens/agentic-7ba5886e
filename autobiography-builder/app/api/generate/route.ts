import { NextRequest, NextResponse } from 'next/server';
import { generateAutobiography } from '@/lib/ai-generator';
import { AutobiographyData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, style } = body;

    if (!data || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const story = await generateAutobiography(data as AutobiographyData, style);

    return NextResponse.json({ story });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    );
  }
}
