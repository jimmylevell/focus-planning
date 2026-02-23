'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  id: number;
  name: string;
  email?: string;
  default_capacity_days?: number;
  team_name?: string;
}

interface CapacityAllocation {
  id: number;
  team_member_id: number;
  work_item_id: number;
  allocated_days: number;
  allocated_percentage?: number;
  work_item_title?: string;
  work_item_state?: string;
  work_item_azdo_id?: number;
  work_item_effort?: number;
  member_name?: string;
}

interface MemberCapacity {
  member: TeamMember;
  total_allocated: number;
  available_capacity: number;
  utilization: number;
}

export default function CapacityPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<CapacityAllocation[]>([]);
  const [capacitySummary, setCapacitySummary] = useState<MemberCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch active focus period first
      // API returns only active focus periods (WHERE is_active = 1) sorted by start_date DESC
      const focusPeriodsRes = await fetch('/api/focus-periods');
      const focusPeriodsData = await focusPeriodsRes.json();
      
      if (!focusPeriodsData.success || !focusPeriodsData.data || focusPeriodsData.data.length === 0) {
        setError('No active focus period found. Please create and activate a focus period first.');
        setLoading(false);
        return;
      }

      // Use the first active focus period (most recent by start_date)
      const activeFocusPeriod = focusPeriodsData.data[0];
      
      // Fetch members and allocations for the active focus period
      const [membersRes, allocationsRes] = await Promise.all([
        fetch('/api/members'),
        fetch(`/api/allocations?focus_period_id=${activeFocusPeriod.id}`),
      ]);

      const membersData = await membersRes.json();
      const allocationsData = await allocationsRes.json();

      if (membersData.success && allocationsData.success) {
        setMembers(membersData.data);
        setAllocations(allocationsData.data);
        
        // Calculate capacity summary
        const summary = calculateCapacitySummary(membersData.data, allocationsData.data);
        setCapacitySummary(summary);
      } else {
        setError('Failed to fetch capacity data');
      }
    } catch (err) {
      setError('Failed to load capacity overview');
    } finally {
      setLoading(false);
    }
  };

  const calculateCapacitySummary = (
    members: TeamMember[],
    allocations: CapacityAllocation[]
  ): MemberCapacity[] => {
    return members.map((member) => {
      const memberAllocations = allocations.filter(
        (a) => a.team_member_id === member.id
      );
      
      const total_allocated = memberAllocations.reduce(
        (sum, a) => sum + a.allocated_days,
        0
      );
      
      const available_capacity = member.default_capacity_days || 0;
      const utilization = available_capacity > 0
        ? (total_allocated / available_capacity) * 100
        : 0;

      return {
        member,
        total_allocated,
        available_capacity,
        utilization,
      };
    });
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 70) return 'bg-green-100 text-green-800';
    if (utilization < 90) return 'bg-yellow-100 text-yellow-800';
    if (utilization <= 100) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getUtilizationBarColor = (utilization: number) => {
    if (utilization < 70) return 'bg-green-500';
    if (utilization < 90) return 'bg-yellow-500';
    if (utilization <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading capacity overview...</div>
      </div>
    );
  }

  const totalCapacity = capacitySummary.reduce((sum, c) => sum + c.available_capacity, 0);
  const totalAllocated = capacitySummary.reduce((sum, c) => sum + c.total_allocated, 0);
  const overallUtilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Capacity Overview</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Capacity</h3>
          <p className="text-3xl font-bold text-gray-900">{totalCapacity.toFixed(1)} days</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Allocated</h3>
          <p className="text-3xl font-bold text-gray-900">{totalAllocated.toFixed(1)} days</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Utilization</h3>
          <p className={`text-3xl font-bold ${overallUtilization > 100 ? 'text-red-600' : 'text-gray-900'}`}>
            {overallUtilization.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Team Member Capacity */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Member Capacity</h2>
        
        {capacitySummary.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No team members found. Add team members to see capacity overview.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {capacitySummary.map((capacity) => (
              <div key={capacity.member.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{capacity.member.name}</h3>
                    {capacity.member.email && (
                      <p className="text-sm text-gray-500">{capacity.member.email}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getUtilizationColor(capacity.utilization)}`}>
                    {capacity.utilization.toFixed(1)}%
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="text-sm font-semibold">{capacity.available_capacity.toFixed(1)} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Allocated</p>
                    <p className="text-sm font-semibold">{capacity.total_allocated.toFixed(1)} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-sm font-semibold">
                      {(capacity.available_capacity - capacity.total_allocated).toFixed(1)} days
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all ${getUtilizationBarColor(capacity.utilization)}`}
                    style={{ width: `${Math.min(capacity.utilization, 100)}%` }}
                  ></div>
                </div>

                {/* Work Items List */}
                {(() => {
                  const memberAllocations = allocations.filter(a => a.team_member_id === capacity.member.id);
                  if (memberAllocations.length === 0) return null;
                  
                  return (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Work Items</h4>
                      <div className="space-y-2">
                        {memberAllocations.map((allocation) => (
                          <div key={allocation.id} className="flex items-start justify-between text-sm bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {allocation.work_item_azdo_id && (
                                  <span className="text-xs text-gray-500">#{allocation.work_item_azdo_id}</span>
                                )}
                                <span className="font-medium text-gray-900">
                                  {allocation.work_item_title || 'Untitled Work Item'}
                                </span>
                              </div>
                              {allocation.work_item_state && (
                                <span className="text-xs text-gray-500">
                                  Status: {allocation.work_item_state}
                                </span>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-semibold text-gray-900">
                                {allocation.allocated_days.toFixed(1)} days
                              </div>
                              {allocation.work_item_effort && Math.abs(allocation.work_item_effort - allocation.allocated_days) > 0.01 && (
                                <div className="text-xs text-gray-500">
                                  (effort: {allocation.work_item_effort})
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Utilization Heatmap Legend */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Utilization Legend</h3>
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
            <span>{'< 70%'} - Under-utilized</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-yellow-500 mr-2"></div>
            <span>70-90% - Well-balanced</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-orange-500 mr-2"></div>
            <span>90-100% - Near capacity</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded bg-red-500 mr-2"></div>
            <span>{'>100%'} - Over-allocated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
