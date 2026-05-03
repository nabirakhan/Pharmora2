
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import userService from "../../services/userService";
import orderService from "../../services/orderService";
import prescriptionService from "../../services/prescriptionService";
import cartService from "../../services/cartService";
import api from "../../services/api";
import StatsCard from "../../components/dashboard/StatsCard";
import OrderCard from "../../components/dashboard/OrderCard";
import PrescriptionCard from "../../components/dashboard/PrescriptionCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ReasonModal from "../../components/common/ReasonModal";
import {
  ShoppingCart,
  FileText,
  Package,
  User,
  LogOut,
  Home,
  Upload,
  CreditCard,
  AlertCircle,
  Plus,
  X,
  Menu
} from "lucide-react";

function PatientDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("cart");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [cart, setCart] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersWithoutPrescriptions, setOrdersWithoutPrescriptions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pharmacists, setPharmacists] = useState([]);
  const [payments, setPayments] = useState([]);

  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedPharmacistId, setSelectedPharmacistId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [editingPrescription, setEditingPrescription] = useState(null);
  const [editPrescriptionFile, setEditPrescriptionFile] = useState(null);
  const [editPrescriptionNotes, setEditPrescriptionNotes] = useState("");
  const [editSelectedDoctorId, setEditSelectedDoctorId] = useState("");
  const [editSelectedOrderId, setEditSelectedOrderId] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
    paymentMethod: "credit_card"
  });

  const [cancelingOrderId, setCancelingOrderId] = useState(null);

  const [showLinkPrescriptionModal, setShowLinkPrescriptionModal] = useState(false);
  const [selectedOrderForPrescription, setSelectedOrderForPrescription] = useState(null);
  const [linkPrescriptionFile, setLinkPrescriptionFile] = useState(null);
  const [linkPrescriptionNotes, setLinkPrescriptionNotes] = useState("");
  const [linkSelectedDoctorId, setLinkSelectedDoctorId] = useState("");
  const [linkPrescriptionError, setLinkPrescriptionError] = useState("");

  useEffect(() => {
    if (user === undefined || user === null) {
      return;
    }

    if (user.role !== "Patient") {
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
      try {
        const cartData = await cartService.getCart(user.id);
        setCart(cartData);
      } catch (err) {
        setCart([]);
      }

      try {
        const presData = await prescriptionService.getUserPrescriptions(user.id);
        setPrescriptions(presData);
      } catch (err) {
        setPrescriptions([]);
      }

      try {
        const docPresData = await prescriptionService.getDoctorPrescriptions(user.id);
        setDoctorPrescriptions(docPresData.filter(p => p.diagnosis));
      } catch (err) {
        setDoctorPrescriptions([]);
      }

      try {
        const ordersData = await orderService.getUserOrders(user.id);
        setOrders(ordersData);
      } catch (err) {
        setOrders([]);
      }

      try {
        const doctorsData = await userService.getAllDoctors();
        const formattedDoctors = doctorsData.map(doc => ({
          ...doc,
          name: doc.name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || 'Doctor'
        }));
        setDoctors(formattedDoctors);
      } catch (err) {
        setDoctors([]);
      }

      try {
        const pharmacistsData = await userService.getAllPharmacists();
        setPharmacists(pharmacistsData);
      } catch (err) {
        setPharmacists([]);
      }

      try {
        const ordersWithoutData = await orderService.getOrdersWithoutPrescriptions(user.id);
        setOrdersWithoutPrescriptions(ordersWithoutData);
      } catch (err) {
        setOrdersWithoutPrescriptions([]);
      }

      try {
        const paymentsData = await api.get(`/api/payments/${user.id}`);
        setPayments(paymentsData);
      } catch (err) {
        setPayments([]);
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

  const updateCartQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    setLoading(true);
    try {
      await cartService.updateQuantity(cartItemId, newQuantity);
      setCart(prevCart =>
        prevCart.map(item =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      showNotification("Quantity updated", "success");
    } catch (err) {
      console.error("Error updating quantity:", err);
      showNotification("Error updating quantity", "error");
    }
    setLoading(false);
  };

  const removeFromCart = async (cartItemId) => {
    setLoading(true);
    try {
      await cartService.removeItem(cartItemId);
      setCart(prevCart => prevCart.filter(item => item.cart_item_id !== cartItemId));
      showNotification("Item removed from cart", "success");
    } catch (err) {
      console.error("Error removing item:", err);
      showNotification("Error removing item from cart", "error");
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPrescriptionFile(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setUploadError("");
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPrescriptionFile(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPrescription = async () => {
    setUploadError("");

    if (!prescriptionFile) {
      setUploadError("Please select a prescription file");
      return;
    }

    if (!selectedDoctorId) {
      setUploadError("Please select a doctor for prescription verification");
      return;
    }

    if (!selectedOrderId) {
      setUploadError("Please select an order to link this prescription to");
      return;
    }

    setLoading(true);
    try {
      await prescriptionService.uploadPrescription({
        patient_id: user.id,
        doctor_id: selectedDoctorId,
        prescription_image: prescriptionFile,
        notes: prescriptionNotes,
        order_id: selectedOrderId,
      });

      showNotification("Prescription uploaded successfully!", "success");
      setPrescriptionFile(null);
      setPrescriptionNotes("");
      setSelectedDoctorId("");
      setSelectedOrderId("");
      setUploadError("");

      const presData = await prescriptionService.getUserPrescriptions(user.id);
      setPrescriptions(presData);
    } catch (err) {
      setUploadError(err.message);
      showNotification(err.message || "Failed to upload prescription", "error");
    }
    setLoading(false);
  };

  const startEditPrescription = async (prescription) => {
    setEditingPrescription(prescription);
    setEditPrescriptionNotes(prescription.notes || "");
    setEditSelectedDoctorId(prescription.doctor_id || "");
    setEditSelectedOrderId(prescription.order_id || "");
    setEditPrescriptionFile(null);

    try {
      const ordersWithoutPresData = await orderService.getOrdersWithoutPrescriptions(
        user.id,
        prescription.prescription_id
      );
      setOrdersWithoutPrescriptions(ordersWithoutPresData);
    } catch (err) {
      console.log("Error loading orders for editing:", err);
    }
  };

  const cancelEdit = () => {
    setEditingPrescription(null);
    setEditPrescriptionNotes("");
    setEditSelectedDoctorId("");
    setEditSelectedOrderId("");
    setEditPrescriptionFile(null);
  };

  const updatePrescription = async () => {
    if (!editSelectedDoctorId) {
      showNotification("Please select a doctor", "warning");
      return;
    }

    if (!editSelectedOrderId) {
      showNotification("Please select an order to link", "warning");
      return;
    }

    setLoading(true);
    try {
      await prescriptionService.updatePrescription(editingPrescription.prescription_id, {
        doctor_id: editSelectedDoctorId,
        prescription_image: editPrescriptionFile || editingPrescription.prescription_image,
        notes: editPrescriptionNotes,
        order_id: editSelectedOrderId,
      });

      showNotification("Prescription updated successfully!", "success");
      cancelEdit();

      const presData = await prescriptionService.getUserPrescriptions(user.id);
      setPrescriptions(presData);
    } catch (err) {
      showNotification(err.message || "Failed to update prescription", "error");
    }
    setLoading(false);
  };

  const deletePrescription = async (prescriptionId) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) {
      return;
    }

    setLoading(true);
    try {
      await prescriptionService.deletePrescription(prescriptionId);
      showNotification("Prescription deleted successfully!", "success");
      setPrescriptions(prev => prev.filter(p => p.prescription_id !== prescriptionId));
    } catch (err) {
      showNotification(err.message || "Failed to delete prescription", "error");
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showNotification("Your cart is empty", "warning");
      return;
    }

    if (!selectedPharmacistId) {
      showNotification("Please select a pharmacist", "warning");
      return;
    }

    if (!deliveryAddress.trim()) {
      showNotification("Please enter a delivery address", "warning");
      return;
    }

    setLoading(true);
    try {
      await orderService.createOrder({
        user_id: user.id,
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_price: calculateTotal() + 200,
        delivery_address: deliveryAddress,
        pharmacist_id: parseInt(selectedPharmacistId),
      });

      showNotification("Order placed successfully!", "success");
      setDeliveryAddress("");
      setSelectedPharmacistId("");
      setCart([]);
      setActiveTab("orders");

      const ordersData = await orderService.getUserOrders(user.id);
      setOrders(ordersData);
    } catch (err) {
      showNotification(err.message || "Failed to place order", "error");
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!selectedOrderForPayment) return;

    setLoading(true);
    try {
      await api.post('/api/payments', {
        order_id: selectedOrderForPayment.order_id,
        user_id: user.id,
        amount: selectedOrderForPayment.total_price,
        method: paymentDetails.paymentMethod,
        card_last_four: paymentDetails.cardNumber.slice(-4)
      });

      await api.patch(`/api/orders/${selectedOrderForPayment.order_id}/status`, {
        status: 'Processing'
      });

      showNotification("Payment successful! Order is now Processing.", "success");
      setShowPaymentModal(false);
      setPaymentDetails({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardHolder: "",
        paymentMethod: "credit_card"
      });
      setSelectedOrderForPayment(null);

      const [paymentsData, ordersData] = await Promise.all([
        api.get(`/api/payments/${user.id}`),
        orderService.getUserOrders(user.id)
      ]);
      setPayments(paymentsData);
      setOrders(ordersData);
    } catch (err) {
      showNotification(err.message || "Payment failed", "error");
    }
    setLoading(false);
  };

  const initiatePayment = (order) => {
    setSelectedOrderForPayment(order);
    setShowPaymentModal(true);
  };

  const handleCancelOrder = async (reason) => {
    const orderId = cancelingOrderId;
    setCancelingOrderId(null);
    try {
      await orderService.cancelOrder(orderId, reason);
      showNotification("Order cancelled.", "success");
      const ordersData = await orderService.getUserOrders(user.id);
      setOrders(ordersData);
    } catch (err) {
      showNotification(err.message || "Failed to cancel order", "error");
    }
  };

  const initiateLinkPrescription = (order) => {
    setSelectedOrderForPrescription(order);
    setLinkPrescriptionFile(null);
    setLinkPrescriptionNotes("");
    setLinkSelectedDoctorId("");
    setLinkPrescriptionError("");
    setShowLinkPrescriptionModal(true);
  };

  const handleLinkPrescriptionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLinkPrescriptionFile(reader.result);
      reader.readAsDataURL(file);
    }
    setLinkPrescriptionError("");
  };

  const handleLinkPrescriptionSubmit = async () => {
    if (!linkPrescriptionFile) {
      setLinkPrescriptionError("Please select a prescription file");
      return;
    }
    if (!linkSelectedDoctorId) {
      setLinkPrescriptionError("Please select a doctor");
      return;
    }

    setLoading(true);
    try {
      await prescriptionService.uploadPrescription({
        patient_id: user.id,
        doctor_id: linkSelectedDoctorId,
        prescription_image: linkPrescriptionFile,
        notes: linkPrescriptionNotes,
        order_id: selectedOrderForPrescription.order_id,
      });

      showNotification("Prescription linked successfully!", "success");
      setShowLinkPrescriptionModal(false);

      const [presData, ordersData] = await Promise.all([
        prescriptionService.getUserPrescriptions(user.id),
        orderService.getUserOrders(user.id)
      ]);
      setPrescriptions(presData);
      setOrders(ordersData);
    } catch (err) {
      setLinkPrescriptionError(err.message || "Failed to link prescription");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <LoadingSpinner size="large" color="cyan" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-cyan-600 to-teal-600 text-white flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-2xl font-bold border-b border-cyan-500">
          Pharmora
        </div>

        <nav className="flex-1 p-4 space-y-2" onClick={() => setSidebarOpen(false)}>
          <button
            onClick={() => setActiveTab("cart")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "cart" ? "bg-white text-cyan-600" : "hover:bg-cyan-500"
            }`}
          >
            <ShoppingCart size={20} />
            <span>My Cart</span>
            {cart.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "prescriptions" ? "bg-white text-cyan-600" : "hover:bg-cyan-500"
            }`}
          >
            <FileText size={20} />
            <span>Prescriptions</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "orders" ? "bg-white text-cyan-600" : "hover:bg-cyan-500"
            }`}
          >
            <Package size={20} />
            <span>My Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "payments" ? "bg-white text-cyan-600" : "hover:bg-cyan-500"
            }`}
          >
            <CreditCard size={20} />
            <span>Payment History</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "profile" ? "bg-white text-cyan-600" : "hover:bg-cyan-500"
            }`}
          >
            <User size={20} />
            <span>Profile</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-500 transition"
          >
            <Home size={20} />
            <span>Browse Products</span>
          </button>
        </nav>

        <div className="p-4 border-t border-cyan-500">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-600 mb-8">Manage your healthcare needs</p>

          {activeTab === "cart" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-4 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.cart_item_id}
                        className="bg-white rounded-lg shadow p-4 flex gap-4"
                      >
                        <img
                          src={item.image_url || "/placeholder.jpg"}
                          alt={item.name}
                          className="w-16 h-16 md:w-24 md:h-24 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm md:text-lg">{item.name}</h3>
                          <p className="text-gray-600 text-sm">{item.category}</p>
                          <p className="text-green-700 font-bold mt-2">
                            Rs. {item.price}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeFromCart(item.cart_item_id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.cart_item_id, item.quantity - 1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.cart_item_id, item.quantity + 1)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-lg shadow p-6 h-fit">
                    <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>Rs. {calculateTotal()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery</span>
                        <span>Rs. 200</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>Rs. {calculateTotal() + 200}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Select Pharmacist *
                      </label>
                      <select
                        value={selectedPharmacistId}
                        onChange={(e) => setSelectedPharmacistId(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Choose a pharmacist</option>
                        {pharmacists.map(ph => (
                          <option key={ph.user_id} value={ph.user_id}>
                            {ph.pharmacy_name || `${ph.first_name} ${ph.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Delivery Address *
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                        className="w-full p-3 border rounded-lg"
                        rows="3"
                      />
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={!selectedPharmacistId || !deliveryAddress.trim()}
                      className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Prescriptions</h2>
              <p className="text-sm text-gray-500 mb-6">
                These are prescriptions issued by your doctors. Download them to attach to your orders.
              </p>

              {doctorPrescriptions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No doctor prescriptions yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Prescriptions issued by your doctors will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {doctorPrescriptions.map((pres) => (
                    <DoctorPrescriptionCard key={pres.prescription_id} prescription={pres} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Orders</h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const orderPayment = payments.find(p => p.order_id === order.order_id);
                    return (
                      <OrderCard
                        key={order.order_id}
                        order={{ ...order, payment: orderPayment }}
                        onPay={initiatePayment}
                        onLinkPrescription={initiateLinkPrescription}
                        onCancel={setCancelingOrderId}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Payment History</h2>

              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No payment history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.payment_id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">Payment #{payment.payment_id}</h3>
                          <p className="text-sm text-gray-600">Order #{payment.order_id}</p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(payment.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Method: {payment.method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-700">
                            Rs. {payment.amount}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <ProfileTab user={user} onUpdated={(updated) => {
              const stored = JSON.parse(localStorage.getItem('user') || '{}');
              const merged = { ...stored, ...updated };
              localStorage.setItem('user', JSON.stringify(merged));
              showNotification("Profile updated!", "success");
            }} />
          )}
        </div>
      </div>

      {cancelingOrderId && (
        <ReasonModal
          title="Cancel Order"
          placeholder="Please provide a reason for cancellation..."
          confirmLabel="Cancel Order"
          confirmColor="red"
          onConfirm={handleCancelOrder}
          onCancel={() => setCancelingOrderId(null)}
        />
      )}

      {showLinkPrescriptionModal && selectedOrderForPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Link Prescription</h3>
                <button
                  onClick={() => setShowLinkPrescriptionModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Order #{selectedOrderForPrescription.order_id} — Rs. {selectedOrderForPrescription.total_price}
              </p>

              {linkPrescriptionError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span className="text-sm">{linkPrescriptionError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prescription Image/PDF *</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleLinkPrescriptionFileChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Doctor *</label>
                  <select
                    value={linkSelectedDoctorId}
                    onChange={(e) => setLinkSelectedDoctorId(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.user_id} value={doctor.user_id}>
                        Dr. {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Additional Notes</label>
                  <textarea
                    value={linkPrescriptionNotes}
                    onChange={(e) => setLinkPrescriptionNotes(e.target.value)}
                    placeholder="Any special instructions"
                    className="w-full p-3 border rounded-lg"
                    rows="2"
                  />
                </div>

                <button
                  onClick={handleLinkPrescriptionSubmit}
                  disabled={!linkPrescriptionFile || !linkSelectedDoctorId}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Upload size={20} />
                  Link Prescription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Complete Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">Order #{selectedOrderForPayment.order_id}</p>
                  <p className="text-lg font-bold text-green-700">
                    Total: Rs. {selectedOrderForPayment.total_price}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    value={paymentDetails.paymentMethod}
                    onChange={(e) => setPaymentDetails({
                      ...paymentDetails,
                      paymentMethod: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => setPaymentDetails({
                      ...paymentDetails,
                      cardNumber: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg"
                    maxLength={16}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentDetails.expiryDate}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        expiryDate: e.target.value
                      })}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails({
                        ...paymentDetails,
                        cvv: e.target.value
                      })}
                      className="w-full p-3 border rounded-lg"
                      maxLength={3}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Card Holder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={paymentDetails.cardHolder}
                    onChange={(e) => setPaymentDetails({
                      ...paymentDetails,
                      cardHolder: e.target.value
                    })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>

                <button
                  onClick={handlePayment}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                >
                  Pay Rs. {selectedOrderForPayment.total_price}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorPrescriptionCard({ prescription }) {
  const downloadAsImage = (format) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header bar
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(0, 0, canvas.width, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Pharmora — Medical Prescription', 30, 50);

    // Prescription ID + date
    ctx.fillStyle = '#374151';
    ctx.font = '14px Arial';
    const date = new Date(prescription.date_issued).toLocaleDateString('en-PK', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    ctx.fillText(`Prescription #${prescription.prescription_id}   |   Date: ${date}`, 30, 110);

    // Doctor
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Doctor: Dr. ${prescription.doctor_name || 'N/A'}`, 30, 145);

    // Diagnosis
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Diagnosis:', 30, 185);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#374151';
    const diagWords = (prescription.diagnosis || '').split(' ');
    let line = '', y = 210;
    for (const word of diagWords) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > 740 && line) {
        ctx.fillText(line.trim(), 30, y); y += 22; line = word + ' ';
      } else { line = test; }
    }
    if (line.trim()) { ctx.fillText(line.trim(), 30, y); y += 22; }

    // Medicines
    y += 10;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Prescribed Medicines:', 30, y); y += 28;

    const meds = prescription.medicines || [];
    if (meds.length === 0) {
      ctx.font = '14px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText('No medicines listed', 30, y); y += 22;
    } else {
      ctx.font = '14px Arial';
      meds.forEach((med, i) => {
        ctx.fillStyle = i % 2 === 0 ? '#f9fafb' : '#ffffff';
        ctx.fillRect(28, y - 16, 744, 22);
        ctx.fillStyle = '#111827';
        ctx.fillText(
          `${i + 1}. ${med.medicine_name || ''}   |   Dosage: ${med.dosage || '-'}   |   Freq: ${med.frequency || '-'}   |   Duration: ${med.duration || '-'}`,
          34, y
        );
        y += 26;
      });
    }

    // Notes
    if (prescription.notes) {
      y += 10;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Notes:', 30, y); y += 22;
      ctx.font = '14px Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText(prescription.notes, 30, y); y += 22;
    }

    // Footer
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.fillText('This prescription was issued digitally via Pharmora. Present to your pharmacist.', 20, canvas.height - 14);

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const link = document.createElement('a');
    link.download = `prescription-${prescription.prescription_id}.${format}`;
    link.href = canvas.toDataURL(mime, 0.95);
    link.click();
  };

  const meds = prescription.medicines || [];

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Prescription #{prescription.prescription_id}</h3>
          <p className="text-sm text-gray-500">
            {new Date(prescription.date_issued).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
          {prescription.status}
        </span>
      </div>

      <p className="text-sm font-medium text-gray-600 mb-1">Dr. {prescription.doctor_name || 'N/A'}</p>

      {prescription.diagnosis && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Diagnosis</p>
          <p className="text-sm text-gray-800">{prescription.diagnosis}</p>
        </div>
      )}

      {meds.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Medicines</p>
          <div className="space-y-1">
            {meds.map((med, i) => (
              <div key={i} className="text-sm bg-gray-50 rounded px-3 py-1.5 flex flex-wrap gap-2">
                <span className="font-medium text-gray-800">{med.medicine_name}</span>
                {med.dosage && <span className="text-gray-500">· {med.dosage}</span>}
                {med.frequency && <span className="text-gray-500">· {med.frequency}</span>}
                {med.duration && <span className="text-gray-500">· {med.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {prescription.notes && (
        <p className="text-xs text-gray-500 mb-3 italic">Note: {prescription.notes}</p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => downloadAsImage('png')}
          className="flex-1 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition"
        >
          Download PNG
        </button>
        <button
          onClick={() => downloadAsImage('jpeg')}
          className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
        >
          Download JPEG
        </button>
      </div>
    </div>
  );
}

function ProfileTab({ user, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || ''
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/patients/${user.id}`, form);
      onUpdated({
        firstName: form.first_name,
        lastName: form.last_name,
        name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: form.country
      });
      setEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
    }
    setSaving(false);
  };

  const field = (label, key, type = "text") => (
    <div key={key}>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      {editing ? (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1 w-full p-2 border rounded-lg"
        />
      ) : (
        <p className="text-lg font-semibold">{form[key] || <span className="text-gray-400">—</span>}</p>
      )}
    </div>
  );

  return (
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
          {field("First Name", "first_name")}
          {field("Last Name", "last_name")}
          {field("Phone", "phone")}
          {field("Address", "address")}
          {field("City", "city")}
          {field("Country", "country")}
        </div>

        <div className="mt-6 flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
