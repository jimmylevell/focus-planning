'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_WORK_ITEM_TYPE } from '@/lib/constants/azureDevOps';

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

interface SyncConfiguration {
  id: number;
  name: string;
  project: string;
  work_item_type?: string;
  iteration_path?: string;
  area_path?: string;
  state?: string;
  tags?: string;
  focus_period_id?: number;
}

export default function WorkItemsPage() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [focusPeriods, setFocusPeriods] = useState<FocusPeriod[]>([]);
  const [syncConfigurations, setSyncConfigurations] = useState<SyncConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SyncConfiguration | null>(null);
  const [syncParams, setSyncParams] = useState({
    name: '',
    project: '',
    workItemType: DEFAULT_WORK_ITEM_TYPE,
    iterationPath: '',
    areaPath: '',
    state: '',
    tags: '',
    focusPeriodId: '',
  });

  useEffect(() => {
    fetchWorkItems();
    fetchFocusPeriods();
    fetchSyncConfigurations();
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

  const fetchSyncConfigurations = async () => {
    try {
      const response = await fetch('/api/azdo-sync-configs');
      const data = await response.json();
      if (data.success) {
        setSyncConfigurations(data.data);
        // Auto-select the first configuration if available
        if (data.data.length > 0 && !selectedConfig) {
          setSelectedConfig(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sync configurations:', err);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setError(null);
    
    try {
      // If editing an existing config, update it
      if (editingConfig) {
        const updateResponse = await fetch(`/api/azdo-sync-configs/${editingConfig.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: syncParams.name,
            project: syncParams.project,
            work_item_type: syncParams.workItemType || undefined,
            iteration_path: syncParams.iterationPath || undefined,
            area_path: syncParams.areaPath || undefined,
            state: syncParams.state || undefined,
            tags: syncParams.tags || undefined,
            focus_period_id: syncParams.focusPeriodId ? parseInt(syncParams.focusPeriodId) : undefined,
          }),
        });
        const updateData = await updateResponse.json();
        if (!updateData.success) {
          setError(updateData.error);
          setSyncing(false);
          return;
        }
      } else {
        // Save as new configuration
        const configResponse = await fetch('/api/azdo-sync-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: syncParams.name,
            project: syncParams.project,
            work_item_type: syncParams.workItemType || undefined,
            iteration_path: syncParams.iterationPath || undefined,
            area_path: syncParams.areaPath || undefined,
            state: syncParams.state || undefined,
            tags: syncParams.tags || undefined,
            focus_period_id: syncParams.focusPeriodId ? parseInt(syncParams.focusPeriodId) : undefined,
          }),
        });
        const configData = await configResponse.json();
        if (!configData.success) {
          setError(configData.error);
          setSyncing(false);
          return;
        }
        setSelectedConfig(configData.data.id);
      }

      // Sync work items using the configuration
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
        setEditingConfig(null);
        // Refresh configurations list
        fetchSyncConfigurations();
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
    if (!selectedConfig) return;
    
    setSyncing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncConfigId: selectedConfig,
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

  const openEditModal = (config: SyncConfiguration) => {
    setEditingConfig(config);
    setSyncParams({
      name: config.name,
      project: config.project,
      workItemType: config.work_item_type || DEFAULT_WORK_ITEM_TYPE,
      iterationPath: config.iteration_path || '',
      areaPath: config.area_path || '',
      state: config.state || '',
      tags: config.tags || '',
      focusPeriodId: config.focus_period_id?.toString() || '',
    });
    setShowSyncModal(true);
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    setSyncParams({
      name: '',
      project: '',
      workItemType: DEFAULT_WORK_ITEM_TYPE,
      iterationPath: '',
      areaPath: '',
      state: '',
      tags: '',
      focusPeriodId: '',
    });
    setShowSyncModal(true);
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm('Are you sure you want to delete this sync configuration?')) return;
    
    try {
      const response = await fetch(`/api/azdo-sync-configs/${configId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchSyncConfigurations();
        if (selectedConfig === configId) {
          setSelectedConfig(null);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete sync configuration');
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
          <button
            onClick={openCreateModal}
            className="btn-primary"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Sync Configuration
          </button>
        </div>
      </div>

      {/* Sync Configuration Selector */}
      {syncConfigurations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Active Configuration:</label>
            <select
              value={selectedConfig || ''}
              onChange={(e) => setSelectedConfig(e.target.value ? parseInt(e.target.value) : null)}
              className="input flex-1"
            >
              <option value="">-- Select Configuration --</option>
              {syncConfigurations.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </select>
            {selectedConfig && (
              <>
                <button
                  onClick={handleRefreshSync}
                  className="btn-secondary"
                  disabled={syncing}
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  onClick={() => {
                    const config = syncConfigurations.find(c => c.id === selectedConfig);
                    if (config) openEditModal(config);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit configuration"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteConfig(selectedConfig)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete configuration"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
          <p className="mt-1 text-sm text-gray-500">Create a sync configuration and sync work items from Azure DevOps to get started.</p>
          <div className="mt-6">
            <button
              onClick={openCreateModal}
              className="btn-primary"
            >
              Create Sync Configuration
            </button>
          </div>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingConfig ? 'Edit Sync Configuration' : 'Create Sync Configuration'}
            </h2>
            <form onSubmit={handleSync}>
              <div className="mb-4">
                <label className="label">Configuration Name *</label>
                <input
                  type="text"
                  value={syncParams.name}
                  onChange={(e) => setSyncParams({ ...syncParams, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Q1 2025 Focus Items"
                  required
                  disabled={syncing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  A descriptive name for this sync configuration
                </p>
              </div>
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
                  placeholder={DEFAULT_WORK_ITEM_TYPE}
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
                  onClick={() => {
                    setShowSyncModal(false);
                    setEditingConfig(null);
                  }}
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
                      {editingConfig ? 'Updating...' : 'Syncing...'}
                    </>
                  ) : (
                    editingConfig ? 'Update & Sync' : 'Save & Sync Work Items'
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
