import { useEffect, useState } from 'react';
import { api } from '../api/endpoints';
import { Trash2, Filter, Users, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../components/SearchableSelect';
import { useFlash } from '../context/FlashContext';
import { useConfirm } from '../context/ConfirmContext';

export default function AdminTeamsPage() {
  const { flash } = useFlash();
  const { ask } = useConfirm(); 

  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedLeader, setSelectedLeader] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    leader_username: '' 
  });

  const getErrorMessage = (err) => {
    if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'object') {
            return JSON.stringify(detail);
        }
        return detail;
    }
    return 'An unexpected error occurred.';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, usersRes] = await Promise.all([
        api.teams.getAll(),
        api.users.getAll()
      ]);

      setTeams(teamsRes.data);
      const activeUsers = usersRes.data.filter(u => u.active); 
      setAllUsers(activeUsers);

    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const userOptions = allUsers.map(user => ({
    value: user.username,
    label: `${user.username} (${user.first_name} ${user.last_name}) - [${user.role}]`
  }));

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    
    if (!newTeam.name || !newTeam.leader_username) {
        flash("Please provide a team name and select a leader." , 'error');
        return;
    }

    setCreating(true);
    try {
        const { data } = await api.teams.create(newTeam);
        setTeams([...teams, data]);
        setNewTeam({ name: '', description: '', leader_username: '' });
        setIsModalOpen(false);
    } catch (err) {
        flash(`Failed to create team: ${getErrorMessage(err)}`, 'error');
    } finally {
        setCreating(false);
    }
  };

  const handleDelete = (teamId, teamName) => {
    ask(
      `Are you sure you want to delete the team "${teamName}"?`,
      async () => {
        // This code only runs if they click "Confirm"
        try {
          await api.teams.delete(teamId);
          setTeams(teams.filter(t => t.id !== teamId));
          flash(`Team "${teamName}" deleted successfully.`, 'success');
        } catch (err) {
          flash(`Failed to delete team: ${getErrorMessage(err)}`, 'error');
        }
      },
      "Deleting a team"
    );
  };

  const filteredTeams = selectedLeader 
    ? teams.filter(team => team.leader_id === selectedLeader)
    : teams;

  if (loading) return <div className="p-6 text-text-main">Loading teams...</div>;
  if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

  return (
    <div className="relative min-h-[500px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Team Management</h1>
        
        {/* --- BUTTON UPDATED: bg-blue-600 -> bg-primary --- */}
        <button 
            className="bg-primary hover:bg-primary-hover text-text-on-primary px-4 py-2 rounded-lg font-medium transition shadow-sm flex items-center"
            onClick={() => setIsModalOpen(true)}
        >
            <Plus className="w-5 h-5 mr-1" /> Create New Team
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-bg-card p-4 rounded-lg shadow-sm border border-bg-card/40 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="flex items-center text-text-muted md:col-span-1">
            <Filter className="w-5 h-5 mr-2" />
            <span className="font-medium">Filter by Leader:</span>
        </div>
        
        <div className="md:col-span-2">
            <SearchableSelect 
                options={userOptions}
                value={selectedLeader}
                onChange={(val) => setSelectedLeader(val)}
                placeholder="Search leader..."
            />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-bg-card shadow-md rounded-lg overflow-hidden border border-bg-card/40">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-bg-card">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Team Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Leader</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Members</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-bg-card divide-y divide-gray-200">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <tr key={team.id} className="hover:bg-bg-card/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-text-main">
                        {/* --- LINK UPDATED: text-blue-600 -> text-brand --- */}
                        <Link to={`/admin/teams/${team.id}`} className="text-brand hover:underline">
                            {team.name}
                        </Link>
                    </div>
                    <div className="text-sm text-text-muted truncate max-w-xs" title={team.description}>
                        {team.description || <em>No description</em>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        {/* --- AVATAR UPDATED: bg-blue-100 -> bg-brand/20 --- */}
                        <div className="h-8 w-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-xs mr-2 overflow-hidden border border-brand/20">
                          {allUsers.find(u => u.username === team.leader_id)?.avatar_filename ? (
                              <img src={api.users.getAvatarUrl(team.leader_id)} alt={team.leader_id} className="h-full w-full object-cover" />
                          ) : (
                              team.leader_id.substring(0, 2).toUpperCase()
                          )}
                      </div>
                        <span className="text-sm text-text-main font-medium">{team.leader_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-text-muted">
                        <Users className="w-4 h-4 mr-1" />
                        {team.member_ids.length} members
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                    {new Date(team.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleDelete(team.id, team.name)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition"
                      title="Delete Team"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                  {teams.length === 0 
                    ? "No teams found. Click 'Create New Team' to start!" 
                    : "No teams match the selected filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-bg-card rounded-lg shadow-xl w-full max-w-md border border-gray-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-text-main">Create New Team</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateTeam} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Team Name *</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-bg-card text-text-main"
                            value={newTeam.name}
                            onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Description</label>
                        <textarea 
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand focus:border-transparent outline-none bg-bg-card text-text-main"
                            value={newTeam.description}
                            onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Assign Leader *</label>
                        <SearchableSelect 
                            options={userOptions}
                            value={newTeam.leader_username} 
                            onChange={(val) => setNewTeam({...newTeam, leader_username: val})} 
                            placeholder="Search for a user..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-md transition"
                        >
                            Cancel
                        </button>
                        {/* --- BUTTON UPDATED --- */}
                        <button 
                            type="submit"
                            disabled={creating || allUsers.length === 0}
                            className="px-4 py-2 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-md transition disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}