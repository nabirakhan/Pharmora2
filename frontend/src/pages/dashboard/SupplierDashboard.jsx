
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import userService from "../../services/userService";
import supplierService from "../../services/supplierService";
import api from "../../services/api";
import StatsCard from "../../components/dashboard/StatsCard";
import RequestCard from "../../components/dashboard/RequestCard";
import InventoryCard from "../../components/dashboard/InventoryCard";
import DeliveryCard from "../../components/dashboard/DeliveryCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReasonModal from "../../components/common/ReasonModal";
import {
  Package,
  ShoppingCart,
  Truck,
  LogOut,
  Home,
  Plus,
  Edit,
  X,
  Search,
  TrendingUp,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  Menu
} from "lucide-react";

function SupplierDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stockRequests, setStockRequests] = useState([]);
  const [supplierInventory, setSupplierInventory] = useState([]);
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    pending_requests: 0,
    total_inventory_items: 0,
    total_inventory_value: 0,
    low_stock_items: 0,
    completed_deliveries: 0
  });

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    company_name: "",
    contact_number: "",
    address: "",
  });

  const [newInventoryItem, setNewInventoryItem] = useState({
    medicine_name: "",
    category: "",
    description: "",
    quantity_available: "",
    reorder_level: "20",
    purchase_price: "",
    selling_price: "",
    expiry_date: "",
    image_url: ""
  });
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [stockErrorItem, setStockErrorItem] = useState(null);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [shippingRequestId, setShippingRequestId] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    if (user === undefined || user === null) {
      return;
    }

    if (user.role !== "Supplier") {
      showNotification('Unauthorized access', 'error');
      navigate("/login");
      return;
    }

    if (!initialLoadDone) {
      loadData();
      setInitialLoadDone(true);
    }
  }, [user]);

