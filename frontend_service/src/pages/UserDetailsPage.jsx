import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { Mail, Shield, Activity, ArrowLeft } from 'lucide-react';

export default function UserDetailsPage() {
  const { username } = useParams(); // <--- Get username from URL
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // <--- Use getOne(username) instead of getMe()
        const { data } = await api.users.getOne(username);
        setUser(data);
      } catch (err) {
        setError('Failed to fetch user details.');
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchUser();
  }, [username]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  
  if (error) return (
    <div className="p-8 text-center">
        <div className="text-red-500 font-bold mb-4">{error}</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 underline">Go Back</button>
    </div>
  );

  if (!user) return null;

  // Calculate Avatar URL (Read-Only)
  const avatarUrl = user.avatar_filename 
    ? api.users.getAvatarUrl(user.username) 
    : null;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 flex items-center text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
        {/* Header / Banner */}
        <div className="bg-gray-800 h-32 relative">
            <div className="absolute -bottom-12 left-8">
                
                {/* READ ONLY AVATAR (No click handler) */}
                <div className="h-24 w-24 bg-white rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative bg-gray-200">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    
                    {/* Fallback Initials */}
                    <div 
                        className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-700 uppercase"
                        style={{ display: avatarUrl ? 'none' : 'flex' }}
                    >
                        {user.username.substring(0, 2)}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500 text-lg mb-6">@{user.username}</p>

            <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-3 bg-blue-100 rounded-full mr-4"><Mail className="w-6 h-6 text-blue-600" /></div>
                    <div><div className="text-xs text-gray-500 uppercase font-semibold">Email Address</div><div className="text-gray-800 font-medium">{user.email}</div></div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-3 bg-purple-100 rounded-full mr-4"><Shield className="w-6 h-6 text-purple-600" /></div>
                    <div><div className="text-xs text-gray-500 uppercase font-semibold">Role</div><div className="text-gray-800 font-medium capitalize">{user.role.replace('_', ' ')}</div></div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className={`p-3 rounded-full mr-4 ${user.active ? 'bg-green-100' : 'bg-red-100'}`}><Activity className={`w-6 h-6 ${user.active ? 'text-green-600' : 'text-red-600'}`} /></div>
                    <div><div className="text-xs text-gray-500 uppercase font-semibold">Status</div><div className="font-medium text-gray-800">{user.active ? 'Active' : 'Inactive'}</div></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}