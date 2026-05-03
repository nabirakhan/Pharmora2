
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { useAuth } from "../../hooks/useAuth";
import userService from "../../services/userService";
import prescriptionService from "../../services/prescriptionService";
import medicineService from "../../services/medicineService";
import doctorService from "../../services/doctorService";
import StatsCard from "../../components/dashboard/StatsCard";
import PrescriptionCard from "../../components/dashboard/PrescriptionCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import api from "../../services/api";
import {
  FileText,
  Users,
  Activity,
  LogOut,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  UserCheck,
  Search,
  User,
  Menu
} from "lucide-react";

function DoctorDashboard() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({});
  const [prescriptions, setPrescriptions] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctorSpecialty, setDoctorSpecialty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreatePrescription, setShowCreatePrescription] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_id: "",
    diagnosis: "",
    notes: "",
    medicines: []
  });

  useEffect(() => {
    if (user === undefined || user === null) {
      return;
    }

    if (user.role !== "Doctor") {
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
        const specialtyData = await doctorService.getSpecialty(user.id);
        setDoctorSpecialty(specialtyData.specialty);
      } catch (err) {
        console.log("Specialty error:", err.message);
      }

      try {
        const statsData = await doctorService.getStats(user.id);
        setStats(statsData);
      } catch (err) {
        console.log("Stats error:", err.message);
        setStats({});
      }

      try {
        const presData = await doctorService.getPrescriptions(user.id);
        setPrescriptions(presData);
      } catch (err) {
        console.log("Prescriptions error:", err.message);
        setPrescriptions([]);
      }

      try {
        const pendingData = await doctorService.getPendingPrescriptions(user.id);
        setPendingPrescriptions(pendingData);
      } catch (err) {
        console.log("Pending prescriptions error:", err.message);
        setPendingPrescriptions([]);
      }

      try {
        const allPatientsData = await doctorService.getAllPatientsForDropdown(user.id);
        setPatients(allPatientsData);
      } catch (err) {
        try {
          const patientsData = await doctorService.getPatients(user.id);
          setPatients(patientsData);
        } catch (err2) {
          console.log("Patients error:", err2.message);
          setPatients([]);
        }
      }

      try {
        const medData = await medicineService.getAllMedicines();
        setMedicines(medData);
      } catch (err) {
        console.log("Medicines error:", err.message);
        setMedicines([]);
      }

      showNotification("Dashboard loaded successfully", "success");
    } catch (err) {
      console.error("Error loading data:", err);
      showNotification("Some features may be limited", "warning");
    }
    setLoading(false);
  };

  const refreshPrescriptions = async () => {
    try {
      const presData = await doctorService.getPrescriptions(user.id);
      setPrescriptions(presData);

      const pendingData = await doctorService.getPendingPrescriptions(user.id);
      setPendingPrescriptions(pendingData);
    } catch (err) {
      console.log("Error refreshing prescriptions:", err);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  const verifyPrescription = async (prescriptionId, status) => {
    setLoading(true);
    try {
      await prescriptionService.verifyPrescription(
        prescriptionId,
        user.id,
        status,
        status === "Rejected" ? "Prescription needs review" : "Verified by doctor"
      );
      showNotification(`Prescription ${status.toLowerCase()} successfully!`, "success");
      await refreshPrescriptions();
    } catch (err) {
      showNotification(err.message || "Failed to verify prescription", "error");
    }
    setLoading(false);
  };

  const addMedicineToPrescription = () => {
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [
        ...prescriptionForm.medicines,
        { medicine_id: "", dosage: "", frequency: "", duration: "" }
      ]
    });
  };

  const updateMedicine = (index, field, value) => {
    const updatedMedicines = [...prescriptionForm.medicines];
    updatedMedicines[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medicines: updatedMedicines });
  };

  const removeMedicine = (index) => {
    const updatedMedicines = prescriptionForm.medicines.filter((_, i) => i !== index);
    setPrescriptionForm({ ...prescriptionForm, medicines: updatedMedicines });
  };

  const createPrescription = async () => {
    if (!prescriptionForm.patient_id || !prescriptionForm.diagnosis) {
      showNotification("Please fill in patient and diagnosis", "warning");
      return;
    }

    if (prescriptionForm.medicines.length === 0) {
      showNotification("Please add at least one medicine", "warning");
      return;
    }

    setLoading(true);
    try {
      await doctorService.createPrescription({
        doctor_id: user.id,
        ...prescriptionForm
      });

      showNotification("Prescription created successfully!", "success");
      setPrescriptionForm({
        patient_id: "",
        diagnosis: "",
        notes: "",
        medicines: []
      });
      setShowCreatePrescription(false);
      await refreshPrescriptions();
    } catch (err) {
      showNotification(err.message || "Failed to create prescription", "error");
    }
    setLoading(false);
  };

  const assignPatient = async (patientId) => {
    setLoading(true);
    try {
      await doctorService.assignPatient(user.id, patientId);
      showNotification("Patient assigned successfully!", "success");

      const patientsData = await doctorService.getPatients(user.id);
      setPatients(patientsData);
    } catch (err) {
      showNotification(err.message || "Failed to assign patient", "error");
    }
    setLoading(false);
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-600 to-indigo-700 text-white flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-blue-500">
          <h2 className="text-2xl font-bold">Pharmora</h2>
          <p className="text-sm text-blue-200 mt-1">Doctor Portal</p>
          {doctorSpecialty && (
            <p className="text-xs text-blue-300 mt-2">Specialty: {doctorSpecialty}</p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2" onClick={() => setSidebarOpen(false)}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "overview" ? "bg-white text-blue-600" : "hover:bg-blue-500"
            }`}
          >
            <Activity size={20} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "prescriptions" ? "bg-white text-blue-600" : "hover:bg-blue-500"
            }`}
          >
            <FileText size={20} />
            <span>My Prescriptions</span>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "pending" ? "bg-white text-blue-600" : "hover:bg-blue-500"
            }`}
          >
            <Clock size={20} />
            <span>Pending</span>
            {pendingPrescriptions.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingPrescriptions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("patients")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "patients" ? "bg-white text-blue-600" : "hover:bg-blue-500"
            }`}
          >
            <Users size={20} />
            <span>My Patients</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
              activeTab === "profile" ? "bg-white text-blue-600" : "hover:bg-blue-500"
            }`}
          >
            <User size={20} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-500 transition"
          >
            <Home size={20} />
            <span>Home</span>
          </button>
        </nav>

        <div className="p-4 border-t border-blue-500">
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
            Welcome, Dr. {user?.name}!
          </h1>
          <p className="text-gray-600 mb-8">Manage your patients and prescriptions</p>

          {activeTab === "overview" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
                <StatsCard
                  title="Total Prescriptions"
                  value={stats.total_prescriptions || 0}
                  icon={FileText}
                  color="blue"
                />
                <StatsCard
                  title="Assigned Patients"
                  value={stats.assigned_patients || 0}
                  icon={UserCheck}
                  color="green"
                />
                <StatsCard
                  title="Total Patients"
                  value={stats.total_patients || 0}
                  icon={Users}
                  color="purple"
                />
                <StatsCard
                  title="Pending Reviews"
                  value={stats.pending_prescriptions || 0}
                  icon={Clock}
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Prescriptions</h3>
                  <div className="space-y-3">
                    {prescriptions.slice(0, 5).map((pres) => (
                      <div key={pres.prescription_id} className="flex justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">{pres.patient_name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(pres.date_issued).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {pres.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">Pending Verifications</h3>
                  <div className="space-y-3">
                    {pendingPrescriptions.slice(0, 5).map((pres) => (
                      <div key={pres.prescription_id} className="flex justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">{pres.patient_name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(pres.date_issued).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">My Prescriptions</h2>
                <button
                  onClick={() => setShowCreatePrescription(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create Prescription
                </button>
              </div>

              {showCreatePrescription && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">New Prescription</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Patient</label>
                      <select
                        value={prescriptionForm.patient_id}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, patient_id: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="">Choose a patient</option>
                        {patients.length === 0 ? (
                          <option value="" disabled>No patients available</option>
                        ) : (
                          patients.map(p => (
                            <option key={p.user_id} value={p.user_id}>
                              {p.name} {p.email ? `- ${p.email}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Diagnosis</label>
                      <textarea
                        value={prescriptionForm.diagnosis}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                        placeholder="Enter diagnosis"
                        className="w-full p-3 border rounded-lg"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Additional Notes</label>
                      <textarea
                        value={prescriptionForm.notes}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, notes: e.target.value})}
                        placeholder="Enter any additional notes"
                        className="w-full p-3 border rounded-lg"
                        rows="2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-sm font-medium">Medicines</label>
                        <button
                          onClick={addMedicineToPrescription}
                          className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <Plus size={16} />
                          Add Medicine
                        </button>
                      </div>

                      {prescriptionForm.medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-5 gap-3 mb-3 p-3 bg-gray-50 rounded">
                          <select
                            value={med.medicine_id}
                            onChange={(e) => updateMedicine(index, "medicine_id", e.target.value)}
                            className="p-2 border rounded"
                          >
                            <option value="">Select Medicine</option>
                            {medicines.map(m => (
                              <option key={m.medicine_id} value={m.medicine_id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                            className="p-2 border rounded"
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={med.frequency}
                            onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                            className="p-2 border rounded"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                            className="p-2 border rounded"
                          />
                          <button
                            onClick={() => removeMedicine(index)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={createPrescription}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create Prescription
                      </button>
                      <button
                        onClick={() => {
                          setShowCreatePrescription(false);
                          setPrescriptionForm({patient_id: "", diagnosis: "", notes: "", medicines: []});
                        }}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {prescriptions.map((pres) => (
                  <PrescriptionCard
                    key={pres.prescription_id}
                    prescription={pres}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "pending" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Pending Prescription Verification ({pendingPrescriptions.length})
              </h2>

              {pendingPrescriptions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No pending prescriptions to verify</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPrescriptions.map((pres) => (
                    <PrescriptionCard
                      key={pres.prescription_id}
                      prescription={pres}
                      showActions={true}
                      onVerify={(id) => verifyPrescription(id, "Verified")}
                      onReject={(id) => verifyPrescription(id, "Rejected")}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <DoctorProfileTab user={user} doctorSpecialty={doctorSpecialty} showNotification={showNotification} />
          )}

          {activeTab === "patients" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">My Patients</h2>

              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search patients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                  <div key={patient.user_id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="text-blue-600" size={32} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      <p><span className="font-semibold">Phone:</span> {patient.phone}</p>
                      <p><span className="font-semibold">Address:</span> {patient.address}</p>
                    </div>
                    {patient.relationship !== "Primary Doctor" && (
                      <button
                        onClick={() => assignPatient(patient.user_id)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <UserCheck size={20} />
                        Assign as Patient
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DoctorProfileTab({ user, doctorSpecialty, showNotification }) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [doctorDetails, setDoctorDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    specialty: '',
    medical_license: ''
  });

  React.useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/doctors/${user.id}`);
        setDoctorDetails(response);
        setForm({
          first_name: response.first_name || '',
          last_name: response.last_name || '',
          phone: response.phone || '',
          address: response.address || '',
          city: response.city || '',
          country: response.country || '',
          specialty: response.specialty || doctorSpecialty || '',
          medical_license: response.medical_license || ''
        });
      } catch (err) {
        console.error("Error fetching doctor details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctorDetails();
  }, [user.id, doctorSpecialty]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/doctors/${user.id}`, form);
      showNotification("Profile updated!", "success");
      setEditing(false);
    } catch (err) {
      showNotification(err.message || "Failed to update profile", "error");
    }
    setSaving(false);
  };

  const field = (label, key) => (
    <div key={key}>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      {editing ? (
        <input
          type="text"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1 w-full p-2 border rounded-lg"
        />
      ) : (
        <p className="text-lg font-semibold">{form[key] || <span className="text-gray-400">—</span>}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="medium" color="blue" />
      </div>
    );
  }

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
          {field("Specialty", "specialty")}
          {field("Medical License", "medical_license")}
        </div>
        <div className="mt-6 flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;
