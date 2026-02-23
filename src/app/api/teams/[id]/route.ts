import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Team, UpdateTeamInput } from '@/types';

// GET /api/teams/[id] - Get a specific team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teams = await query<Team>(
      'SELECT * FROM Teams WHERE id = @id',
      { id }
    );

    if (teams.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: teams[0] });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id] - Update a team
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateTeamInput = await request.json();
    
    const updateFields: string[] = [];
    const updateParams: Record<string, any> = { id };

    if (body.name !== undefined) {
      updateFields.push('name = @name');
      updateParams.name = body.name;
    }
    if (body.description !== undefined) {
      updateFields.push('description = @description');
      updateParams.description = body.description;
    }
    if (body.is_archived !== undefined) {
      updateFields.push('is_archived = @is_archived');
      updateParams.is_archived = body.is_archived;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = GETDATE()');

    const result = await query(
      `UPDATE Teams 
       SET ${updateFields.join(', ')}
       OUTPUT INSERTED.*
       WHERE id = @id`,
      updateParams
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Archive a team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query(
      `UPDATE Teams 
       SET is_archived = 1, updated_at = GETDATE()
       OUTPUT INSERTED.*
       WHERE id = @id`,
      { id }
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Team archived successfully' 
    });
  } catch (error) {
    console.error('Error archiving team:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive team' },
      { status: 500 }
    );
  }
}
