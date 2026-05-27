import { NextResponse } from 'next/server';

// GET /api/azdo-projects - Return the configured Azure DevOps project from environment
export async function GET() {
    const project = process.env.AZDO_PROJECT?.trim() ?? '';
    return NextResponse.json({ success: true, data: project || null });
}
