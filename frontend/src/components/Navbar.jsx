
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "motion/react";
import { FiSearch, FiX, FiUser, FiLogOut, FiShoppingCart, FiMenu } from "react-icons/fi";
import authService from "../services/authService";
import medicineService from "../services/medicineService";

const SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

function NavLink({ to, label, mouseX, isActive }) {
  const ref = useRef(null);

  const distance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 150;
    return Math.abs(val - (rect.x + rect.width / 2));
  });

  const scale = useTransform(distance, [0, 120], [1.35, 1], { clamp: true });
  const springScale = useSpring(scale, SPRING);

  return (
    <motion.div ref={ref} style={{ scale: springScale, display: "inline-block" }}>
      <Link
        to={to}
        className={`relative text-sm font-medium px-1 transition-colors duration-200 whitespace-nowrap
          ${isActive ? "text-cyan-600" : "text-gray-600 hover:text-gray-900"}`}
      >
        {label}
        {isActive && (
          <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full" />
        )}
      </Link>
    </motion.div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const mouseX = useMotionValue(Infinity);
  const searchInputRef = useRef(null);

  useEffect(() => {
    medicineService.getAllMedicines().then(setMedicines).catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) { setFilteredMedicines([]); return; }
    const filtered = medicines.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedicines(filtered.slice(0, 5));
  }, [searchTerm, medicines]);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
    setFilteredMedicines([]);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      closeSearch();
    }
  };

  const handleSuggestionClick = (name) => {
    navigate(`/products?search=${encodeURIComponent(name)}`);
    closeSearch();
  };

  const handleMyAccount = () => {
    const routes = { Doctor: "/doctor-dashboard", Patient: "/patient-dashboard", Pharmacist: "/pharmacist-dashboard", Supplier: "/supplier-dashboard", Admin: "/admin-dashboard" };
    navigate(routes[user?.role] || "/login");
  };

  if (location.pathname.includes("dashboard") || location.pathname === "/login") return null;

  const navLinks = [
    { to: "/",            label: "Home" },
    { to: "/products",    label: "Products" },
    { to: "/doctors",     label: "Doctors" },
    { to: "/suppliers",   label: "Suppliers" },
    { to: "/pharmacists", label: "Pharmacists" },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/10 rounded-full px-6 py-3.5 flex items-center gap-4 max-w-6xl w-full"
      >
        {/* Logo */}
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent flex-shrink-0">
          Pharmora
        </Link>

        {/* Divider — desktop only */}
        <div className="h-5 w-px bg-gray-200 flex-shrink-0 hidden md:block" />

        {/* Nav links — desktop only */}
        <div
          className="hidden md:flex items-center gap-7 flex-1"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} label={link.label} mouseX={mouseX} isActive={location.pathname === link.to} />
          ))}
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Search — desktop only */}
        <div className="hidden md:flex items-center">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div key="search-open" initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="relative flex-shrink-0 overflow-visible">
                <form onSubmit={handleSearchSubmit}>
                  <input ref={searchInputRef} type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onBlur={() => setTimeout(closeSearch, 200)} placeholder="Search medicines..." className="w-full pl-3 pr-8 py-1.5 text-sm bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-cyan-400 border border-transparent" />
                </form>
                <button onClick={closeSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><FiX size={14} /></button>
                {filteredMedicines.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[280px]">
                    {filteredMedicines.map((m) => (
                      <div key={m.medicine_id} onMouseDown={() => handleSuggestionClick(m.name)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                        <img src={m.image_url || "/images/placeholder.jpg"} alt={m.name} className="w-9 h-9 object-cover rounded-lg flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.category} · <span className="text-green-600 font-medium">Rs. {m.price}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.button key="search-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={openSearch} className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
                <FiSearch size={16} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Divider — desktop only */}
        <div className="h-5 w-px bg-gray-200 flex-shrink-0 hidden md:block" />

        {/* Auth — desktop only */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {!user ? (
            <Link to="/login">
              <button className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-semibold rounded-full hover:shadow-md hover:shadow-cyan-200 transition-all duration-200 whitespace-nowrap">
                Sign In
              </button>
            </Link>
          ) : (
            <>
              <span className="text-xs text-gray-500 font-medium hidden lg:block max-w-[100px] truncate">{user.name || user.role}</span>
              <button onClick={handleMyAccount} title="My Account" className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"><FiUser size={16} /></button>
              {user.role === "Patient" && <button onClick={() => navigate("/cart")} title="View Cart" className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-full transition-colors"><FiShoppingCart size={16} /></button>}
              <button onClick={() => { authService.logout(); navigate("/login"); }} title="Sign Out" className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><FiLogOut size={16} /></button>
            </>
          )}
        </div>

        {/* Mobile: Sign In or avatar + hamburger */}
        <div className="flex md:hidden items-center gap-2 flex-shrink-0">
          {!user ? (
            <Link to="/login">
              <button className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs font-semibold rounded-full">
                Sign In
              </button>
            </Link>
          ) : (
            <button onClick={handleMyAccount} className="p-1.5 text-gray-500 hover:text-teal-600 rounded-full">
              <FiUser size={16} />
            </button>
          )}
          <button onClick={() => setMobileMenuOpen(prev => !prev)} className="p-2 text-gray-600 hover:text-cyan-600 rounded-full hover:bg-gray-100 transition-colors">
            {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%+8px)] left-4 right-4 bg-white/95 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-4 flex flex-col gap-1 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${location.pathname === link.to ? "bg-cyan-50 text-cyan-600" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-gray-100 my-1" />
            {user ? (
              <button onClick={() => { authService.logout(); navigate("/login"); setMobileMenuOpen(false); }} className="px-4 py-2.5 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 text-left transition-colors">
                Sign Out
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navbar;
