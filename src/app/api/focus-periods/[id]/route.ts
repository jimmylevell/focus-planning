import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PATCH /api/focus-periods/[id] - Update a focus period
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await query(
      `UPDATE FocusPeriods 
       SET name = @name, 
           start_date = @start_date, 
           end_date = @end_date, 
           capacity_model = @capacity_model,
           azdo_iteration_path = @azdo_iteration_path,
           azdo_tag = @azdo_tag,
           updated_at = GETDATE()
       OUTPUT INSERTED.*
       WHERE id = @id`,
      {
        id: parseInt(id),
        name: body.name,
        start_date: body.start_date,
        end_date: body.end_date,
        capacity_model: body.capacity_model || 80,
        azdo_iteration_path: body.azdo_iteration_path || null,
        azdo_tag: body.azdo_tag || null,
      }
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Focus period not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating focus period:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update focus period' },
      { status: 500 }
    );
  }
}
