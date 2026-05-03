import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import userService from "../../services/userService";
import pharmacistService from "../../services/pharmacistService";
import StatsCard from "../../components/dashboard/StatsCard";
import RequestCard from "../../components/dashboard/RequestCard";
import DeliveryCard from "../../components/dashboard/DeliveryCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../services/api";
import ReasonModal from "../../components/common/ReasonModal";
import {
  Package,
  ShoppingCart,
  Truck,
  User,
  LogOut,
  Home,
  Plus,
  BarChart3,
  AlertCircle,
  Send,
  X,
  ClipboardList,
  CheckCircle,
  Download,
  Edit,
  Save,
  Menu
} from "lucide-react";

function PharmacistDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [patientOrders, setPatientOrders] = useState([]);
  const [pharmacistDetails, setPharmacistDetails] = useState(null);
  const [stats, setStats] = useState({
    total_medicines: 0,
    pending_requests: 0,
    completed_deliveries: 0,
    low_stock_medicines: 0
  });

  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelingRequestId, setCancelingRequestId] = useState(null);
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [shipTrackingInput, setShipTrackingInput] = useState("");
  const [addInventoryRequest, setAddInventoryRequest] = useState(null);
  const [supplierMedicines, setSupplierMedicines] = useState([]);
  const [loadingSupplierMedicines, setLoadingSupplierMedicines] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [stockErrorItems, setStockErrorItems] = useState([]);
  const [requestData, setRequestData] = useState({
    supplier_id: "",
    medicine_id: "",
    quantity_requested: "",
    notes: "",
    pharmacy_name: ""
  });

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    pharmacy_name: "",
    pharmacy_license: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (user === undefined || user === null) {
      return;
    }

    if (user.role !== "Pharmacist") {
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
      const pharmacistData = await userService.getPharmacistByUserId(user.id);
      setPharmacistDetails(pharmacistData);
      
      setProfileForm({
        pharmacy_name: pharmacistData?.pharmacy_name || "",
        pharmacy_license: pharmacistData?.pharmacy_license || "",
        phone: pharmacistData?.phone || user?.phone || "",
        address: pharmacistData?.address || user?.address || ""
      });

      const suppliersData = await userService.getAllSuppliers();
      setSuppliers(suppliersData);

      const medicinesData = await userService.getPharmacistMedicines();
      
      const enrichedMedicines = medicinesData.map(medicine => {
        const supplier = suppliersData.find(s => 
          s.user_id === parseInt(medicine.supplier_id) || 
          s.supplier_id === parseInt(medicine.supplier_id)
        );
        return {
          ...medicine,
          supplier_name: supplier?.company_name || medicine.supplier_name || `Supplier #${medicine.supplier_id}`,
          supplier_company: supplier?.company_name || "Unknown Supplier"
        };
      });
      
      setMedicines(enrichedMedicines);

      const requestsData = await pharmacistService.getStockRequests(user.id);
      setStockRequests(requestsData);

      const ordersData = await api.get(`/api/pharmacist/${user.id}/orders`);
      setPatientOrders(ordersData);

      const statsData = await userService.getPharmacistStats(user.id);
      setStats(statsData);

      showNotification("Dashboard loaded successfully", "success");
    } catch (err) {
      console.error("Error loading data:", err);
      showNotification("Some features may be limited", "warning");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put(`/api/pharmacists/${user.id}`, profileForm);
      
      setPharmacistDetails({
        ...pharmacistDetails,
        pharmacy_name: profileForm.pharmacy_name,
        pharmacy_license: profileForm.pharmacy_license,
        phone: profileForm.phone,
        address: profileForm.address
      });
      
      showNotification("Profile updated successfully!", "success");
      setIsEditingProfile(false);
    } catch (err) {
      showNotification(err.message || "Failed to update profile", "error");
    }
    setSavingProfile(false);
  };

  const refreshStockRequests = async () => {
    try {
      const requestsData = await pharmacistService.getStockRequests(user.id);
      setStockRequests(requestsData);
    } catch (err) {
      console.error("Error refreshing stock requests:", err);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const handleSendRequest = async () => {
    if (!requestData.supplier_id || !requestData.medicine_id || !requestData.quantity_requested) {
      showNotification("Please fill in all required fields", "warning");
      return;
    }

    setLoading(true);
    try {
      await pharmacistService.createStockRequest({
        pharmacist_id: user.id,
        supplier_id: requestData.supplier_id,
        medicine_id: requestData.medicine_id,
        quantity_requested: parseInt(requestData.quantity_requested),
        notes: requestData.notes || '',
        pharmacy_name: pharmacistDetails?.pharmacy_name || "My Pharmacy"
      });

      showNotification("Stock request sent successfully!", "success");
      setShowRequestForm(false);
      setSelectedMedicine(null);
      setSupplierMedicines([]);
      setRequestData({
        supplier_id: "",
        medicine_id: "",
        quantity_requested: "",
        notes: "",
        pharmacy_name: ""
      });

      await refreshStockRequests();

    } catch (err) {
      showNotification(err.message || "Failed to send request", "error");
    }
    setLoading(false);
  };

  const handleAddToInventory = (request) => {
    setAddInventoryRequest(request);
  };

  const confirmAddToInventory = async () => {
    const request = addInventoryRequest;
    setAddInventoryRequest(null);
    setLoading(true);
    try {
      await pharmacistService.addToInventory({
        medicine_id: request.medicine_id,
        quantity: request.quantity_requested,
        supplier_id: request.supplier_id,
        request_id: request.request_id
      });

      showNotification("Medicine added to inventory successfully!", "success");
      await refreshStockRequests();

      const medicinesData = await userService.getPharmacistMedicines();
      
      const enrichedMedicines = medicinesData.map(medicine => {
        const supplier = suppliers.find(s => 
          s.user_id === parseInt(medicine.supplier_id) || 
          s.supplier_id === parseInt(medicine.supplier_id)
        );
        return {
          ...medicine,
          supplier_name: supplier?.company_name || medicine.supplier_name || `Supplier #${medicine.supplier_id}`,
          supplier_company: supplier?.company_name || "Unknown Supplier"
        };
      });
      
      setMedicines(enrichedMedicines);

    } catch (err) {
      showNotification(err.message || "Failed to add to inventory", "error");
    }
    setLoading(false);
  };

  const refreshPatientOrders = async () => {
    try {
      const ordersData = await api.get(`/api/pharmacist/${user.id}/orders`);
      setPatientOrders(ordersData);
    } catch (err) {
      console.error("Error refreshing orders:", err);
    }
  };

  const handleShipOrder = (orderId) => {
    setShipTrackingInput("");
    setShippingOrderId(orderId);
  };

  const confirmShipOrder = async () => {
    const orderId = shippingOrderId;
    setShippingOrderId(null);
    try {
      await api.patch(`/api/orders/${orderId}/ship`, { tracking_info: shipTrackingInput.trim() });
      showNotification("Order shipped!", "success");
      await refreshPatientOrders();
      const medicinesData = await userService.getPharmacistMedicines();
      
      const enrichedMedicines = medicinesData.map(medicine => {
        const supplier = suppliers.find(s => 
          s.user_id === parseInt(medicine.supplier_id) || 
          s.supplier_id === parseInt(medicine.supplier_id)
        );
        return {
          ...medicine,
          supplier_name: supplier?.company_name || medicine.supplier_name || `Supplier #${medicine.supplier_id}`,
          supplier_company: supplier?.company_name || "Unknown Supplier"
        };
      });
      
      setMedicines(enrichedMedicines);
    } catch (err) {
      if (err.items) {
        setStockErrorItems(err.items);
      } else {
        showNotification(err.message || "Failed to ship order", "error");
      }
    }
  };

  const handleRequestFromStockError = (item) => {
    const medicine = medicines.find(m => m.name === item.name);
    setStockErrorItems([]);
    if (medicine) {
      setSelectedMedicine(medicine);
      setRequestData({
        supplier_id: medicine.supplier_id || "",
        medicine_id: medicine.medicine_id,
        quantity_requested: String(item.required - item.available),
        notes: `Needed to fulfil patient order — short by ${item.required - item.available} units`,
        pharmacy_name: pharmacistDetails?.pharmacy_name || "My Pharmacy"
      });
    }
    setActiveTab("requests");
    setShowRequestForm(true);
  };

  const handleDeliverOrder = async (orderId) => {
    try {
      await api.patch(`/api/orders/${orderId}/deliver`, {});
      showNotification("Order marked as delivered!", "success");
      await refreshPatientOrders();
    } catch (err) {
      showNotification(err.message || "Failed to deliver order", "error");
    }
  };

  const handleCancelOrder = async (reason) => {
    const orderId = cancelingOrderId;
    setCancelingOrderId(null);
    try {
      await api.patch(`/api/orders/${orderId}/cancel`, { reason });
      showNotification("Order cancelled.", "success");
      await refreshPatientOrders();
    } catch (err) {
      showNotification(err.message || "Failed to cancel order", "error");
    }
  };

  const handleCancelRequest = async (reason) => {
    const requestId = cancelingRequestId;
    setCancelingRequestId(null);
    try {
      await pharmacistService.cancelStockRequest(requestId, reason);
      showNotification("Stock request cancelled.", "success");
      await refreshStockRequests();
    } catch (err) {
      showNotification(err.message || "Failed to cancel request", "error");
    }
  };

  const downloadDeliveryPDF = () => {
    const supplierRows = stockRequests
      .filter(r => r.delivery_status === "Shipped" || r.delivery_status === "Delivered" || r.status === "Completed")
      .map(r => `<tr style="border-bottom:1px solid #eee">
        <td style="padding:8px">Stock #${r.request_id}</td>
        <td style="padding:8px">${r.medicine_name || ''}</td>
        <td style="padding:8px">${r.quantity_requested || ''}</td>
        <td style="padding:8px">${r.supplier_name || ''}</td>
        <td style="padding:8px">${r.delivery_status || r.status || ''}</td>
        <td style="padding:8px">${r.shipped_date ? new Date(r.shipped_date).toLocaleDateString() : ''}</td>
        <td style="padding:8px">${r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : ''}</td>
      </tr>`).join('');

    const patientRows = patientOrders
      .filter(o => o.status === 'Shipped' || o.status === 'Delivered')
      .map(o => `<tr style="border-bottom:1px solid #eee">
        <td style="padding:8px">Order #${o.order_id}</td>
        <td style="padding:8px">${(o.items||[]).map(i=>i.medicine_name).filter(Boolean).join(', ')}</td>
        <td style="padding:8px">${(o.items||[]).reduce((s,i)=>s+(i.quantity||0),0)}</td>
        <td style="padding:8px">${o.patient_name || ''}</td>
        <td style="padding:8px">${o.status}</td>
        <td style="padding:8px">—</td>
        <td style="padding:8px">—</td>
      </tr>`).join('');

    const html = `<html><head><title>Delivery Log</title>
      <style>body{font-family:Arial,sans-serif;padding:24px}table{width:100%;border-collapse:collapse}
      th{background:#0d9488;color:white;padding:10px;text-align:left}
      h2{color:#0d9488}h3{color:#374151;margin-top:24px}</style></head><body>
      <h2>Delivery Log — ${pharmacistDetails?.pharmacy_name || 'Pharmacy'}</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <h3>Supplier Deliveries</h3>
      <table><thead><tr><th>#</th><th>Medicine</th><th>Qty</th><th>Supplier</th><th>Status</th><th>Shipped</th><th>Delivered</th></tr></thead>
      <tbody>${supplierRows || '<tr><td colspan="7" style="padding:8px;color:#999">None</td></tr>'}</tbody></table>
      <h3>Patient Order Deliveries</h3>
      <table><thead><tr><th>#</th><th>Medicines</th><th>Qty</th><th>Patient</th><th>Status</th><th>Shipped</th><th>Delivered</th></tr></thead>
      <tbody>${patientRows || '<tr><td colspan="7" style="padding:8px;color:#999">None</td></tr>'}</tbody></table>
      <script>window.onload=()=>{window.print()}</script></body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  const getSupplierMedicines = (supplierId) => {
    if (!supplierId) return [];
    const supplierIdNum = parseInt(supplierId);
    return medicines.filter(med => parseInt(med.supplier_id) === supplierIdNum);
  };

  const getWelcomeName = () => {
    if (pharmacistDetails?.pharmacy_name) {
      return pharmacistDetails.pharmacy_name;
    } else if (user?.name) {
      return user.name;
    } else {
      return "Pharmacist";
    }
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
      <div className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-teal-600 to-cyan-600 text-white flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-2xl font-bold border-b border-teal-500">
          Pharmora
        </div>

        <nav className="flex-1 p-4 space-y-2" onClick={() => setSidebarOpen(false)}>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "dashboard" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("medicines")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "medicines" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <Package size={20} />
            <span>Medicines</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "requests" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <ShoppingCart size={20} />
            <span>My Requests</span>
            {stockRequests.filter(r => r.status === 'Pending').length > 0 && (
              <span className="ml-auto bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                {stockRequests.filter(r => r.status === 'Pending').length}
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
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "orders" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <ClipboardList size={20} />
            <span>Patient Orders</span>
            {patientOrders.filter(o => o.status === 'Verified').length > 0 && (
              <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {patientOrders.filter(o => o.status === 'Verified').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "profile" ? "bg-white text-teal-600" : "hover:bg-teal-500"
            }`}
          >
            <User size={20} />
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
              <p className="text-gray-600">Pharmacy Inventory Management</p>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                <StatsCard
                  title="Available Medicines"
                  value={medicines.length}
                  icon={Package}
                  color="teal"
                />
                <StatsCard
                  title="Pending Requests"
                  value={stockRequests.filter(r => r.status === 'Pending').length}
                  icon={ShoppingCart}
                  color="yellow"
                />
                <StatsCard
                  title="Completed Deliveries"
                  value={stockRequests.filter(r => r.status === 'Completed').length}
                  icon={Truck}
                  color="green"
                />
                <StatsCard
                  title="Low Stock Alerts"
                  value={medicines.filter(m => m.stock < 10).length}
                  icon={AlertCircle}
                  color="red"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
                  <div className="space-y-3">
                    {stockRequests.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="flex justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{request.medicine_name}</p>
                          <p className="text-sm text-gray-600">Qty: {request.quantity_requested}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'Accepted' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                    {stockRequests.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent requests</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("medicines")}
                      className="w-full text-left p-4 bg-teal-50 rounded-lg hover:bg-teal-100"
                    >
                      <Package className="inline mr-2 text-teal-600" />
                      <span className="font-medium text-teal-800">Browse Medicines</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("requests");
                        setShowRequestForm(true);
                      }}
                      className="w-full text-left p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100"
                    >
                      <Plus className="inline mr-2 text-cyan-600" />
                      <span className="font-medium text-cyan-800">New Stock Request</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "medicines" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Available Medicines</h2>

              {medicines.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No medicines available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {medicines.map((medicine) => (
                    <div key={medicine.medicine_id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                      <h3 className="font-semibold text-lg mb-2">{medicine.name}</h3>
                      <p className="text-sm text-teal-600 mb-2">{medicine.category}</p>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-semibold">Rs. {medicine.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stock:</span>
                          <span className="font-semibold">{medicine.stock} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span className="font-semibold">{medicine.supplier_company || medicine.supplier_name || `Supplier #${medicine.supplier_id}`}</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          setSelectedMedicine(medicine);
                          setRequestData({
                            supplier_id: medicine.supplier_id,
                            medicine_id: medicine.medicine_id,
                            quantity_requested: "",
                            notes: "",
                            pharmacy_name: pharmacistDetails?.pharmacy_name || "My Pharmacy"
                          });
                          if (medicine.supplier_id) {
                            try {
                              const meds = await api.get(`/api/supplier/user/${medicine.supplier_id}/medicines`);
                              setSupplierMedicines(meds);
                            } catch (err) { }
                          }
                          setActiveTab("requests");
                          setShowRequestForm(true);
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600"
                      >
                        Request Stock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Stock Requests</h2>

              {stockRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No stock requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockRequests
                    .filter(request => request.status !== 'Completed')
                    .map((request) => (
                      <div key={request.request_id}>
                        <RequestCard
                          request={request}
                          type="pharmacist"
                          onAddToInventory={handleAddToInventory}
                        />
                        {request.status === 'Rejected' && request.rejection_reason && (
                          <div className="mt-1 px-4 py-2 bg-red-50 border border-red-200 rounded-b-lg text-sm text-red-700">
                            <span className="font-medium">Rejection reason:</span> {request.rejection_reason}
                          </div>
                        )}
                        {request.status === 'Pending' && (
                          <div className="mt-1 flex justify-end">
                            <button
                              onClick={() => setCancelingRequestId(request.request_id)}
                              className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2"
                            >
                              <X size={14} />
                              Cancel Request
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "deliveries" && (() => {
            const supplierInTransit = stockRequests.filter(r => r.delivery_status === "Shipped");
            const supplierReady = stockRequests.filter(r => r.status === "Completed");
            const supplierDelivered = stockRequests.filter(r => r.delivery_status === "Delivered");
            const patientShipped = patientOrders.filter(o => o.status === "Shipped");
            const patientDelivered = patientOrders.filter(o => o.status === "Delivered");
            const hasAny = supplierInTransit.length + supplierReady.length + supplierDelivered.length + patientShipped.length + patientDelivered.length > 0;

            return (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Deliveries</h2>
                  {hasAny && (
                    <button
                      onClick={downloadDeliveryPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      <Download size={18} /> Download PDF
                    </button>
                  )}
                </div>

                {!hasAny ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Truck size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No deliveries yet</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-teal-700 border-b pb-2">From Suppliers</h3>
                      {supplierInTransit.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-blue-600 mb-2">In Transit ({supplierInTransit.length})</p>
                          <div className="space-y-3">
                            {supplierInTransit.map(r => <DeliveryCard key={r.request_id} delivery={r} />)}
                          </div>
                        </div>
                      )}
                      {supplierReady.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-green-600 mb-2">Ready to Add to Inventory ({supplierReady.length})</p>
                          <div className="space-y-3">
                            {supplierReady.map(r => (
                              <RequestCard key={r.request_id} request={r} type="pharmacist" onAddToInventory={handleAddToInventory} />
                            ))}
                          </div>
                        </div>
                      )}
                      {supplierDelivered.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-500 mb-2">Completed ({supplierDelivered.length})</p>
                          <div className="space-y-3">
                            {supplierDelivered.map(r => <DeliveryCard key={r.request_id} delivery={r} />)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4 text-cyan-700 border-b pb-2">To Patients</h3>
                      {patientShipped.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-blue-600 mb-2">Shipped ({patientShipped.length})</p>
                          <div className="space-y-3">
                            {patientShipped.map(o => (
                              <div key={o.order_id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                                <div>
                                  <p className="font-medium">Order #{o.order_id} — {o.patient_name}</p>
                                  <p className="text-sm text-gray-500">{o.delivery_address}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Shipped</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {patientDelivered.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-500 mb-2">Delivered ({patientDelivered.length})</p>
                          <div className="space-y-3">
                            {patientDelivered.map(o => (
                              <div key={o.order_id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                                <div>
                                  <p className="font-medium">Order #{o.order_id} — {o.patient_name}</p>
                                  <p className="text-sm text-gray-500">{o.delivery_address}</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Delivered</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === "orders" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Patient Orders</h2>

              {patientOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <ClipboardList size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No orders assigned to you yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientOrders.map((order) => {
                    const statusColor = {
                      Pending: "bg-yellow-100 text-yellow-700",
                      Processing: "bg-blue-100 text-blue-700",
                      Verified: "bg-green-100 text-green-700",
                      Shipped: "bg-purple-100 text-purple-700",
                      Delivered: "bg-gray-100 text-gray-700",
                    }[order.status] || "bg-gray-100 text-gray-600";

                    return (
                      <div key={order.order_id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg">Order #{order.order_id}</h3>
                            <p className="text-sm text-gray-600">Patient: {order.patient_name}</p>
                            {order.patient_phone && (
                              <p className="text-sm text-gray-600">Phone: {order.patient_phone}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              {new Date(order.order_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">Delivery: {order.delivery_address}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                              {order.status}
                            </span>
                            <p className="mt-2 font-bold text-lg">Rs. {order.total_price}</p>
                          </div>
                        </div>

                        {order.prescription_status && (
                          <p className="text-sm mb-3">
                            Prescription:{" "}
                            <span className={`font-medium ${order.prescription_status === 'Verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {order.prescription_status}
                            </span>
                          </p>
                        )}

                        <div className="border-t pt-3 mb-4">
                          <p className="text-sm font-medium text-gray-600 mb-2">Items:</p>
                          <div className="space-y-1">
                            {(order.items || []).filter(Boolean).map((item, i) => (
                              <div key={i} className="text-sm flex justify-between">
                                <span>{item.medicine_name} × {item.quantity}</span>
                                <span>Rs. {item.price}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {order.status === 'Verified' && (
                            <button
                              onClick={() => handleShipOrder(order.order_id)}
                              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                            >
                              <Truck size={18} />
                              Mark as Shipped
                            </button>
                          )}
                          {order.tracking_info && (
                            <p className="text-sm text-gray-500 mb-2">
                              Tracking: <span className="font-medium text-gray-700">{order.tracking_info}</span>
                            </p>
                          )}
                          {order.status === 'Shipped' && (
                            <button
                              onClick={() => handleDeliverOrder(order.order_id)}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={18} />
                              Mark as Delivered
                            </button>
                          )}
                          {(order.status === 'Pending' || order.status === 'Processing') && (
                            <p className="text-sm text-gray-500 italic">
                              Waiting for prescription verification
                            </p>
                          )}
                          {order.status === 'Delivered' && (
                            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle size={16} /> Delivered
                            </p>
                          )}
                          {order.status === 'Cancelled' && order.cancellation_reason && (
                            <p className="text-sm text-red-600 italic">Reason: {order.cancellation_reason}</p>
                          )}
                        </div>
                        {!['Cancelled', 'Delivered', 'Shipped'].includes(order.status) && (
                          <div className="mt-3">
                            <button
                              onClick={() => setCancelingOrderId(order.order_id)}
                              className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2"
                            >
                              <X size={16} />
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
                    <label className="text-sm font-medium text-gray-600">Pharmacy Name</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.pharmacy_name}
                        onChange={(e) => setProfileForm({...profileForm, pharmacy_name: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{pharmacistDetails?.pharmacy_name || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">License Number</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.pharmacy_license}
                        onChange={(e) => setProfileForm({...profileForm, pharmacy_license: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{pharmacistDetails?.pharmacy_license || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-lg"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{pharmacistDetails?.phone || user?.phone || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    {isEditingProfile ? (
                      <textarea
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-lg"
                        rows="3"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{pharmacistDetails?.address || user?.address || <span className="text-gray-400">—</span>}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {isEditingProfile ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 flex items-center gap-2"
                      >
                        {savingProfile ? <LoadingSpinner size="small" /> : <Save size={18} />}
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileForm({
                            pharmacy_name: pharmacistDetails?.pharmacy_name || "",
                            pharmacy_license: pharmacistDetails?.pharmacy_license || "",
                            phone: pharmacistDetails?.phone || user?.phone || "",
                            address: pharmacistDetails?.address || user?.address || ""
                          });
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
                    >
                      <Edit size={18} />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {addInventoryRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add to Pharmacy Inventory</h3>
                    <button onClick={() => setAddInventoryRequest(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={22} />
                    </button>
                  </div>
                  <p className="text-gray-700 text-sm mb-6">
                    Add <span className="font-semibold">{addInventoryRequest.quantity_requested} units</span> of{" "}
                    <span className="font-semibold">{addInventoryRequest.medicine_name}</span> to your pharmacy inventory?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAddInventoryRequest(null)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmAddToInventory}
                      className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
                    >
                      Add to Inventory
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shippingOrderId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Mark as Shipped</h3>
                    <button onClick={() => setShippingOrderId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={22} />
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={shipTrackingInput}
                    onChange={(e) => setShipTrackingInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmShipOrder()}
                    placeholder="e.g. TRK-123456"
                    className="w-full p-3 border rounded-lg text-sm"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShippingOrderId(null)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmShipOrder}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Truck size={16} />
                      Confirm Shipment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {cancelingOrderId && (
            <ReasonModal
              title="Cancel Patient Order"
              placeholder="Please provide a reason for cancellation..."
              confirmLabel="Cancel Order"
              confirmColor="red"
              onConfirm={handleCancelOrder}
              onCancel={() => setCancelingOrderId(null)}
            />
          )}

          {cancelingRequestId && (
            <ReasonModal
              title="Cancel Stock Request"
              placeholder="Please provide a reason for cancellation..."
              confirmLabel="Cancel Request"
              confirmColor="red"
              onConfirm={handleCancelRequest}
              onCancel={() => setCancelingRequestId(null)}
            />
          )}

          {stockErrorItems.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-red-700">Insufficient Stock</h3>
                  <button onClick={() => setStockErrorItems([])} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You don't have enough stock to ship this order. Request the following from a supplier:
                </p>
                <div className="space-y-3">
                  {stockErrorItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-red-600">
                          Have: {item.available} &nbsp;|&nbsp; Need: {item.required} &nbsp;|&nbsp; Short: {item.required - item.available}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRequestFromStockError(item)}
                        className="ml-3 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 whitespace-nowrap"
                      >
                        Request Stock
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStockErrorItems([])}
                  className="mt-5 w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {showRequestForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">
                  {selectedMedicine ? `Request ${selectedMedicine.name}` : 'Request Stock'}
                </h3>

                <div className="space-y-4">
                  {!selectedMedicine && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Supplier</label>
                      <select
                        value={requestData.supplier_id}
                        onChange={async (e) => {
                          const userId = e.target.value;
                          setRequestData({ ...requestData, supplier_id: userId, medicine_id: "" });
                          setSupplierMedicines([]);
                          if (userId) {
                            setLoadingSupplierMedicines(true);
                            try {
                              const meds = await api.get(`/api/supplier/user/${userId}/medicines`);
                              setSupplierMedicines(meds);
                            } catch (err) {
                              showNotification("Failed to load supplier medicines", "error");
                            }
                            setLoadingSupplierMedicines(false);
                          }
                        }}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.supplier_id} value={supplier.user_id}>
                            {supplier.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!selectedMedicine && requestData.supplier_id && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Medicine</label>
                      <select
                        value={requestData.medicine_id}
                        onChange={(e) => setRequestData({ ...requestData, medicine_id: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                        disabled={loadingSupplierMedicines}
                      >
                        <option value="">
                          {loadingSupplierMedicines ? "Loading..." : supplierMedicines.length === 0 ? "No medicines available" : "Select Medicine"}
                        </option>
                        {supplierMedicines.map(medicine => (
                          <option key={medicine.medicine_id} value={medicine.medicine_id}>
                            {medicine.medicine_name} - Rs. {medicine.selling_price} (Stock: {medicine.quantity_available})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedMedicine && (
                    <div className="bg-teal-50 p-3 rounded-lg">
                      <p><strong>Medicine:</strong> {selectedMedicine.name}</p>
                      <p><strong>Supplier:</strong> {selectedMedicine.supplier_company || selectedMedicine.supplier_name || `Supplier #${selectedMedicine.supplier_id}`}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity Needed</label>
                    <input
                      type="number"
                      value={requestData.quantity_requested}
                      onChange={(e) => setRequestData({ ...requestData, quantity_requested: e.target.value })}
                      placeholder="Enter quantity"
                      className="w-full p-3 border rounded-lg"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                    <textarea
                      value={requestData.notes}
                      onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                      placeholder="Any special instructions..."
                      className="w-full p-3 border rounded-lg"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRequestForm(false);
                      setSelectedMedicine(null);
                      setSupplierMedicines([]);
                      setRequestData({
                        supplier_id: "",
                        medicine_id: "",
                        quantity_requested: "",
                        notes: "",
                        pharmacy_name: ""
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <LoadingSpinner size="small" /> : <Send size={20} />}
                    Send Request
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

export default PharmacistDashboard;