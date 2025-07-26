import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    version: '1.0.1'
  });
} 