'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  id: number;
  name: string;
  description?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: number;
  team_id: number;
  name: string;
  email?: string;
  role?: string;
  default_capacity_days?: number;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: number) => {
    setLoadingMembers(true);
    try {
      const response = await fetch(`/api/members?team_id=${teamId}`);
      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.data);
      } else {
        setError('Failed to fetch team members');
      }
    } catch (err) {
      setError('Failed to fetch team members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });
      const data = await response.json();
      if (data.success) {
        setTeams([...teams, data.data]);
        setShowModal(false);
        setNewTeam({ name: '', description: '' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create team');
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTeam.name,
          description: selectedTeam.description,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTeams(teams.map(t => t.id === selectedTeam.id ? data.data : t));
        setShowEditModal(false);
        setSelectedTeam(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update team');
    }
  };

  const handleViewMembers = async (team: Team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
    await fetchTeamMembers(team.id);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Team
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{team.name}</h3>
            {team.description && (
              <p className="text-gray-600 mb-4">{team.description}</p>
            )}
            <div className="flex space-x-2">
              <button 
                onClick={() => handleViewMembers(team)}
                className="text-blue-600 hover:text-blue-800"
              >
                View Members
              </button>
              <button 
                onClick={() => handleEditTeam(team)}
                className="text-gray-600 hover:text-gray-800"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && !error && (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Add Team
            </button>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <div className="mb-4">
                <label className="label">Team Name</label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Description</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="input w-full"
                  rows={3}
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
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Edit Team</h2>
            <form onSubmit={handleUpdateTeam}>
              <div className="mb-4">
                <label className="label">Team Name</label>
                <input
                  type="text"
                  value={selectedTeam.name}
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Description</label>
                <textarea
                  value={selectedTeam.description || ''}
                  onChange={(e) => setSelectedTeam({ ...selectedTeam, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeam(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {showMembersModal && selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Team Members - {selectedTeam.name}</h2>
            
            {loadingMembers ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading members...</div>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No members found for this team.</p>
                <p className="text-sm text-gray-400 mt-2">Add members to this team to see them here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        {member.email && (
                          <p className="text-sm text-gray-500">{member.email}</p>
                        )}
                        {member.role && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                            {member.role}
                          </span>
                        )}
                      </div>
                      {member.default_capacity_days && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Capacity</p>
                          <p className="font-semibold">{member.default_capacity_days} days</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedTeam(null);
                  setTeamMembers([]);
                }}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
