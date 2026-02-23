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

    const result = await query<AzDoSyncConfiguration>(
      `UPDATE AzDoSyncConfigurations 
       SET name = COALESCE(@name, name),
           project = COALESCE(@project, project),
           work_item_type = COALESCE(@work_item_type, work_item_type),
           iteration_path = COALESCE(@iteration_path, iteration_path),
           area_path = COALESCE(@area_path, area_path),
           state = COALESCE(@state, state),
           tags = COALESCE(@tags, tags),
           focus_period_id = COALESCE(@focus_period_id, focus_period_id),
           is_active = COALESCE(@is_active, is_active),
           updated_at = GETDATE()
       OUTPUT INSERTED.*
       WHERE id = @id`,
      {
        id: parseInt(id),
        name: body.name || null,
        project: body.project || null,
        work_item_type: body.work_item_type || null,
        iteration_path: body.iteration_path || null,
        area_path: body.area_path || null,
        state: body.state || null,
        tags: body.tags || null,
        focus_period_id: body.focus_period_id || null,
        is_active: body.is_active !== undefined ? body.is_active : null,
      }
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