const loadData = async () => {
    setLoading(true);
    try {
      let supplierData = null;
      try {
        supplierData = await userService.getSupplierByUserId(user.id);
      } catch (err) {
        console.error("Error fetching supplier details:", err);
      }

      if (!supplierData) {
        setSupplierDetails({
          supplier_id: 1,
          company_name: user?.name || "My Company",
          phone: user?.phone || "",
          address: user?.address || ""
        });
        setEditedDetails({
          company_name: user?.name || "My Company",
          contact_number: user?.phone || "",
          address: user?.address || "",
        });
      } else {
        setSupplierDetails(supplierData);
        setEditedDetails({
          company_name: supplierData.company_name || "",
          contact_number: supplierData.phone || "",
          address: supplierData.address || "",
        });
      }

      const supplierId = supplierData?.supplier_id || 1;

      try {
        const statsData = await userService.getSupplierStats(supplierId);
        setStats(statsData);
      } catch (err) {
        setStats({
          pending_requests: 0,
          total_inventory_items: 0,
          total_inventory_value: 0,
          low_stock_items: 0,
          completed_deliveries: 0
        });
      }

      try {
        const requestsData = await supplierService.getStockRequests(supplierId);
        setStockRequests(requestsData);
      } catch (err) {
        setStockRequests([]);
      }

      try {
        const inventoryData = await userService.getSupplierInventory(supplierId);
        setSupplierInventory(inventoryData);
      } catch (err) {
        setSupplierInventory([]);
      }

      showNotification("Dashboard loaded successfully", "success");
    } catch (err) {
      console.error("Error loading data:", err);
      showNotification("Some features may be limited", "warning");
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const handleCheckInventory = async (supplierId, medicineId, quantityRequested) => {
    try {
      const data = await api.post('/api/supplier/inventory/check', {
        supplier_id: supplierId,
        medicine_id: medicineId,
        quantity_requested: quantityRequested
      });
      return data;
    } catch (err) {
      console.error("Error checking inventory:", err);
      return {
        hasEnough: false,
        message: "Error checking inventory"
      };
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessingRequest(requestId);
    try {
      await supplierService.acceptRequest(requestId);
      showNotification("Request accepted! Stock reserved.", "success");
      const requestsData = await supplierService.getStockRequests(supplierDetails.supplier_id);
      setStockRequests(requestsData);
      const inventoryData = await userService.getSupplierInventory(supplierDetails.supplier_id);
      setSupplierInventory(inventoryData);
    } catch (err) {
      if (err.item) {
        setStockErrorItem(err.item);
      } else {
        showNotification(err.message || "Failed to accept request", "error");
      }
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = (requestId) => {
    setRejectingRequestId(requestId);
  };

  const confirmRejectRequest = async (reason) => {
    const requestId = rejectingRequestId;
    setRejectingRequestId(null);
    try {
      await supplierService.rejectRequest(requestId, reason);
      showNotification("Request rejected.", "success");
      const requestsData = await supplierService.getStockRequests(supplierDetails.supplier_id);
      setStockRequests(requestsData);
    } catch (err) {
      showNotification(err.message || "Failed to reject request", "error");
    }
  };

  const handleShipOrder = (requestId) => {
    setTrackingInput("");
    setShippingRequestId(requestId);
  };

  const confirmShipOrder = async () => {
    const requestId = shippingRequestId;
    setShippingRequestId(null);
    setProcessingRequest(requestId);
    try {
      await supplierService.shipOrder(requestId, trackingInput.trim());
      showNotification("Order marked as shipped!", "success");
      const requestsData = await supplierService.getStockRequests(supplierDetails.supplier_id);
      setStockRequests(requestsData);
    } catch (err) {
      showNotification(err.message || "Failed to ship order", "error");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeliverOrder = async (requestId) => {

    setProcessingRequest(requestId);
    try {
      await supplierService.markDelivered(requestId);
      showNotification("Order marked as delivered!", "success");

      const requestsData = await supplierService.getStockRequests(supplierDetails.supplier_id);
      setStockRequests(requestsData);

      const inventoryData = await userService.getSupplierInventory(supplierDetails.supplier_id);
      setSupplierInventory(inventoryData);
    } catch (err) {
      showNotification(err.message || "Failed to mark as delivered", "error");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleUpdateSupplierDetails = async () => {
    try {
      setLoading(true);

      const response = await userService.updateSupplierProfile(
        supplierDetails.supplier_id,
        editedDetails
      );

      showNotification("Details updated successfully!", "success");
      setIsEditingDetails(false);

      const supplierData = await userService.getSupplierByUserId(user.id);
      setSupplierDetails(supplierData);
      setEditedDetails({
        company_name: supplierData.company_name || "",
        contact_number: supplierData.phone || "",
        address: supplierData.address || "",
      });
    } catch (err) {
      console.error("Error updating details:", err);
      showNotification(err.message || "Failed to update details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventoryItem = async () => {
    if (!newInventoryItem.medicine_name || !newInventoryItem.category || !newInventoryItem.quantity_available || !newInventoryItem.selling_price) {
      showNotification("Please fill in all required fields", "warning");
      return;
    }

    try {
      await api.post(`/api/supplier/${supplierDetails.supplier_id}/inventory/new-medicine`, newInventoryItem);
      showNotification("Medicine added to inventory!", "success");
      setNewInventoryItem({
        medicine_name: "",
        category: "",
        description: "",
        quantity_available: "",
        reorder_level: "20",
        purchase_price: "",
        selling_price: "",
        expiry_date: "",
        image_url: ""
      });
      setShowAddMedicine(false);

      const inventoryData = await userService.getSupplierInventory(supplierDetails.supplier_id);
      setSupplierInventory(inventoryData);
    } catch (err) {
      showNotification(err.message || "Failed to add medicine", "error");
    }
  };

  const handleUpdateInventory = async (inventoryId, updates) => {
    try {
      await userService.updateInventoryItem(inventoryId, updates);
      showNotification("Inventory updated!", "success");
      setEditingItem(null);

      const inventoryData = await userService.getSupplierInventory(supplierDetails.supplier_id);
      setSupplierInventory(inventoryData);
    } catch (err) {
      showNotification(err.message || "Failed to update inventory", "error");
    }
  };

  const handleDeleteInventoryItem = async (inventoryId) => {
    if (!window.confirm("Remove this medicine from inventory?")) return;
    try {
      await userService.deleteInventoryItem(inventoryId);
      showNotification("Medicine removed from inventory!", "success");

      const inventoryData = await userService.getSupplierInventory(supplierDetails.supplier_id);
      setSupplierInventory(inventoryData);
    } catch (err) {
      showNotification(err.message || "Failed to remove medicine", "error");
    }
  };

  const filteredInventory = supplierInventory.filter(item =>
    item.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWelcomeName = () => {
    if (supplierDetails?.company_name) {
      return supplierDetails.company_name;
    } else if (user?.name) {
      return user.name;
    } else {
      return "Supplier";
    }
  };

  const downloadDeliveryPDF = (deliveries, title) => {
    const rows = deliveries.map(r => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:8px">#${r.request_id}</td>
        <td style="padding:8px">${r.medicine_name || ''}</td>
        <td style="padding:8px">${r.quantity_requested || ''}</td>
        <td style="padding:8px">${r.pharmacy_name || r.pharmacist_name || ''}</td>
        <td style="padding:8px">${r.delivery_status || r.status || ''}</td>
        <td style="padding:8px">${r.shipped_date ? new Date(r.shipped_date).toLocaleDateString() : ''}</td>
        <td style="padding:8px">${r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : ''}</td>
      </tr>`).join('');

    const html = `<html><head><title>${title}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}
      th{background:#0d9488;color:white;padding:10px;text-align:left}td{padding:8px}
      h2{color:#0d9488}</style></head><body>
      <h2>${title}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>
        <th>Request #</th><th>Medicine</th><th>Qty</th><th>Pharmacy</th>
        <th>Status</th><th>Shipped</th><th>Delivered</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>{window.print()}</script>
      </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <LoadingSpinner size="large" color="teal" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-teal-600 to-blue-600 text-white flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-2xl font-bold border-b border-teal-500">
          Pharmora Supply
        </div>

        <nav className="flex-1 p-4 space-y-2" onClick={() => setSidebarOpen(false)}>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "dashboard" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "requests" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <ShoppingCart size={20} />
            <span>Requests</span>
            {stats.pending_requests > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.pending_requests}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "inventory" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <Package size={20} />
            <span>Inventory</span>
            {stats.low_stock_items > 0 && (
              <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.low_stock_items}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("deliveries")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "deliveries" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <Truck size={20} />
            <span>Deliveries</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "profile" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <Edit size={20} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-teal-500 transition"
          >
            <Home size={20} />
            <span>Home</span>
          </button>
        </nav>

        <div className="p-4 border-t border-teal-500">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500 transition"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden mb-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Menu size={22} />
          </button>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {getWelcomeName()}!
              </h1>
              <p className="text-gray-600">Manage your supply operations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setInitialLoadDone(false);
                  loadData();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <RefreshCw size={20} />
                Refresh
              </button>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                <StatsCard
                  title="Pending Requests"
                  value={stats.pending_requests}
                  icon={ShoppingCart}
                  color="yellow"
                />
                <StatsCard
                  title="Inventory Items"
                  value={stats.total_inventory_items}
                  icon={Package}
                  color="teal"
                />
                <StatsCard
                  title="Total Value"
                  value={`Rs. ${stats.total_inventory_value.toFixed(0)}`}
                  icon={DollarSign}
                  color="green"
                />
                <StatsCard
                  title="Low Stock Items"
                  value={stats.low_stock_items}
                  icon={AlertCircle}
                  color="red"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("requests")}
                      className="w-full text-left p-4 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <ShoppingCart className="inline mr-2 text-blue-600" />
                      <span className="font-medium text-blue-800">View Pending Requests</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("inventory");
                        setShowAddMedicine(true);
                      }}
                      className="w-full text-left p-4 bg-green-50 rounded-lg hover:bg-green-100"
                    >
                      <Plus className="inline mr-2 text-green-600" />
                      <span className="font-medium text-green-800">Add to Inventory</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {stockRequests.slice(0, 5).map(request => (
                      <div key={request.request_id} className="flex justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{request.medicine_name}</p>
                          <p className="text-xs text-gray-600">{request.pharmacy_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                          request.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                    {stockRequests.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Pending Stock Requests</h2>

              {stockErrorItem && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-red-700 mb-1">Insufficient Stock</h3>
                      <p className="text-sm text-gray-700">
                        <strong>{stockErrorItem.name}</strong> — have {stockErrorItem.available}, need {stockErrorItem.required} (short by {stockErrorItem.required - stockErrorItem.available})
                      </p>
                    </div>
                    <button onClick={() => setStockErrorItem(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => { setStockErrorItem(null); setActiveTab("inventory"); }}
                    className="mt-3 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                  >
                    Go to Inventory → Add Stock
                  </button>
                </div>
              )}

              {stockRequests.filter(r => r.status === 'Pending').length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockRequests.filter(r => r.status === 'Pending').map((request) => (
                    <RequestCard
                      key={request.request_id}
                      request={request}
                      type="supplier"
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      onShip={handleShipOrder}
                      onDeliver={handleDeliverOrder}
                      onCheckInventory={handleCheckInventory}
                      processingRequest={processingRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "inventory" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">My Inventory</h2>
                  <p className="text-gray-600 mt-1">
                    Total Items: {stats.total_inventory_items} |
                    Total Value: Rs. {stats.total_inventory_value.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMedicine(true)}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add to Inventory
                </button>
              </div>

              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {showAddMedicine && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-1">Add Medicine to Inventory</h3>
                  <p className="text-sm text-gray-500 mb-4">Enter the medicine details. If it already exists by name, your stock will be added to it.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Medicine Name *</label>
                      <input
                        type="text"
                        value={newInventoryItem.medicine_name}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, medicine_name: e.target.value })}
                        placeholder="e.g. Augmentin 625mg"
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Category *</label>
                      <select
                        value={newInventoryItem.category}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, category: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Select Category</option>
                        <option>Antibiotics</option>
                        <option>Analgesics</option>
                        <option>Antifungals</option>
                        <option>Antivirals</option>
                        <option>Antihistamines</option>
                        <option>Antihypertensives</option>
                        <option>Antidiabetics</option>
                        <option>Vitamins & Supplements</option>
                        <option>Cardiovascular</option>
                        <option>Gastrointestinal</option>
                        <option>Respiratory</option>
                        <option>Dermatology</option>
                        <option>Vaccines</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <input
                        type="text"
                        value={newInventoryItem.description}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, description: e.target.value })}
                        placeholder="Brief description (optional)"
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity *</label>
                      <input
                        type="number"
                        value={newInventoryItem.quantity_available}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity_available: e.target.value })}
                        placeholder="Units available"
                        className="w-full p-3 border rounded-lg"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Production Threshold</label>
                      <input
                        type="number"
                        value={newInventoryItem.reorder_level}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, reorder_level: e.target.value })}
                        placeholder="Alert when stock falls below this"
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Purchase Price</label>
                      <input
                        type="number"
                        value={newInventoryItem.purchase_price}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, purchase_price: e.target.value })}
                        placeholder="Your cost price"
                        className="w-full p-3 border rounded-lg"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Selling Price *</label>
                      <input
                        type="number"
                        value={newInventoryItem.selling_price}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, selling_price: e.target.value })}
                        placeholder="Price charged to pharmacies"
                        className="w-full p-3 border rounded-lg"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={newInventoryItem.expiry_date}
                        onChange={(e) => setNewInventoryItem({ ...newInventoryItem, expiry_date: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Medicine Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onloadend = () => setNewInventoryItem({ ...newInventoryItem, image_url: reader.result });
                          reader.readAsDataURL(file);
                        }}
                        className="w-full p-3 border rounded-lg text-sm"
                      />
                      {newInventoryItem.image_url && (
                        <img src={newInventoryItem.image_url} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-lg border" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShowAddMedicine(false)}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddInventoryItem}
                      className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                    >
                      Add to Inventory
                    </button>
                  </div>
                </div>
              )}

              {supplierInventory.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No medicines in inventory</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Click "Add to Inventory" to start adding medicines
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredInventory.map((item) => (
                    <InventoryCard
                      key={item.inventory_id}
                      item={item}
                      editingItem={editingItem}
                      setEditingItem={setEditingItem}
                      onUpdate={handleUpdateInventory}
                      onDelete={handleDeleteInventoryItem}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "deliveries" && (() => {
            const inTransit = stockRequests.filter(r => r.delivery_status === "Shipped");
            const accepted = stockRequests.filter(r => r.status === "Accepted" && r.delivery_status === "NotShipped");
            const completed = stockRequests.filter(r => r.delivery_status === "Delivered" || r.status === "Completed");
            const allDeliveries = [...inTransit, ...accepted, ...completed];
            return (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Deliveries to Pharmacies</h2>
                  {allDeliveries.length > 0 && (
                    <button
                      onClick={() => downloadDeliveryPDF(allDeliveries, `Delivery Log — ${getWelcomeName()}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      <Download size={18} /> Download PDF
                    </button>
                  )}
                </div>

                {allDeliveries.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Truck size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No deliveries yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {accepted.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-yellow-700">Accepted — Awaiting Shipment ({accepted.length})</h3>
                        <div className="space-y-3">
                          {accepted.map(r => (
                            <DeliveryCard key={r.request_id} delivery={r} onDeliver={null} onShip={handleShipOrder} />
                          ))}
                        </div>
                      </div>
                    )}
                    {inTransit.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-blue-700">In Transit ({inTransit.length})</h3>
                        <div className="space-y-3">
                          {inTransit.map(r => (
                            <DeliveryCard key={r.request_id} delivery={r} onDeliver={handleDeliverOrder} />
                          ))}
                        </div>
                      </div>
                    )}
                    {completed.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-green-700">Completed ({completed.length})</h3>
                        <div className="space-y-3">
                          {completed.map(r => (
                            <DeliveryCard key={r.request_id} delivery={r} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === "profile" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Profile</h2>
              <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg font-semibold">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role</label>
                    <p className="text-lg font-semibold">{user?.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company Name</label>
                    {isEditingDetails ? (
                      <input
                        type="text"
                        value={editedDetails.company_name}
                        onChange={(e) => setEditedDetails({ ...editedDetails, company_name: e.target.value })}
                        className="mt-1 w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{editedDetails.company_name || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Number</label>
                    {isEditingDetails ? (
                      <input
                        type="text"
                        value={editedDetails.contact_number}
                        onChange={(e) => setEditedDetails({ ...editedDetails, contact_number: e.target.value })}
                        className="mt-1 w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{editedDetails.contact_number || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    {isEditingDetails ? (
                      <textarea
                        value={editedDetails.address}
                        onChange={(e) => setEditedDetails({ ...editedDetails, address: e.target.value })}
                        className="mt-1 w-full p-2 border rounded-lg"
                        rows="3"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{editedDetails.address || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  {isEditingDetails ? (
                    <>
                      <button
                        onClick={handleUpdateSupplierDetails}
                        disabled={loading}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setIsEditingDetails(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingDetails(true)}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {shippingRequestId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Mark as Shipped</h3>
                    <button onClick={() => setShippingRequestId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={22} />
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Information <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. TRK-123456"
                    className="w-full p-3 border rounded-lg text-sm"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShippingRequestId(null)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmShipOrder}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Truck size={16} />
                      Confirm Shipment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rejectingRequestId && (
            <ReasonModal
              title="Reject Stock Request"
              placeholder="Enter reason for rejection (e.g. delay in restock, out of stock)..."
              confirmLabel="Reject Request"
              confirmColor="red"
              onConfirm={confirmRejectRequest}
              onCancel={() => setRejectingRequestId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierDashboard;
