import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Team, CreateTeamInput, UpdateTeamInput } from '@/types';

// GET /api/teams - List all teams
export async function GET() {
  try {
    const teams = await query<Team>(
      'SELECT * FROM Teams WHERE is_archived = 0 ORDER BY name'
    );
    return NextResponse.json({ success: true, data: teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamInput = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Team name is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO Teams (name, description) 
       OUTPUT INSERTED.*
       VALUES (@name, @description)`,
      {
        name: body.name,
        description: body.description || null,
      }
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
