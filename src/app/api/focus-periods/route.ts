import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { FocusPeriod, CreateFocusPeriodInput } from '@/types';

// GET /api/focus-periods - List all focus periods
export async function GET() {
  try {
    const periods = await query<FocusPeriod>(
      'SELECT * FROM FocusPeriods WHERE is_active = 1 ORDER BY start_date DESC'
    );
    return NextResponse.json({ success: true, data: periods });
  } catch (error) {
    console.error('Error fetching focus periods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch focus periods' },
      { status: 500 }
    );
  }
}

// POST /api/focus-periods - Create a new focus period
export async function POST(request: NextRequest) {
  try {
    const body: CreateFocusPeriodInput = await request.json();
    
    if (!body.name || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { success: false, error: 'Name, start date, and end date are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO FocusPeriods (name, start_date, end_date, capacity_model, azdo_iteration_path, azdo_tag) 
       OUTPUT INSERTED.*
       VALUES (@name, @start_date, @end_date, @capacity_model, @azdo_iteration_path, @azdo_tag)`,
      {
        name: body.name,
        start_date: body.start_date,
        end_date: body.end_date,
        capacity_model: body.capacity_model || 80,
        azdo_iteration_path: body.azdo_iteration_path || null,
        azdo_tag: body.azdo_tag || null,
      }
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating focus period:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create focus period' },
      { status: 500 }
    );
  }
}
