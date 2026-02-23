import * as azdev from 'azure-devops-node-api';
import { WorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { AzDoWorkItem, WorkItem, CreateWorkItemInput } from '@/types';
import { query } from '@/lib/db';

export class AzureDevOpsService {
  private connection: azdev.WebApi;
  private witApi: Promise<WorkItemTrackingApi>;

  constructor() {
    const orgUrl = process.env.AZDO_ORG_URL;
    const token = process.env.AZDO_TOKEN;

    if (!orgUrl || !token) {
      throw new Error('Azure DevOps configuration is missing. Please set AZDO_ORG_URL and AZDO_TOKEN environment variables.');
    }

    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    this.connection = new azdev.WebApi(orgUrl, authHandler);
    this.witApi = this.connection.getWorkItemTrackingApi();
  }

  /**
   * Sync work items from Azure DevOps based on filters
   * Note: Azure DevOps API uses WIQL (Work Item Query Language) which is not susceptible 
   * to traditional SQL injection as it's parsed and validated by the Azure DevOps service.
   * However, we still sanitize input parameters to prevent any potential issues.
   */
  async syncWorkItems(params: {
    project: string;
    workItemType?: string;
    iterationPath?: string;
    areaPath?: string;
    state?: string;
    tags?: string;
    focusPeriodId?: number;
  }): Promise<WorkItem[]> {
    try {
      const witApi = await this.witApi;
      
      // Sanitize inputs by removing potentially harmful characters
      const sanitizeString = (str: string) => str.replace(/['"]/g, '');
      
      // Build WIQL query with sanitized inputs
      const workItemType = sanitizeString(params.workItemType || 'Ergebnis');
      let wiqlQuery = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.Tags], [Microsoft.VSTS.Scheduling.Effort]
                       FROM WorkItems
                       WHERE [System.WorkItemType] = '${workItemType}'`;

      if (params.iterationPath) {
        const iterationPath = sanitizeString(params.iterationPath);
        wiqlQuery += ` AND [System.IterationPath] UNDER '${iterationPath}'`;
      }

      if (params.areaPath) {
        const areaPath = sanitizeString(params.areaPath);
        wiqlQuery += ` AND [System.AreaPath] UNDER '${areaPath}'`;
      }

      if (params.state) {
        const state = sanitizeString(params.state);
        wiqlQuery += ` AND [System.State] = '${state}'`;
      }

      if (params.tags) {
        const tags = sanitizeString(params.tags);
        wiqlQuery += ` AND [System.Tags] CONTAINS '${tags}'`;
      }

      wiqlQuery += ' ORDER BY [System.Id] DESC';

      // Execute query
      const queryResult = await witApi.queryByWiql({ query: wiqlQuery }, { project: params.project } as any);

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        return [];
      }

      // Get work item IDs
      const workItemIds = queryResult.workItems.map(wi => wi.id!).filter(id => id !== undefined);

      // Fetch full work item details
      const workItems = await witApi.getWorkItems(
        workItemIds,
        ['System.Title', 'System.State', 'System.AssignedTo', 'System.Tags', 'Microsoft.VSTS.Scheduling.Effort'],
        undefined,
        undefined,
        undefined,
        params.project
      );

      // Save to database
      const syncedItems: WorkItem[] = [];
      
      for (const wi of workItems) {
        if (!wi.id || !wi.fields) continue;

        const workItemData: CreateWorkItemInput = {
          azdo_id: wi.id,
          title: wi.fields['System.Title'] || '',
          state: wi.fields['System.State'],
          owner: wi.fields['System.AssignedTo']?.displayName,
          tags: wi.fields['System.Tags'],
          effort: wi.fields['Microsoft.VSTS.Scheduling.Effort'],
          focus_period_id: params.focusPeriodId,
        };

        // Upsert work item
        const result = await this.upsertWorkItem(workItemData);
        syncedItems.push(result);

        // Auto-create capacity allocation if work item has owner and effort
        if (result.owner && result.effort && params.focusPeriodId) {
          await this.syncCapacityAllocation(result, params.focusPeriodId);
        }
      }

      return syncedItems;
    } catch (error) {
      console.error('Error syncing work items from Azure DevOps:', error);
      throw error;
    }
  }

  /**
   * Upsert a work item into the database
   */
  private async upsertWorkItem(workItem: CreateWorkItemInput): Promise<WorkItem> {
    try {
      // Check if work item exists
      const existing = await query<WorkItem>(
        'SELECT * FROM WorkItems WHERE azdo_id = @azdo_id',
        { azdo_id: workItem.azdo_id }
      );

      if (existing.length > 0) {
        // Update existing work item
        const result = await query<WorkItem>(
          `UPDATE WorkItems
           SET title = @title,
               state = @state,
               owner = @owner,
               tags = @tags,
               effort = @effort,
               focus_period_id = @focus_period_id,
               last_synced_at = GETDATE(),
               updated_at = GETDATE()
           OUTPUT INSERTED.*
           WHERE azdo_id = @azdo_id`,
          {
            azdo_id: workItem.azdo_id,
            title: workItem.title,
            state: workItem.state,
            owner: workItem.owner,
            tags: workItem.tags,
            effort: workItem.effort,
            focus_period_id: workItem.focus_period_id,
          }
        );
        return result[0];
      } else {
        // Insert new work item
        const result = await query<WorkItem>(
          `INSERT INTO WorkItems (azdo_id, title, state, owner, tags, effort, focus_period_id, last_synced_at)
           OUTPUT INSERTED.*
           VALUES (@azdo_id, @title, @state, @owner, @tags, @effort, @focus_period_id, GETDATE())`,
          {
            azdo_id: workItem.azdo_id,
            title: workItem.title,
            state: workItem.state,
            owner: workItem.owner,
            tags: workItem.tags,
            effort: workItem.effort,
            focus_period_id: workItem.focus_period_id,
          }
        );
        return result[0];
      }
    } catch (error) {
      console.error('Error upserting work item:', error);
      throw error;
    }
  }

  /**
   * Sync capacity allocation for a work item
   * Matches Azure DevOps owner to team member and creates/updates allocation
   */
  private async syncCapacityAllocation(workItem: WorkItem, focusPeriodId: number): Promise<void> {
    try {
      // Try to find matching team member by name or email
      const teamMembers = await query<{ id: number; name: string; email: string }>(
        'SELECT id, name, email FROM TeamMembers WHERE is_active = 1'
      );

      const owner = workItem.owner!;
      let matchedMemberId: number | null = null;

      // Try exact name match first
      const exactMatch = teamMembers.find(m => m.name.toLowerCase() === owner.toLowerCase());
      if (exactMatch) {
        matchedMemberId = exactMatch.id;
      } else {
        // Try partial name match (e.g., "John Doe" matches "Doe, John")
        const nameParts = owner.toLowerCase().split(/[\s,]+/).filter(p => p.length > 0);
        const partialMatch = teamMembers.find(m => {
          const memberNameLower = m.name.toLowerCase();
          return nameParts.every(part => memberNameLower.includes(part));
        });
        if (partialMatch) {
          matchedMemberId = partialMatch.id;
        }
      }

      if (!matchedMemberId) {
        console.warn(`Could not match Azure DevOps owner "${owner}" to any team member for work item ${workItem.azdo_id}`);
        return;
      }

      // Check if allocation already exists
      const existingAllocation = await query(
        `SELECT id, allocated_days FROM CapacityAllocations 
         WHERE work_item_id = @work_item_id AND team_member_id = @team_member_id AND focus_period_id = @focus_period_id`,
        {
          work_item_id: workItem.id,
          team_member_id: matchedMemberId,
          focus_period_id: focusPeriodId,
        }
      );

      const allocatedDays = workItem.effort || 0;

      if (existingAllocation.length > 0) {
        // Update existing allocation
        await query(
          `UPDATE CapacityAllocations
           SET allocated_days = @allocated_days,
               updated_at = GETDATE()
           WHERE id = @id`,
          {
            id: existingAllocation[0].id,
            allocated_days: allocatedDays,
          }
        );
      } else {
        // Create new allocation
        await query(
          `INSERT INTO CapacityAllocations (team_member_id, work_item_id, focus_period_id, allocated_days)
           VALUES (@team_member_id, @work_item_id, @focus_period_id, @allocated_days)`,
          {
            team_member_id: matchedMemberId,
            work_item_id: workItem.id,
            focus_period_id: focusPeriodId,
            allocated_days: allocatedDays,
          }
        );
      }
    } catch (error) {
      console.error('Error syncing capacity allocation:', error);
      // Don't throw - we don't want to fail the entire sync if one allocation fails
    }
  }

  /**
   * Get a single work item from Azure DevOps
   */
  async getWorkItem(workItemId: number, project: string): Promise<AzDoWorkItem | null> {
    try {
      const witApi = await this.witApi;
      const workItem = await witApi.getWorkItem(workItemId, undefined, undefined, undefined, project);
      return workItem as AzDoWorkItem;
    } catch (error) {
      console.error('Error fetching work item from Azure DevOps:', error);
      return null;
    }
  }
}

// Singleton instance
let azureDevOpsService: AzureDevOpsService | null = null;

export function getAzureDevOpsService(): AzureDevOpsService {
  if (!azureDevOpsService) {
    azureDevOpsService = new AzureDevOpsService();
  }
  return azureDevOpsService;
}
