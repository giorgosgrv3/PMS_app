import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { Search, CheckCircle, Loader } from 'lucide-react';
import { useFlash } from '../context/FlashContext';
import { useConfirm } from '../context/ConfirmContext';

export default function AdminUsersPage() {
  const { flash } = useFlash();
  const { ask } = useConfirm();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activatingAll, setActivatingAll] = useState(false);

  const getErrorMessage = (err) => {
    return err.response?.data?.detail || 'An unexpected error occurred.';
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.users.getAll();
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- HANDLERS ---

  const handleActivate = async (username) => {
    try {
      await api.users.activate(username);
      fetchUsers();
      flash(`User ${username} has been activated.`, 'success'); 
    } catch (err) {
      flash(`Failed to activate: ${getErrorMessage(err)}`);
    }
  };

  const handleActivateAll = () => {
    const inactiveUsers = users.filter(u => !u.active);
    
    if (inactiveUsers.length === 0) {
        flash("All users are already active!", "info");
        return;
    }

    ask(
        `Are you sure you want to activate all ${inactiveUsers.length} pending users?`,
        async () => {
            setActivatingAll(true);
            try {
                // Execute all requests
                await Promise.all(inactiveUsers.map(u => api.users.activate(u.username)));
                
                await fetchUsers();
                flash(`Successfully activated ${inactiveUsers.length} users.`, 'success');
            } catch (err) {
                console.error(err);
                flash("Some activations might have failed. Please check the list.", 'error');
                fetchUsers();
            } finally {
                setActivatingAll(false);
            }
        },
        "Activating all users"
    );
  };

  const handleDeactivate = (username) => {
    ask(
        `Are you sure you want to deactivate user "${username}"? They won't be able to log in.`,
        async () => {
            try {
                await api.users.deactivate(username);
                await fetchUsers();
                flash(`User ${username} has been deactivated.`, 'success');
            } catch (err) {
                flash(`Failed to deactivate: ${getErrorMessage(err)}`, 'error');
            }
        },
        "Deactivating a user"
    );
  };

  const handleDelete = (username) => {
    ask(
        `Are you sure you want to delete ${username}? This cannot be undone.`,
        async () => {
            try {
                await api.users.delete(username);
                // Update local state immediately (Optimistic update)
                setUsers(prev => prev.filter(u => u.username !== username));
                flash(`User ${username} deleted successfully.`, 'success');
            } catch (err) {
                flash(`Failed to delete: ${getErrorMessage(err)}`, 'error');
            }
        },
        "Deleting a user"
    );
  };

  const handleRoleChange = (username, newRole) => {
    ask(
        `Are you sure you want to change ${username}'s role to ${newRole.toUpperCase()}?`,
        async () => {
            try {
                await api.users.updateRole(username, newRole);
                await fetchUsers(); // Refresh to confirm the change took effect
                flash(`Role updated for ${username}.`, 'success');
            } catch (err) {
                flash(`Error updating role: ${getErrorMessage(err)}`, 'error');
                fetchUsers(); // Revert selection on error
            }
        },
        "Changing user role"
    );
    
    // Note: If the user clicks "Cancel" in the modal, the dropdown might still visually 
    // show the new value until the next refresh. You can force a fetchUsers() 
    // here if you want strict reversion, but it's usually not necessary.
  };

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.first_name && user.first_name.toLowerCase().includes(term)) ||
      (user.last_name && user.last_name.toLowerCase().includes(term))
    );
  });

  const inactiveCount = users.filter(u => !u.active).length;

  if (loading && users.length === 0) return <div className="p-6 text-text-main">Loading users...</div>;
  if (error) return <div className="p-6 text-red-500 font-bold">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">User Management</h1>
        
        {inactiveCount > 0 && (
            <button 
                onClick={handleActivateAll}
                disabled={activatingAll}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm disabled:opacity-70"
            >
                {activatingAll ? (
                    <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" /> Activating...
                    </>
                ) : (
                    <>
                        <CheckCircle className="w-5 h-5 mr-2" /> Activate All ({inactiveCount})
                    </>
                )}
            </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted" />
        </div>
        <input
          type="text"
          placeholder="Search by username, email or name..."
          className="block w-full pl-10 pr-3 py-2 border border-bg-card/40 rounded-lg leading-5 bg-bg-card text-text-main placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand sm:text-sm shadow-sm transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-bg-card shadow-md rounded-lg overflow-hidden border border-bg-card/40">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-bg-card">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-bg-card divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.username} className="hover:bg-bg-card/50 transition-colors">
                  
                  {/* USER INFO */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-main">
                        {/* THEME LINK COLOR */}
                        <Link to={`/admin/users/${user.username}`} className="text-brand hover:underline">
                            {user.username}
                        </Link>
                    </div>
                    <div className="text-sm text-text-muted">{user.email}</div>
                    <div className="text-xs text-text-muted">{user.first_name} {user.last_name}</div>
                  </td>

                  {/* ROLE SELECTOR */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.username, e.target.value)}
                      className="text-sm border-2 border-text-muted/20 rounded-md shadow-sm focus:border-brand focus:ring focus:ring-brand/20 cursor-pointer py-1 bg-bg-card text-text-main"
                    >
                      <option value="member">Member</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  {/* STATUS BADGE */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.active ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                        </span>
                    ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                        </span>
                    )}
                  </td>

                  {/* ACTIONS (Toggle Active) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.active ? (
                        <button 
                            onClick={() => handleDeactivate(user.username)}
                            className="text-xs font-medium text-amber-600 hover:text-amber-800 border border-amber-200 bg-amber-50 px-3 py-1 rounded hover:bg-amber-100 transition-colors"
                            title="Deactivate User"
                        >
                            Deactivate
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleActivate(user.username)}
                            className="text-xs font-medium text-green-700 hover:text-green-900 border border-green-200 bg-green-50 px-3 py-1 rounded hover:bg-green-100 transition-colors"
                            title="Activate User"
                        >
                            Activate
                        </button>
                    )}
                  </td>

                  {/* DELETE BUTTON */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button 
                      onClick={() => handleDelete(user.username)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                  No users found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}