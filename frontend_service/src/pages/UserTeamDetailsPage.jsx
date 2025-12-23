import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { Users, Briefcase, ArrowLeft, X, UserMinus, Edit2, Calendar, Filter, ArrowUpDown, Plus, Save } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext';
import { useConfirm } from '../context/ConfirmContext';

export default function UserTeamDetailsPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { flash } = useFlash();
  const { ask } = useConfirm();

  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Permissions
  const isLeader = team?.leader_id === user?.username;

  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');

  // Filters
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [sortByDue, setSortByDue] = useState(false);

  // --- NEW: CREATE TASK MODAL STATE ---
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'MEDIUM',
    due_date: ''
  });

  const fetchTasks = useCallback(async () => {
    try {
      const filters = {};
      if (taskStatusFilter) filters.status = taskStatusFilter;
      if (sortByDue) filters.sort_by_due = true;
      const { data } = await api.tasks.getByTeam(teamId, filters);
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks filters", err);
    }
  }, [teamId, taskStatusFilter, sortByDue]);

  useEffect(() => {
    const initData = async () => {
      try {
        const promises = [api.teams.getOne(teamId)];
        
        const [teamRes] = await Promise.all(promises);
        setTeam(teamRes.data);
        setEditForm({ name: teamRes.data.name, description: teamRes.data.description });
        
        if (teamRes.data.leader_id === user.username) {
            const usersRes = await api.users.getAll();
            setAllUsers(usersRes.data.filter(u => u.active));
        }

        await fetchTasks();

      } catch (err) {
        flash("Failed to load team.", "error");
        navigate('/teams');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [teamId, navigate, user.username, flash]);

  useEffect(() => {
    if (!loading) fetchTasks();
  }, [fetchTasks]);

  const handleUpdateDetails = async () => {
    try {
      await api.teams.update(teamId, editForm);
      setTeam({ ...team, ...editForm });
      setIsEditing(false);
      flash("Team details updated successfully.", "success");
    } catch (err) {
      flash("Failed to update details.", "error");
    }
  };

  const handleAddMember = async () => {
    if (!selectedNewMember) return;
    try {
        await api.teams.addMember(teamId, selectedNewMember);
        setTeam({
            ...team,
            member_ids: [...team.member_ids, selectedNewMember]
        });
        setSelectedNewMember('');
        setIsAddingMember(false);
        flash(`Member ${selectedNewMember} added.`, "success");
    } catch (err) {
        flash("Failed to add member.", "error");
    }
  };

  const handleRemoveMember = (memberUsername) => {
    ask(
      `Remove ${memberUsername}?`,
      async () => {
        try {
          await api.teams.removeMember(teamId, memberUsername);
          setTeam({
            ...team,
            member_ids: team.member_ids.filter(m => m !== memberUsername)
          });
          flash(`Member ${memberUsername} removed.`, "success");
        } catch (err) {
          flash("Failed to remove member.", "error");
        }
      },
      "Remove Member"
    );
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.title || !newTaskForm.assigned_to || !newTaskForm.due_date) {
        flash("Please fill in all required fields.", "error");
        return;
    }

    try {
        const payload = {
            ...newTaskForm,
            team_id: teamId,
            due_date: new Date(newTaskForm.due_date).toISOString()
        };
        await api.tasks.create(payload);
        
        await fetchTasks();
        
        setNewTaskForm({ title: '', description: '', assigned_to: '', priority: 'MEDIUM', due_date: '' });
        setIsCreatingTask(false);
        flash("Task created successfully.", "success");
    } catch (err) {
        flash(`Failed to create task: ${err.response?.data?.detail || 'Unknown error'}`, "error");
    }
  };

  if (loading) return <div className="p-8 text-center text-text-main">Loading Team...</div>;
  if (!team) return null;

  const availableUsersOptions = allUsers
    .filter(u => !team.member_ids.includes(u.username))
    .map(u => ({ value: u.username, label: `${u.username} (${u.first_name} ${u.last_name})` }));

  return (
    <div>
      <Link to="/teams" className="mb-4 inline-block text-text-muted hover:text-text-main">
        ← Back to My Teams
      </Link>

      {/* HEADER */}
      <div className="bg-bg-card shadow-md rounded-lg p-6 mb-6 border-l-4 border-brand">
        <div className="flex justify-between items-start">
          <div className="w-full">
            {isEditing ? (
              <div className="space-y-3 max-w-lg">
                <input className="text-2xl font-bold border p-2 rounded w-full bg-bg-card text-text-main" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                <textarea className="text-text-muted border p-2 rounded w-full bg-bg-card" rows="2" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} />
                <div className="flex space-x-2">
                    <button onClick={handleUpdateDetails} className="flex items-center bg-green-600 text-white px-3 py-1 rounded text-sm"><Save className="w-4 h-4 mr-1" /> Save</button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center bg-gray-500 text-white px-3 py-1 rounded text-sm"><X className="w-4 h-4 mr-1" /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-text-main flex items-center">
                    {team.name}
                    {isLeader && <button onClick={() => setIsEditing(true)} className="ml-3 text-text-muted hover:text-brand" title="Edit Details"><Edit2 className="w-5 h-5" /></button>}
                </h1>
                <p className="text-text-muted mt-2">{team.description || "No description provided."}</p>
              </>
            )}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-text-muted border-t border-gray-100 pt-4">
            <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Created: {new Date(team.created_at).toLocaleDateString('en-GB')}</div>
            <div className="flex items-center"><Users className="w-4 h-4 mr-2" /> Members: {team.member_ids.length}</div>
            <div className="flex items-center"><Briefcase className="w-4 h-4 mr-2" /> Tasks: {tasks.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT: MEMBERS */}
        <div className="space-y-6">
            <div className="bg-bg-card shadow rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-text-muted mb-4 uppercase text-xs tracking-wider">Team Members</h3>
                
                {isLeader && !isAddingMember && (
                    <button onClick={() => setIsAddingMember(true)} className="text-xs text-brand hover:underline mb-4 flex items-center">+ Add Member</button>
                )}

                {isAddingMember && (
                    <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200">
                        <SearchableSelect options={availableUsersOptions} value={selectedNewMember} onChange={setSelectedNewMember} placeholder="Select user..." />
                        <div className="flex justify-end space-x-2 mt-2">
                            <button onClick={() => setIsAddingMember(false)} className="text-xs text-gray-500">Cancel</button>
                            <button onClick={handleAddMember} disabled={!selectedNewMember} className="text-xs bg-primary text-text-on-primary px-2 py-1 rounded">Add</button>
                        </div>
                    </div>
                )}

                <ul className="divide-y divide-gray-100">
                    {/* --- LEADER --- */}
                    <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                            {/* --- Leader Avatar --- */}
                            <UserAvatar username={team.leader_id} className="h-8 w-8 rounded-full mr-3 border border-brand/20" />
                            <div>
                                <Link to={`/users/${team.leader_id}`} className="text-sm font-medium text-text-main hover:text-brand hover:underline">
                                    {team.leader_id}
                                </Link>
                                <div className="text-[10px] text-text-muted uppercase">Leader</div>
                            </div>
                        </div>
                    </li>
                    
                    {/* --- MEMBERS --- */}
                    {team.member_ids.map(member => (
                        member !== team.leader_id && (
                            <li key={member} className="py-3 flex justify-between items-center">
                                <div className="flex items-center">
                                    {/* --- Member Avatar --- */}
                                    <UserAvatar username={member} className="h-8 w-8 rounded-full mr-3" />
                                    <Link to={`/users/${member}`} className="text-sm font-medium text-text-main hover:text-brand hover:underline">{member}</Link>
                                </div>
                                {isLeader && (
                                    <button onClick={() => handleRemoveMember(member)} className="text-red-400 hover:text-red-600 p-1" title="Remove"><UserMinus className="w-4 h-4" /></button>
                                )}
                            </li>
                        )
                    ))}
                </ul>
            </div>
        </div>

        {/* RIGHT: TASKS */}
        <div className="md:col-span-2">
            <div className="bg-bg-card shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 bg-bg-card flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <h3 className="font-bold text-text-muted uppercase text-xs tracking-wider">Tasks</h3>
                    
                    <div className="flex items-center space-x-3">
                        {isLeader && (
                            <button 
                                onClick={() => setIsCreatingTask(true)}
                                className="flex items-center bg-primary hover:bg-primary-hover text-text-on-primary px-3 py-1 rounded text-xs font-medium transition shadow-sm mr-2"
                            >
                                <Plus className="w-5 h-5 mr-3" /> NEW TASK
                            </button>
                        )}
                        
                        <div className="relative">
                            <select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="appearance-none bg-bg-card border border-gray-300 text-text-main py-1 px-3 pr-8 rounded leading-tight focus:outline-none focus:border-brand text-xs font-medium cursor-pointer">
                                <option value="">ALL STATUSES</option>
                                <option value="TODO">TODO</option>
                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                <option value="DONE">DONE</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted"><Filter className="w-3 h-3" /></div>
                        </div>
                        <button onClick={() => setSortByDue(!sortByDue)} className={`flex items-center px-3 py-1 rounded border text-xs font-medium transition-colors ${sortByDue ? 'bg-brand/20 border-brand text-brand' : 'bg-bg-card border-gray-300 text-text-muted hover:bg-bg-card'}`}><ArrowUpDown className="w-3 h-3 mr-1" /> Date</button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-bg-card">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Assigned To</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase">Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-bg-card divide-y divide-gray-200">
                            {tasks.length > 0 ? (
                                tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-bg-card transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold">
                                            <Link to={`/teams/${teamId}/tasks/${task.id}`} className="text-brand hover:underline">{task.title}</Link>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted">
                                            {/* CLICKABLE ASSIGNED TO */}
                                            <Link to={`/users/${task.assigned_to}`} className="hover:text-brand hover:underline">
                                                {task.assigned_to}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${task.status === 'DONE' ? 'bg-green-100 text-green-800' : task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{task.status.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`font-bold text-xs ${task.priority === 'URGENT' ? 'text-red-600' : task.priority === 'MEDIUM' ? 'text-orange-500' : 'text-green-600'}`}>{task.priority}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted">{new Date(task.due_date).toLocaleDateString('en-GB')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-text-muted">No tasks found matching filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {isCreatingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-bg-card rounded-lg shadow-xl w-full max-w-md border border-gray-200 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-text-main">Create New Task</h2>
                    <button onClick={() => setIsCreatingTask(false)} className="text-text-muted hover:text-text-main">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleCreateTask} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Title *</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-bg-card text-text-main focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                            value={newTaskForm.title}
                            onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Description</label>
                        <textarea 
                            rows="3"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-bg-card text-text-main focus:ring-2 focus:ring-brand focus:border-transparent outline-none"
                            value={newTaskForm.description}
                            onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Assign To *</label>
                            <select 
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-bg-card text-text-main focus:ring-brand outline-none"
                                value={newTaskForm.assigned_to}
                                onChange={(e) => setNewTaskForm({...newTaskForm, assigned_to: e.target.value})}
                            >
                                <option value="">Select Member</option>
                                {team.member_ids.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-1">Due Date *</label>
                            <input 
                                type="date" 
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-bg-card text-text-main focus:ring-brand outline-none"
                                value={newTaskForm.due_date}
                                onChange={(e) => setNewTaskForm({...newTaskForm, due_date: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main mb-1">Priority</label>
                        <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-bg-card text-text-main focus:ring-brand outline-none"
                            value={newTaskForm.priority}
                            onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value})}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsCreatingTask(false)}
                            className="px-4 py-2 text-sm font-medium text-text-muted hover:bg-gray-100 rounded-md transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-md transition"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}

// --- HELPER COMPONENT FOR AVATAR ---
// Defined safely outside the main component
function UserAvatar({ username, className }) {
    // 1. Hook to manage image loading error state
    const [error, setError] = useState(false);
    
    // 2. Generate the image URL directly from the helper function in API
    const url = api.users.getAvatarUrl(username);

    // 3. Fallback: If image fails to load (404), show initials
    if (error) {
        return (
            <div className={`${className} bg-brand/10 flex items-center justify-center text-brand font-bold text-xs`}>
                {username ? username.substring(0, 2).toUpperCase() : '??'}
            </div>
        );
    }

    // 4. Default: Try to show the image
    return (
        <img 
            src={url} 
            alt={username} 
            className={`${className} object-cover`} 
            onError={() => setError(true)} 
        />
    );
}