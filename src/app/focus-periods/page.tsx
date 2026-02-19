'use client';

import { useState, useEffect } from 'react';

interface FocusPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  capacity_model: number;
  azdo_iteration_path?: string;
  azdo_tag?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function FocusPeriodsPage() {
  const [periods, setPeriods] = useState<FocusPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    start_date: '',
    end_date: '',
    capacity_model: 80,
    azdo_iteration_path: '',
    azdo_tag: '',
  });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const response = await fetch('/api/focus-periods');
      const data = await response.json();
      if (data.success) {
        setPeriods(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch focus periods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/focus-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod),
      });
      const data = await response.json();
      if (data.success) {
        setPeriods([...periods, data.data]);
        setShowModal(false);
        setNewPeriod({
          name: '',
          start_date: '',
          end_date: '',
          capacity_model: 80,
          azdo_iteration_path: '',
          azdo_tag: '',
        });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create focus period');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading focus periods...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Focus Periods</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Focus Period
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periods.map((period) => (
          <div key={period.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{period.name}</h3>
              {period.is_active && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Capacity: {period.capacity_model}%
              </div>
              {period.azdo_iteration_path && (
                <div className="text-xs text-gray-500">
                  Iteration: {period.azdo_iteration_path}
                </div>
              )}
              {period.azdo_tag && (
                <div className="text-xs text-gray-500">
                  Tag: {period.azdo_tag}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {periods.length === 0 && !error && (
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No focus periods</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new focus period.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Add Focus Period
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Focus Period</h2>
            <form onSubmit={handleCreatePeriod}>
              <div className="mb-4">
                <label className="label">Period Name</label>
                <input
                  type="text"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., DEV Focus Q1 2025"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={newPeriod.start_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={newPeriod.end_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Capacity Model (%)</label>
                <input
                  type="number"
                  value={newPeriod.capacity_model}
                  onChange={(e) => setNewPeriod({ ...newPeriod, capacity_model: parseInt(e.target.value) })}
                  className="input w-full"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Azure DevOps Iteration Path (optional)</label>
                <input
                  type="text"
                  value={newPeriod.azdo_iteration_path}
                  onChange={(e) => setNewPeriod({ ...newPeriod, azdo_iteration_path: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Dev\\Q1 2025"
                />
              </div>
              <div className="mb-4">
                <label className="label">Azure DevOps Tag (optional)</label>
                <input
                  type="text"
                  value={newPeriod.azdo_tag}
                  onChange={(e) => setNewPeriod({ ...newPeriod, azdo_tag: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Focus1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
