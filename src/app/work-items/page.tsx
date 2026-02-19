'use client';

import { useState, useEffect } from 'react';

interface WorkItem {
  id: number;
  azdo_id: number;
  title: string;
  state?: string;
  owner?: string;
  tags?: string;
  effort?: number;
  focus_period_id?: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

interface FocusPeriod {
  id: number;
  name: string;
}

export default function WorkItemsPage() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [hasValidSyncParams, setHasValidSyncParams] = useState(false);
  const [syncParams, setSyncParams] = useState({
    project: '',
    workItemType: 'Ergebnis',
    iterationPath: '',
    areaPath: '',
    state: '',
    tags: '',
    focusPeriodId: '',
  });

  useEffect(() => {
    fetchWorkItems();
    fetchFocusPeriods();
    
    // Load sync params from localStorage on mount
    const savedParams = localStorage.getItem('workItemsSyncParams');
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        setSyncParams(parsed);
        setHasValidSyncParams(!!parsed.project); // Has valid params if project is set
      } catch (err) {
        console.error('Failed to parse saved sync params:', err);
      }
    }
  }, []);

  const fetchWorkItems = async () => {
    try {
      const response = await fetch('/api/work-items');
      const data = await response.json();
      if (data.success) {
        setWorkItems(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch work items');
    } finally {
      setLoading(false);
    }
  };

  const fetchFocusPeriods = async () => {
    try {
      const response = await fetch('/api/focus-periods');
      const data = await response.json();
      if (data.success) {
        setFocusPeriods(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch focus periods:', err);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: syncParams.project,
          workItemType: syncParams.workItemType || undefined,
          iterationPath: syncParams.iterationPath || undefined,
          areaPath: syncParams.areaPath || undefined,
          state: syncParams.state || undefined,
          tags: syncParams.tags || undefined,
          focusPeriodId: syncParams.focusPeriodId ? parseInt(syncParams.focusPeriodId) : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWorkItems(data.data);
        setShowSyncModal(false);
        setHasValidSyncParams(true); // Mark that we have valid params for refresh
        // Save sync params to localStorage for persistence across page refreshes
        localStorage.setItem('workItemsSyncParams', JSON.stringify(syncParams));
        // Don't reset form - keep previous values for next sync
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to sync work items from Azure DevOps');
    } finally {
      setSyncing(false);
    }
  };

  const handleRefreshSync = async () => {
    if (!hasValidSyncParams || !syncParams.project) return;
    
    setSyncing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: syncParams.project,
          workItemType: syncParams.workItemType || undefined,
          iterationPath: syncParams.iterationPath || undefined,
          areaPath: syncParams.areaPath || undefined,
          state: syncParams.state || undefined,
          tags: syncParams.tags || undefined,
          focusPeriodId: syncParams.focusPeriodId ? parseInt(syncParams.focusPeriodId) : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setWorkItems(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to sync work items from Azure DevOps');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading work items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Work Items</h1>
        <div className="flex space-x-2">
          {hasValidSyncParams && (
            <button
              onClick={handleRefreshSync}
              className="btn-secondary"
              disabled={syncing}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          <button
            onClick={() => setShowSyncModal(true)}
            className="btn-primary"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync from Azure DevOps
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Effort
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Synced
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.azdo_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {item.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {item.state || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.owner || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.effort || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(item.last_synced_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {workItems.length === 0 && !error && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No work items</h3>
          <p className="mt-1 text-sm text-gray-500">Sync work items from Azure DevOps to get started.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowSyncModal(true)}
              className="btn-primary"
            >
              Sync from Azure DevOps
            </button>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Sync Work Items from Azure DevOps</h2>
            <form onSubmit={handleSync}>
              <div className="mb-4">
                <label className="label">Project Name *</label>
                <input
                  type="text"
                  value={syncParams.project}
                  onChange={(e) => setSyncParams({ ...syncParams, project: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., MyProject"
                  required
                  disabled={syncing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The Azure DevOps project name to sync from
                </p>
              </div>
              <div className="mb-4">
                <label className="label">Work Item Type</label>
                <input
                  type="text"
                  value={syncParams.workItemType}
                  onChange={(e) => setSyncParams({ ...syncParams, workItemType: e.target.value })}
                  className="input w-full"
                  placeholder="Ergebnis"
                  disabled={syncing}
                />
              </div>
              <div className="mb-4">
                <label className="label">Iteration Path (optional)</label>
                <input
                  type="text"
                  value={syncParams.iterationPath}
                  onChange={(e) => setSyncParams({ ...syncParams, iterationPath: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Dev\\Q1 2025"
                  disabled={syncing}
                />
              </div>
              <div className="mb-4">
                <label className="label">Area Path (optional)</label>
                <input
                  type="text"
                  value={syncParams.areaPath}
                  onChange={(e) => setSyncParams({ ...syncParams, areaPath: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Dev\\Team1"
                  disabled={syncing}
                />
              </div>
              <div className="mb-4">
                <label className="label">State (optional)</label>
                <input
                  type="text"
                  value={syncParams.state}
                  onChange={(e) => setSyncParams({ ...syncParams, state: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Active"
                  disabled={syncing}
                />
              </div>
              <div className="mb-4">
                <label className="label">Tags (optional)</label>
                <input
                  type="text"
                  value={syncParams.tags}
                  onChange={(e) => setSyncParams({ ...syncParams, tags: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Focus1"
                  disabled={syncing}
                />
              </div>
              <div className="mb-4">
                <label className="label">Link to Focus Period (optional)</label>
                <select
                  value={syncParams.focusPeriodId}
                  onChange={(e) => setSyncParams({ ...syncParams, focusPeriodId: e.target.value })}
                  className="input w-full"
                  disabled={syncing}
                >
                  <option value="">-- Select Focus Period --</option>
                  {focusPeriods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSyncModal(false)}
                  className="btn-secondary"
                  disabled={syncing}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={syncing}>
                  {syncing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    'Sync Work Items'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
