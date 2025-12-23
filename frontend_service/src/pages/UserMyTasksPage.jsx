import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { CheckCircle, Filter, ArrowUpDown, Briefcase, Calendar, Flag } from 'lucide-react';

export default function UserMyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]); 
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [sortByDue, setSortByDue] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data } = await api.teams.getAll();
        setTeams(data);
      } catch (err) {
        console.error("Failed to load teams for filter", err);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const tasksParams = {};
        if (statusFilter) tasksParams.status = statusFilter;
        if (sortByDue) tasksParams.sort_by_due = true;

        const { data } = await api.tasks.getMyTasks(tasksParams);
        setTasks(data);
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [statusFilter, sortByDue]);

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : `Unknown Team (${teamId})`;
  };

  const filteredTasks = teamFilter 
    ? tasks.filter(t => t.team_id === teamFilter)
    : tasks;

  const getPriorityColor = (p) => {
    if (p === 'URGENT') return 'text-red-300 bg-red-500/10 border-red-500/40';
    if (p === 'MEDIUM') return 'text-orange-300 bg-orange-500/10 border-orange-500/40';
    return 'text-green-300 bg-green-500/10 border-green-500/40';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-text-main flex items-center">
          <CheckCircle className="w-6 h-6 mr-2 text-brand" /> My Tasks
        </h1>
      </div>

      {/* FILTERS */}
      <div className="bg-bg-card/95 p-4 rounded-lg shadow-sm border border-bg-card/40 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* STATUS FILTER */}
        <div className="relative">
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Status</label>
            <div className="relative">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-bg-card/70 
                    border-2 border-text-muted/40 
                    text-text-main py-2 px-3 pr-8 rounded 
                    focus:outline-none focus:border-brand text-sm cursor-pointer"
                >
                    <option value="">All Statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                </select>
                <Filter className="w-4 h-4 absolute right-2 top-2.5 text-text-muted pointer-events-none" />
            </div>
        </div>

        {/* TEAM FILTER */}
        <div className="relative">
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Team</label>
            <div className="relative">
                <select 
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full appearance-none bg-bg-card/70 
                        border-2 border-text-muted/40 
                        text-text-main py-2 px-3 pr-8 rounded 
                        focus:outline-none focus:border-brand 
                        text-sm cursor-pointer"
                >

                    <option value="">All Teams</option>
                    {teams.length > 0 ? (
                        teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))
                    ) : (
                        <option disabled>No teams found</option>
                    )}
                </select>
                <Briefcase className="w-4 h-4 absolute right-2 top-2.5 text-text-muted pointer-events-none" />
            </div>
        </div>

        {/* SORT BUTTON */}
        <div className="flex items-end">
            <button 
                onClick={() => setSortByDue(!sortByDue)}
                className={`flex appearance-none bg-bg-card/70 border-2 border-text-muted/40 
            text-text-main px-14 py-2 rounded text-sm font-bold transition-colors h-[38px]
            w-auto mx-auto
                  ${sortByDue 
                      ? 'bg-brand/20 border-brand text-brand' 
                      : 'bg-bg-card/70 border-bg-card/40 text-text-muted hover:bg-bg-card'}`}
            >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                By Date
            </button>
        </div>
        
        {/* CLEAR FILTERS */}
        <div className="flex items-end">
            {(statusFilter || teamFilter || sortByDue) && (
                <button 
                    onClick={() => { setStatusFilter(''); setTeamFilter(''); setSortByDue(false); }}
                    className="text-sm text-red-500 hover:text-red-700 underline h-[38px] flex items-center"
                >
                    Clear Filters
                </button>
            )}
        </div>
      </div>

      {/* TASK LIST */}
      {loadingTasks ? (
          <div className="p-8 text-center text-text-main">Loading your tasks...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                    <div key={task.id} className="bg-bg-card/95 p-4 rounded-lg shadow-sm border border-bg-card/40 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between md:items-center gap-4">

                        <div className="flex-1">
                            <div className="flex items-center mb-1">
                                <Link 
                                    to={`/teams/${task.team_id}/tasks/${task.id}`} 
                                    className="text-lg font-bold text-text-main hover:text-brand hover:underline transition-colors"
                                >
                                    {task.title}
                                </Link>
                                <span className={`ml-3 px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                            </div>
                            <div className="flex items-center text-sm text-text-muted">
                                <Briefcase className="w-3 h-3 mr-1" />
                                <span className="mr-4">{getTeamName(task.team_id)}</span>
                                
                                <Flag className="w-3 h-3 mr-1" />
                                <span>Created by {task.created_by}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-xs text-text-muted uppercase font-bold mb-1">Due Date</div>
                                <div className="flex items-center text-sm text-text-main font-medium">
                                    <Calendar className="w-4 h-4 mr-1 text-text-muted" />
                                    {new Date(task.due_date).toLocaleDateString('en-GB')}
                                </div>
                            </div>

                            <div className={`px-3 py-1 rounded-full text-xs font-bold border
                              ${task.status === 'DONE' ? 'bg-green-500/10 text-green-300 border-green-500/40' : 
                                task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-300 border-blue-500/40' : 
                                'bg-slate-500/10 text-slate-300 border-slate-500/40'}`}>
                                {task.status.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 bg-bg-card rounded-lg border border-gray-200 border-dashed">
                    <div className="text-text-muted mb-2">No tasks assigned to you found matching your filters.</div>
                    {teamFilter && (
                        <p className="text-xs text-red-400 mt-2">
                        </p>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
}