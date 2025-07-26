import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Research API is working',
    timestamp: new Date().toISOString(),
    test: true
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Research API POST is working',
    timestamp: new Date().toISOString(),
    test: true
  });
} 