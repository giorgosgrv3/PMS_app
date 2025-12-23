import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { 
    CheckCircle, Clock, Users, ArrowRight, 
    Briefcase, Calendar, TrendingUp, Activity 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date()); // New State for Clock

  const getGreeting = () => {
  const hour = currentTime.getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  
  return "Burning the midnight oil";
};

const getSubtitle = () => {
  const hour = currentTime.getHours();

  if (hour >= 5 && hour < 12)
    return "Michael's not in yet for the day. He burnt his foot in the BBQ.";
  
  if (hour >= 12 && hour < 17)
    return "Michael just ate an entire chicken pot pie for lunch. He's asleep in his office. You can leave.";
  
  if (hour >= 17 && hour < 21)
    return "Word is you've got dinner plans at Michael and Jan's tonight. Surely nothing awkward will happen, right?";
  
  return "Hey, how was that dinner at Michael and Jan's earlier tonight?";
};

  // Redirect Admins
  useEffect(() => {
    if (isAdmin) {
        navigate('/admin/users');
    }
  }, [isAdmin, navigate]);

  // Load Data
  useEffect(() => {
    if (isAdmin) return; 

    

    const loadData = async () => {
      try {
        const [tasksRes, teamsRes] = await Promise.all([
          api.tasks.getMyTasks(),
          api.teams.getAll()
        ]);
        setTasks(tasksRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin]);

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isAdmin) return null;
  if (loading) return <div className="p-8 text-center text-text-muted">Loading Dashboard...</div>;

  const todoCount = tasks.filter(t => t.status === 'TODO').length;
  const progressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;

  const getPriorityColor = (p) => {
    if (p === 'URGENT') return 'border-l-red-500';
    if (p === 'MEDIUM') return 'border-l-orange-500';
    return 'border-l-green-500';
  };

  return (
    <div className="space-y-6">
      
      {/* --- Section with clock*/}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-bg-card p-4 rounded-xl shadow-sm border border-transparent
">
        <div>
            <h1 className="text-2xl font-bold text-text-main">
        {getGreeting()} {user?.first_name || user?.username}!
            </h1>
            <p className="text-text-muted mt-1">
             {getSubtitle()}
            </p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
            <div className="text-sm font-bold text-brand uppercase tracking-wider">Today</div>
            <div className="text-text-main font-bold text-lg leading-tight">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {/* Live Time Counter */}
            <div className="text-text-muted font-bold font-sans text-base mt-1">

                {currentTime.toLocaleTimeString('en-GB')}
            </div>
        </div>
      </div>

      {/* --- 2. THREE COLUMN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COLUMN 1: STATS (Stacked Vertically) */}
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-main flex items-center mb-2">
                <Activity className="w-5 h-5 mr-2 text-brand" /> Overview
            </h2>
            <div className="space-y-4">
                <StatCard icon={<Clock className="w-6 h-6 text-blue-500" />} label="To Do" value={todoCount} color="bg-blue-50" />
                <StatCard icon={<Activity className="w-6 h-6 text-orange-500" />} label="In Progress" value={progressCount} color="bg-orange-50" />
                <StatCard icon={<CheckCircle className="w-6 h-6 text-green-500" />} label="Completed" value={doneCount} color="bg-green-50" />
                <StatCard icon={<Briefcase className="w-6 h-6 text-purple-500" />} label="your teams" value={teams.length} color="bg-purple-50" />
            </div>
        </div>

        {/* COLUMN 2: RECENT TASKS */}
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-text-main flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-brand" /> Recent Tasks
                </h2>
                <Link to="/my-tasks" className="text-sm text-brand hover:underline font-medium">View All</Link>
            </div>

            <div className="space-y-3">
                {tasks.length > 0 ? (
                    tasks.slice(0, 5).map(task => (
                        <Link 
                            key={task.id} 
                            to={`/teams/${task.team_id}/tasks/${task.id}`}
                            className={`block bg-bg-card p-4 rounded-lg shadow-sm border border-transparent hover:shadow-md transition-all hover:-translate-y-0.5 border-l-2 ${getPriorityColor(task.priority)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="min-w-0 pr-2">
                                    <h3 className="font-bold text-text-main text-sm mb-1 truncate">{task.title}</h3>
                                    <div className="flex items-center text-xs text-text-muted">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Due: {new Date(task.due_date).toLocaleDateString('en-GB')}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase flex-shrink-0
                                    ${task.status === 'DONE' ? 'bg-green-100 text-green-700' : 
                                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="bg-bg-card rounded-lg p-8 text-center border border-dashed border border-transparent ">
                        <p className="text-text-muted text-sm">No active tasks assigned to you.</p>
                    </div>
                )}
            </div>
        </div>

        {/* COLUMN 3: TEAMS */}
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-text-main flex items-center">
                    <Users className="w-5 h-5 mr-2 text-brand" /> Teams
                </h2>
                <Link to="/teams" className="text-sm text-brand hover:underline font-medium">View All</Link>
            </div>

            <div className="space-y-3">
                {teams.length > 0 ? (
                    teams.slice(0, 6).map(team => (
                        <Link 
                            key={team.id} 
                            to={`/teams/${team.id}`}
                            className="bg-bg-card p-3 rounded-lg shadow-sm border border-transparent  hover:border-brand transition-colors flex items-center group"
                        >
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold mr-3 group-hover:bg-brand group-hover:text-white transition-colors">
                                {team.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-text-main text-sm truncate">{team.name}</h4>
                                <p className="text-xs text-text-muted truncate">{team.member_ids.length} members</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand" />
                        </Link>
                    ))
                ) : (
                    <div className="text-sm text-text-muted italic">You're not in any teams yet.</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

// Updated StatCard for Vertical Layout
function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-bg-card p-4 rounded-xl shadow-sm border border-transparent  flex items-center hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-lg mr-4 ${color} bg-opacity-20`}>
                {icon}
            </div>
            <div>
                <div className="text-xs font-bold text-text-muted uppercase tracking-wide">{label}</div>
                <span className="text-2xl font-bold text-text-main">{value}</span>
            </div>
        </div>
    );
}