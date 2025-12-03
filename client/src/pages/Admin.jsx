import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, History, LogOut, Trash2 } from 'lucide-react';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddTokens, setShowAddTokens] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { getAuthHeaders, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTokens = async (userId) => {
    if (!tokenAmount || parseInt(tokenAmount) <= 0) {
      alert('Xahiş edirik düzgün miqdar daxil edin');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/add-tokens', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, amount: parseInt(tokenAmount) })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Balans artırıldı. Yeni balans: ${data.newBalance}`);
        setShowAddTokens(false);
        setTokenAmount('');
        setSelectedUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Xəta: ${error.error}`);
      }
    } catch (error) {
      alert('Xəta baş verdi');
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/transactions/${userId}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setShowTransactions(true);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('az-AZ');
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert('İstifadəçi silindi');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        const error = await response.json();
        alert(`Xəta: ${error.error}`);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Xəta baş verdi');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={24} />
            <h1 className="text-xl font-bold">Admin Paneli</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
            >
              Ana Səhifə
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balans</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.name} {u.lastname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {u.tokenBalance || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowAddTokens(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Balans artır
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            fetchTransactions(u.id);
                          }}
                          className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 flex items-center gap-1"
                        >
                          <History size={14} />
                          Tarixçə
                        </button>
                        <button
                          onClick={() => {
                            setUserToDelete(u);
                            setShowDeleteConfirm(true);
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAddTokens && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Balans Artır</h2>
              <p className="text-gray-600 mb-4">
                İstifadəçi: {selectedUser.name} {selectedUser.lastname}
              </p>
              <p className="text-gray-600 mb-4">
                Cari balans: <span className="font-semibold">{selectedUser.tokenBalance || 0}</span>
              </p>
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Token miqdarı"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                min="1"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddTokens(selectedUser.id)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Artır
                </button>
                <button
                  onClick={() => {
                    setShowAddTokens(false);
                    setTokenAmount('');
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Ləğv et
                </button>
              </div>
            </div>
          </div>
        )}

        {showTransactions && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Tarixçə: {selectedUser.name} {selectedUser.lastname}
                </h2>
                <button
                  onClick={() => {
                    setShowTransactions(false);
                    setSelectedUser(null);
                    setTransactions([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Tip</th>
                      <th className="px-4 py-2 text-left">Miqdar</th>
                      <th className="px-4 py-2 text-left">Balans sonrası</th>
                      <th className="px-4 py-2 text-left">Tarix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2">
                          {t.type === 'initial' ? 'İlkin' : 
                           t.type === 'add' ? 'Əlavə' : 
                           t.type === 'deduct' ? 'İstifadə' : t.type}
                        </td>
                        <td className="px-4 py-2">{t.amount}</td>
                        <td className="px-4 py-2">{t.balanceAfter}</td>
                        <td className="px-4 py-2">{formatDate(t.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-red-600">İstifadəçini Sil</h2>
              <p className="text-gray-700 mb-4">
                Bu istifadəçini silmək istədiyinizə əminsiniz?
              </p>
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="font-medium">{userToDelete.name} {userToDelete.lastname}</p>
                <p className="text-sm text-gray-600">{userToDelete.email}</p>
              </div>
              <p className="text-sm text-red-600 mb-4">
                ⚠️ Bu əməliyyat geri alına bilməz. İstifadəçi və onun bütün məlumatları silinəcək.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteUser(userToDelete.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Bəli, Sil
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Ləğv et
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Admin;

