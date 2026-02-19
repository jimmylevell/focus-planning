import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CapacityAllocation, CreateCapacityAllocationInput } from '@/types';

// GET /api/allocations - List all allocations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const focusPeriodId = searchParams.get('focus_period_id');
    const teamMemberId = searchParams.get('team_member_id');
    
    let queryString = 'SELECT * FROM CapacityAllocations WHERE 1=1';
    const params: Record<string, any> = {};
    
    if (focusPeriodId) {
      queryString += ' AND focus_period_id = @focus_period_id';
      params.focus_period_id = focusPeriodId;
    }
    
    if (teamMemberId) {
      queryString += ' AND team_member_id = @team_member_id';
      params.team_member_id = teamMemberId;
    }
    
    queryString += ' ORDER BY created_at DESC';
    
    const allocations = await query<CapacityAllocation>(queryString, Object.keys(params).length > 0 ? params : undefined);
    return NextResponse.json({ success: true, data: allocations });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

// POST /api/allocations - Create a new allocation
export async function POST(request: NextRequest) {
  try {
    const body: CreateCapacityAllocationInput = await request.json();
    
    if (!body.team_member_id || !body.work_item_id || !body.focus_period_id || body.allocated_days === undefined) {
      return NextResponse.json(
        { success: false, error: 'Team member ID, work item ID, focus period ID, and allocated days are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO CapacityAllocations (team_member_id, work_item_id, focus_period_id, allocated_days, allocated_percentage, start_date, end_date, notes) 
       OUTPUT INSERTED.*
       VALUES (@team_member_id, @work_item_id, @focus_period_id, @allocated_days, @allocated_percentage, @start_date, @end_date, @notes)`,
      {
        team_member_id: body.team_member_id,
        work_item_id: body.work_item_id,
        focus_period_id: body.focus_period_id,
        allocated_days: body.allocated_days,
        allocated_percentage: body.allocated_percentage || null,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        notes: body.notes || null,
      }
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating allocation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}
