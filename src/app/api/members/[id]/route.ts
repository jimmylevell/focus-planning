import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memberId = parseInt(id);
    const body = await request.json();
    const { name, email, role, default_capacity_days } = body;

    const pool = await getConnection();
    
    // Update the member
    await pool.request()
      .input('id', memberId)
      .input('name', name)
      .input('email', email || null)
      .input('role', role || null)
      .input('default_capacity_days', default_capacity_days || null)
      .query(`
        UPDATE TeamMembers
        SET 
          name = @name,
          email = @email,
          role = @role,
          default_capacity_days = @default_capacity_days,
          updated_at = GETDATE()
        WHERE id = @id
      `);

    // Fetch the updated member
    const result = await pool.request()
      .input('id', memberId)
      .query(`
        SELECT id, team_id, name, email, role, default_capacity_days, created_at, updated_at
        FROM TeamMembers
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}
