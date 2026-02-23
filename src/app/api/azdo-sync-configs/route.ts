import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AzDoSyncConfiguration, CreateAzDoSyncConfigurationInput } from '@/types';

// GET /api/azdo-sync-configs - List all Azure DevOps sync configurations
export async function GET() {
  try {
    const configs = await query<AzDoSyncConfiguration>(
      'SELECT * FROM AzDoSyncConfigurations WHERE is_active = 1 ORDER BY updated_at DESC'
    );
    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching sync configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync configurations' },
      { status: 500 }
    );
  }
}

// POST /api/azdo-sync-configs - Create a new sync configuration
export async function POST(request: NextRequest) {
  try {
    const body: CreateAzDoSyncConfigurationInput = await request.json();
    
    if (!body.name || !body.project) {
      return NextResponse.json(
        { success: false, error: 'Name and project are required' },
        { status: 400 }
      );
    }

    const result = await query<AzDoSyncConfiguration>(
      `INSERT INTO AzDoSyncConfigurations (name, project, work_item_type, iteration_path, area_path, state, tags, focus_period_id) 
       OUTPUT INSERTED.*
       VALUES (@name, @project, @work_item_type, @iteration_path, @area_path, @state, @tags, @focus_period_id)`,
      {
        name: body.name,
        project: body.project,
        work_item_type: body.work_item_type || 'Ergebnis',
        iteration_path: body.iteration_path || null,
        area_path: body.area_path || null,
        state: body.state || null,
        tags: body.tags || null,
        focus_period_id: body.focus_period_id || null,
      }
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating sync configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sync configuration' },
      { status: 500 }
    );
  }
}
