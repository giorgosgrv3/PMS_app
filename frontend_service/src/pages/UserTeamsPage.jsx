import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, UserCircle } from 'lucide-react';

export default function UserTeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data } = await api.teams.getAll();
        setTeams(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) return <div className="p-8 text-center text-text-main">Loading your teams...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-text-main mb-6 flex items-center">
        <Briefcase className="w-6 h-6 mr-2" /> My Teams
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => {
            const isLeader = team.leader_id === user.username;

            return (
              <div 
                key={team.id} 
                // Use bg-bg-card (white) and semantic border colors
                className={`bg-bg-card rounded-lg shadow-md border-l-4 overflow-hidden hover:shadow-lg transition-shadow 
                  ${isLeader ? 'border-brand' : 'border-gray-300'}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-text-main">
                      
                      {/* --- LINK COLOR UPDATED --- */}
                      <Link 
                        to={`/teams/${team.id}`} 
                        className="hover:text-brand hover:underline transition-colors"
                      >
                        {team.name}
                      </Link>
                      {/* -------------------------- */}

                      {isLeader && (
                        <span className="ml-2 text-xs bg-brand/20 text-brand px-2 py-1 rounded-full uppercase font-bold tracking-wide">
                          Leader
                        </span>
                      )}
                    </h2>
                  </div>
                  
                  <p className="text-text-muted text-sm mb-4 line-clamp-2">
                    {team.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-text-muted border-t border-gray-100 pt-4">
                    <div className="flex items-center" title="Team Leader">
                      <UserCircle className="w-4 h-4 mr-1 text-text-muted" />
                      <span className="font-medium mr-1">Leader:</span> 
                      {isLeader ? 'You' : team.leader_id}
                    </div>
                    <div className="flex items-center" title="Members Count">
                      <Users className="w-4 h-4 mr-2 text-text-muted" />
                      {team.member_ids.length}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 bg-bg-card rounded-lg shadow-sm border border-gray-200">
            <div className="text-text-muted mb-2">You are not a member of any team yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}