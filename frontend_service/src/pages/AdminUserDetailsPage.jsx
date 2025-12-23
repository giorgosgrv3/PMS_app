import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';

export default function AdminUserDetailsPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // We add a timestamp to force refresh images if needed (optional but good practice)
  const [avatarTimestamp] = useState(Date.now());

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.users.getOne(username);
        setUser(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUser();
    }
  }, [username]);

  if (loading) return <div className="p-8 text-center text-text-main">Loading user profile...</div>;
  
  if (error) return (
    <div className="p-8 text-center">
        <div className="text-red-500 font-bold mb-4">{error}</div>
        <button onClick={() => navigate('/admin/users')} className="text-brand underline">Back to Users</button>
    </div>
  );

  if (!user) return null;

  // --- NEW: Generate Avatar URL ---
  const avatarUrl = user.avatar_filename 
    ? `${api.users.getAvatarUrl(user.username)}?t=${avatarTimestamp}` 
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center">
        <button 
            onClick={() => navigate('/admin/users')} 
            className="mr-4 text-text-muted hover:text-text-main transition-colors"
        >
            ← Back to List
        </button>
        <h1 className="text-2xl font-bold text-text-main">User Profile</h1>
      </div>

      <div className="bg-bg-card shadow-lg rounded-lg overflow-hidden border border-gray-200">
        {/* Header Background */}
        <div className="bg-primary h-32 relative">
            <div className="absolute -bottom-12 left-8">
                
                {/* --- UPDATED AVATAR CONTAINER --- */}
                <div className="h-24 w-24 bg-bg-card rounded-full border-4 border-bg-card shadow-md overflow-hidden flex items-center justify-center relative">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt={`${user.username} profile`} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-3xl font-bold text-brand uppercase">
                            {user.username.substring(0, 2)}
                        </span>
                    )}
                </div>
                {/* -------------------------------- */}

            </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
            <h2 className="text-3xl font-bold text-text-main mb-1">{user.first_name} {user.last_name}</h2>
            <p className="text-text-muted text-lg mb-6">@{user.username}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-bg-card rounded-lg border border-gray-100">
                    <div className="text-xs text-text-muted uppercase font-semibold">Email</div>
                    <div className="text-text-main font-medium">{user.email}</div>
                </div>

                <div className="p-4 bg-bg-card rounded-lg border border-gray-100">
                    <div className="text-xs text-text-muted uppercase font-semibold">Role</div>
                    <div className="text-text-main font-medium capitalize flex items-center">
                        {user.role.replace('_', ' ')}
                    </div>
                </div>

                <div className="p-4 bg-bg-card rounded-lg border border-gray-100">
                    <div className="text-xs text-text-muted uppercase font-semibold">Account Status</div>
                    <div className="mt-1">
                        {user.active ? (
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                            </span>
                        ) : (
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Inactive
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}