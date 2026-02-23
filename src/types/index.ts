// Team types
export interface Team {
  id: number;
  name: string;
  description?: string;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  is_archived?: boolean;
}

// Team Member types
export interface TeamMember {
  id: number;
  team_id: number;
  name: string;
  email?: string;
  role?: string;
  default_capacity_days?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeamMemberInput {
  team_id: number;
  name: string;
  email?: string;
  role?: string;
  default_capacity_days?: number;
}

export interface UpdateTeamMemberInput {
  name?: string;
  email?: string;
  role?: string;
  default_capacity_days?: number;
  is_active?: boolean;
}

// Focus Period types
export interface FocusPeriod {
  id: number;
  name: string;
  start_date: Date;
  end_date: Date;
  capacity_model: number;
  azdo_iteration_path?: string;
  azdo_tag?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFocusPeriodInput {
  name: string;
  start_date: Date;
  end_date: Date;
  capacity_model?: number;
  azdo_iteration_path?: string;
  azdo_tag?: string;
}

export interface UpdateFocusPeriodInput {
  name?: string;
  start_date?: Date;
  end_date?: Date;
  capacity_model?: number;
  azdo_iteration_path?: string;
  azdo_tag?: string;
  is_active?: boolean;
}

// Work Item types
export interface WorkItem {
  id: number;
  azdo_id: number;
  title: string;
  state?: string;
  owner?: string;
  tags?: string;
  effort?: number;
  focus_period_id?: number;
  last_synced_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWorkItemInput {
  azdo_id: number;
  title: string;
  state?: string;
  owner?: string;
  tags?: string;
  effort?: number;
  focus_period_id?: number;
}

export interface UpdateWorkItemInput {
  title?: string;
  state?: string;
  owner?: string;
  tags?: string;
  effort?: number;
  focus_period_id?: number;
}

// Capacity Allocation types
export interface CapacityAllocation {
  id: number;
  team_member_id: number;
  work_item_id: number;
  focus_period_id: number;
  allocated_days: number;
  allocated_percentage?: number;
  start_date?: Date;
  end_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCapacityAllocationInput {
  team_member_id: number;
  work_item_id: number;
  focus_period_id: number;
  allocated_days: number;
  allocated_percentage?: number;
  start_date?: Date;
  end_date?: Date;
  notes?: string;
}

export interface UpdateCapacityAllocationInput {
  allocated_days?: number;
  allocated_percentage?: number;
  start_date?: Date;
  end_date?: Date;
  notes?: string;
}

// Member Availability types
export interface MemberAvailability {
  id: number;
  team_member_id: number;
  start_date: Date;
  end_date: Date;
  available_days: number;
  reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMemberAvailabilityInput {
  team_member_id: number;
  start_date: Date;
  end_date: Date;
  available_days: number;
  reason?: string;
}

export interface UpdateMemberAvailabilityInput {
  start_date?: Date;
  end_date?: Date;
  available_days?: number;
  reason?: string;
}

// Azure DevOps types
export interface AzDoWorkItem {
  id: number;
  fields: {
    'System.Title': string;
    'System.State': string;
    'System.AssignedTo'?: {
      displayName: string;
    };
    'System.Tags'?: string;
    'Microsoft.VSTS.Scheduling.Effort'?: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Capacity Overview types
export interface MemberCapacitySummary {
  member: TeamMember;
  total_available_days: number;
  total_allocated_days: number;
  utilization_percentage: number;
  variance_days: number;
  allocations: CapacityAllocation[];
}

export interface FocusCapacitySummary {
  focus_period: FocusPeriod;
  total_planned_effort: number;
  total_team_capacity: number;
  remaining_capacity: number;
  variance_percentage: number;
  member_summaries: MemberCapacitySummary[];
}

// Azure DevOps Sync Configuration types
export interface AzDoSyncConfiguration {
  id: number;
  name: string;
  project: string;
  work_item_type?: string;
  iteration_path?: string;
  area_path?: string;
  state?: string;
  tags?: string;
  focus_period_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAzDoSyncConfigurationInput {
  name: string;
  project: string;
  work_item_type?: string;
  iteration_path?: string;
  area_path?: string;
  state?: string;
  tags?: string;
  focus_period_id?: number;
}

export interface UpdateAzDoSyncConfigurationInput {
  name?: string;
  project?: string;
  work_item_type?: string;
  iteration_path?: string;
  area_path?: string;
  state?: string;
  tags?: string;
  focus_period_id?: number;
  is_active?: boolean;
}
