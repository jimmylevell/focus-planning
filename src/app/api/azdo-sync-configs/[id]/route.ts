import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AzDoSyncConfiguration, UpdateAzDoSyncConfigurationInput } from '@/types';

// GET /api/azdo-sync-configs/[id] - Get a specific sync configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query<AzDoSyncConfiguration>(
      'SELECT * FROM AzDoSyncConfigurations WHERE id = @id',
      { id: parseInt(id) }
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sync configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error fetching sync configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync configuration' },
      { status: 500 }
    );
  }
}

// PATCH /api/azdo-sync-configs/[id] - Update a sync configuration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateAzDoSyncConfigurationInput = await request.json();

    // Build dynamic SQL to only update provided fields
    const updates: string[] = [];
    const queryParams: Record<string, any> = { id: parseInt(id) };

    if (body.name !== undefined) {
      updates.push('name = @name');
      queryParams.name = body.name;
    }
    if (body.project !== undefined) {
      updates.push('project = @project');
      queryParams.project = body.project;
    }
    if (body.work_item_type !== undefined) {
      updates.push('work_item_type = @work_item_type');
      queryParams.work_item_type = body.work_item_type;
    }
    if (body.iteration_path !== undefined) {
      updates.push('iteration_path = @iteration_path');
      queryParams.iteration_path = body.iteration_path || null;
    }
    if (body.area_path !== undefined) {
      updates.push('area_path = @area_path');
      queryParams.area_path = body.area_path || null;
    }
    if (body.state !== undefined) {
      updates.push('state = @state');
      queryParams.state = body.state || null;
    }
    if (body.tags !== undefined) {
      updates.push('tags = @tags');
      queryParams.tags = body.tags || null;
    }
    if (body.focus_period_id !== undefined) {
      updates.push('focus_period_id = @focus_period_id');
      queryParams.focus_period_id = body.focus_period_id || null;
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = @is_active');
      queryParams.is_active = body.is_active;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = GETDATE()');

    const result = await query<AzDoSyncConfiguration>(
      `UPDATE AzDoSyncConfigurations 
       SET ${updates.join(', ')}
       OUTPUT INSERTED.*
       WHERE id = @id`,
      queryParams
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sync configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating sync configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sync configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/azdo-sync-configs/[id] - Deactivate a sync configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await query<AzDoSyncConfiguration>(
      `UPDATE AzDoSyncConfigurations 
       SET is_active = 0,
           updated_at = GETDATE()
       OUTPUT INSERTED.*
       WHERE id = @id`,
      { id: parseInt(id) }
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sync configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error deactivating sync configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate sync configuration' },
      { status: 500 }
    );
  }
}
