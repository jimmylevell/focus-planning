import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { WorkItem, AzDoSyncConfiguration } from '@/types';

// GET /api/work-items - List all work items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const focusPeriodId = searchParams.get('focus_period_id');

    let queryString = 'SELECT * FROM WorkItems';
    const params: Record<string, any> = {};

    if (focusPeriodId) {
      queryString += ' WHERE focus_period_id = @focus_period_id';
      params.focus_period_id = focusPeriodId;
    }

    queryString += ' ORDER BY azdo_id DESC';

    const workItems = await query<WorkItem>(queryString, Object.keys(params).length > 0 ? params : undefined);
    return NextResponse.json({ success: true, data: workItems });
  } catch (error) {
    console.error('Error fetching work items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work items' },
      { status: 500 }
    );
  }
}

// POST /api/work-items - Sync work items from Azure DevOps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support syncing allocations only (for existing work items)
    if (body.syncAllocationsOnly && body.focusPeriodId) {
      const { getAzureDevOpsService } = await import('@/lib/services/azureDevOps');
      const azDoService = getAzureDevOpsService();
      const result = await azDoService.syncAllocationsForFocusPeriod(body.focusPeriodId);

      return NextResponse.json({
        success: true,
        data: result,
        message: `Synced ${result.synced} allocations, skipped ${result.skipped}, failed ${result.failed}`
      });
    }

    // Support syncing from a saved configuration ID
    let syncParams;
    if (body.syncConfigId) {
      const configs = await query<AzDoSyncConfiguration>(
        'SELECT * FROM AzDoSyncConfigurations WHERE id = @id AND is_active = 1',
        { id: body.syncConfigId }
      );

      if (configs.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Sync configuration not found' },
          { status: 404 }
        );
      }

      const config = configs[0];
      syncParams = {
        project: config.project,
        workItemType: config.work_item_type,
        iterationPath: config.iteration_path,
        areaPath: config.area_path,
        state: config.state,
        tags: config.tags,
        focusPeriodId: config.focus_period_id,
      };
    } else {
      // Use provided parameters directly
      if (!body.project) {
        return NextResponse.json(
          { success: false, error: 'Project is required' },
          { status: 400 }
        );
      }

      syncParams = {
        project: body.project,
        workItemType: body.workItemType,
        iterationPath: body.iterationPath,
        areaPath: body.areaPath,
        state: body.state,
        tags: body.tags,
        focusPeriodId: body.focusPeriodId,
      };
    }

    // Import the Azure DevOps service dynamically to avoid issues
    const { getAzureDevOpsService } = await import('@/lib/services/azureDevOps');
    const azDoService = getAzureDevOpsService();

    const syncedItems = await azDoService.syncWorkItems(syncParams);

    return NextResponse.json({
      success: true,
      data: syncedItems,
      message: `Synced ${syncedItems.length} work items`
    }, { status: 201 });
  } catch (error) {
    console.error('Error syncing work items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync work items' },
      { status: 500 }
    );
  }
}
