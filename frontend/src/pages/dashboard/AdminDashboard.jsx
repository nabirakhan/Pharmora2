import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import adminService from "../../services/adminService";
import { API_BASE_URL } from "../../utils/constants";
import StatsCard from "../../components/dashboard/StatsCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  Users,
  Package,
  ShoppingCart,
  FileText,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  BarChart3,
  User,
  LogOut,
  Home,
  DollarSign,
  Download,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";

function AdminDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "Patient",
    password: ""
  });

  useEffect(() => {
    if (user === undefined || user === null) {
      return;
    }

    if (user.role !== "Admin") {
      showNotification('Unauthorized access', 'error');
      navigate("/login");
      return;
    }

    loadData();
  }, [user]);

  useEffect(() => {
    if (user && user.role === "Admin") {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users") {
        const usersData = await adminService.getAllUsers();
        setUsers(usersData);
      } else if (activeTab === "dashboard") {
        const statsData = await adminService.getStats();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      showNotification(err.message || "Failed to load data", "error");
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const confirmDelete = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setShowDeleteConfirm(false);
    try {
      await adminService.deleteUser(userToDelete.id);
      showNotification(`${userToDelete.name} deleted successfully!`, "success");
      loadData();
    } catch (err) {
      showNotification(err.message || "Failed to delete user", "error");
    } finally {
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.user_id);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role
    });
  };

  const handleSaveUser = async (userId) => {
    try {
      await adminService.updateUser(userId, editForm);
      showNotification("User updated successfully!", "success");
      setEditingUserId(null);
      setEditForm({});
      loadData();
    } catch (err) {
      showNotification(err.message || "Failed to update user", "error");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showNotification("Please fill in required fields", "warning");
      return;
    }

    if (newUser.password.length < 6) {
      showNotification("Password must be at least 6 characters", "warning");
      return;
    }

    try {
      await adminService.createUser(newUser);
      showNotification("User created successfully!", "success");
      setShowAddUser(false);
      setNewUser({
        name: "",
        email: "",
        phone: "",
        address: "",
        role: "Patient",
        password: ""
      });
      loadData();
    } catch (err) {
      showNotification(err.message || "Failed to create user", "error");
    }
  };

  const generateReport = async (type) => {
  try {
    showNotification(`Generating ${type} report...`, "info");
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await adminService.getReports(type, 'csv');
    
    let csvText;
    if (typeof response === 'string') {
      csvText = response;
    } else if (response.data) {
      csvText = response.data;
    } else {
      csvText = response;
    }

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`${type} report downloaded successfully!`, "success");
  } catch (err) {
    console.error("Error generating report:", err);
    showNotification(err.message || "Failed to generate report. Please try again.", "error");
  }
};

  const getRoleColor = (role) => {
    const colors = {
      Patient: "bg-blue-100 text-blue-800",
      Doctor: "bg-green-100 text-green-800",
      Pharmacist: "bg-purple-100 text-purple-800",
      Supplier: "bg-orange-100 text-orange-800",
      Admin: "bg-red-100 text-red-800"
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <LoadingSpinner size="large" color="blue" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{userToDelete.name}</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. All data associated with this user will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Delete User
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-700">
          Pharmora Admin
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "dashboard" ? "bg-white text-gray-900" : "hover:bg-gray-700"
            }`}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "users" ? "bg-white text-gray-900" : "hover:bg-gray-700"
            }`}
          >
            <Users size={20} />
            <span>User Management</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "reports" ? "bg-white text-gray-900" : "hover:bg-gray-700"
            }`}
          >
            <FileText size={20} />
            <span>Reports</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition"
          >
            <Home size={20} />
            <span>Home</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-3 text-sm text-gray-300">
            <User size={16} />
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold">System Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Users"
                  value={stats.total_users || 0}
                  icon={Users}
                  color="blue"
                />
                <StatsCard
                  title="Total Medicines"
                  value={stats.total_medicines || 0}
                  icon={Package}
                  color="green"
                />
                <StatsCard
                  title="Total Orders"
                  value={stats.total_orders || 0}
                  icon={ShoppingCart}
                  color="purple"
                />
                <StatsCard
                  title="Total Revenue"
                  value={`Rs. ${stats.total_revenue || 0}`}
                  icon={DollarSign}
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Users by Role</h3>
                  <div className="space-y-3">
                    {stats.users_by_role && Object.entries(stats.users_by_role).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium capitalize">{role}s</span>
                        <span className="text-xl font-bold bg-white px-3 py-1 rounded-full">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {stats.recent_orders && stats.recent_orders.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                    <div className="space-y-3">
                      {stats.recent_orders.map((order) => (
                        <div key={order.order_id} className="flex justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">Order #{order.order_id}</p>
                            <p className="text-sm text-gray-600">{order.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">Rs. {order.total_price}</p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">User Management</h2>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add User
                </button>
              </div>

              {/* Search */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Add User Modal */}
              {showAddUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">Add New User</h3>
                      <button onClick={() => setShowAddUser(false)}>
                        <X size={24} />
                      </button>
                    </div>
                    <form onSubmit={handleAddUser} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Password *</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Role *</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        >
                          <option value="Patient">Patient</option>
                          <option value="Doctor">Doctor</option>
                          <option value="Pharmacist">Pharmacist</option>
                          <option value="Supplier">Supplier</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                          type="text"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <input
                          type="text"
                          value={newUser.address}
                          onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                        >
                          Create User
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddUser(false)}
                          className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <User size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">ID</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Phone</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredUsers.map((user) => (
                          <tr key={user.user_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">#{user.user_id}</td>
                            <td className="px-6 py-4">
                              {editingUserId === user.user_id ? (
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                  className="border p-1 rounded"
                                />
                              ) : (
                                user.name
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingUserId === user.user_id ? (
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                  className="border p-1 rounded"
                                />
                              ) : (
                                user.email
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingUserId === user.user_id ? (
                                <select
                                  value={editForm.role}
                                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                  className="border p-1 rounded"
                                >
                                  <option value="Patient">Patient</option>
                                  <option value="Doctor">Doctor</option>
                                  <option value="Pharmacist">Pharmacist</option>
                                  <option value="Supplier">Supplier</option>
                                </select>
                              ) : (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                                  {user.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingUserId === user.user_id ? (
                                <input
                                  type="text"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                  className="border p-1 rounded"
                                />
                              ) : (
                                user.phone || '-'
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {editingUserId === user.user_id ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveUser(user.user_id)}
                                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditingUserId(null)}
                                      className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => confirmDelete(user.user_id, user.name)}
                                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-lg shadow border-l-4 border-green-500">
                  <ShoppingCart className="h-8 w-8 text-green-500 mb-4" />
                  <h3 className="font-semibold mb-2">Sales Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Last 30 days revenue</p>
                  <button
                    onClick={() => generateReport('sales')}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                </div>

                <div className="p-6 bg-white rounded-lg shadow border-l-4 border-blue-500">
                  <Users className="h-8 w-8 text-blue-500 mb-4" />
                  <h3 className="font-semibold mb-2">User Distribution</h3>
                  <p className="text-sm text-gray-600 mb-4">User count by role</p>
                  <button
                    onClick={() => generateReport('users')}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                </div>

                <div className="p-6 bg-white rounded-lg shadow border-l-4 border-purple-500">
                  <Package className="h-8 w-8 text-purple-500 mb-4" />
                  <h3 className="font-semibold mb-2">Medicine Analytics</h3>
                  <p className="text-sm text-gray-600 mb-4">Top selling medicines</p>
                  <button
                    onClick={() => generateReport('medicines')}
                    className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;