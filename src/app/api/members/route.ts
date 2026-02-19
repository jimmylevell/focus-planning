import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TeamMember, CreateTeamMemberInput } from '@/types';

// GET /api/members - List all members
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('team_id');
    
    let queryString = 'SELECT * FROM TeamMembers WHERE is_active = 1';
    const params: Record<string, any> = {};
    
    if (teamId) {
      queryString += ' AND team_id = @team_id';
      params.team_id = teamId;
    }
    
    queryString += ' ORDER BY name';
    
    const members = await query<TeamMember>(queryString, Object.keys(params).length > 0 ? params : undefined);
    return NextResponse.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create a new member
export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamMemberInput = await request.json();
    
    if (!body.team_id || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Team ID and name are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO TeamMembers (team_id, name, email, role, default_capacity_days) 
       OUTPUT INSERTED.*
       VALUES (@team_id, @name, @email, @role, @default_capacity_days)`,
      {
        team_id: body.team_id,
        name: body.name,
        email: body.email || null,
        role: body.role || null,
        default_capacity_days: body.default_capacity_days || null,
      }
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
