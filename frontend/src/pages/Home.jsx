import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiTruck, FiUserCheck, FiHeart, FiShield, FiClock, FiMail, FiPhone, FiMapPin, FiPackage, FiAward, FiArrowRight } from "react-icons/fi";
import PharmoraBottle from "../components/PharmoraBottle";
import "../styles/home.css";

function CountUp({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function MedicineBottle({ scrollY }) {
  const rotation = scrollY * 0.15;
  const floatY = Math.sin(Date.now() / 1000) * 5;

  return (
    <div className="bottle-wrapper" style={{ transform: `rotateY(${rotation}deg) translateY(${floatY}px)` }}>
      <svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" className="bottle-svg">
        <rect x="38" y="8" width="44" height="28" rx="8" fill="#0e7490" />
        <rect x="34" y="24" width="52" height="12" rx="4" fill="#155e75" />
        <rect x="24" y="36" width="72" height="160" rx="16" fill="url(#bottleGrad)" />
        <rect x="30" y="46" width="12" height="80" rx="6" fill="white" opacity="0.18" />
        <rect x="28" y="80" width="64" height="80" rx="8" fill="white" opacity="0.95" />
        <rect x="54" y="90" width="12" height="36" rx="3" fill="#0891b2" />
        <rect x="44" y="100" width="32" height="12" rx="3" fill="#0891b2" />
        <rect x="34" y="135" width="52" height="4" rx="2" fill="#94a3b8" />
        <rect x="40" y="143" width="40" height="3" rx="1.5" fill="#cbd5e1" />
        <rect x="44" y="150" width="32" height="3" rx="1.5" fill="#cbd5e1" />
        <ellipse cx="52" cy="175" rx="8" ry="5" fill="#22d3ee" opacity="0.5" />
        <ellipse cx="70" cy="180" rx="7" ry="4" fill="#0891b2" opacity="0.4" />
        <ellipse cx="60" cy="185" rx="6" ry="4" fill="#14b8a6" opacity="0.5" />
        <defs>
          <linearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#cffafe" />
            <stop offset="40%" stopColor="#e0f7fa" />
            <stop offset="100%" stopColor="#a5f3fc" />
          </linearGradient>
        </defs>
      </svg>
      <div className="bottle-glow" />
    </div>
  );
}

function ScrollBottle() {
  const [scrollY, setScrollY] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const floatY = Math.sin(tick * 0.1) * 8;
  const rotation = scrollY * 0.12;

  return (
    <div className="scroll-bottle-container" style={{ transform: `translateY(${floatY}px)` }}>
      <div style={{ transform: `rotateY(${rotation}deg)` }}>
        <MedicineBottle scrollY={0} />
      </div>
    </div>
  );
}

function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="ph-root">
      <div className="floating-bottle-fixed">
        <PharmoraBottle />
      </div>

      <section className="ph-hero">
        <div className="ph-hero-blob ph-hero-blob--1" />
        <div className="ph-hero-blob ph-hero-blob--2" />
        <div className="ph-hero-blob ph-hero-blob--3" />
        <div className="ph-hero-grid" />

        <div className="ph-container ph-hero-inner">
          <div className="ph-hero-copy">
            <span className="ph-pill-tag">Your Digital Pharmacy</span>

            <h1 className="ph-hero-title">
              Healthcare Made{" "}
              <span className="ph-gradient-text">Simple.</span>
              <br />
              <span className="ph-hero-subtitle-inline">Here's How.</span>
            </h1>

            <p className="ph-hero-desc">
              Discover a platform where your health, convenience, and trust matter - connecting
              patients, doctors, pharmacists, and suppliers in one secure system.
            </p>

            <div className="ph-hero-ctas">
              <Link to="/login">
                <button className="ph-btn ph-btn--primary">
                  Get Started <FiArrowRight />
                </button>
              </Link>
              <Link to="/products">
                <button className="ph-btn ph-btn--outline">Browse Medicines</button>
              </Link>
            </div>

            <div className="ph-trust-row">
              {["FDA Certified", "Licensed Pharmacy", "24/7 Support"].map((t) => (
                <span key={t} className="ph-trust-badge">
                  <span className="ph-trust-dot" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="ph-hero-visual">
            <div className="ph-hero-img-wrap">
              <img src="/images/pharmacy.jpg" alt="Pharmacy" className="ph-hero-img" />
              <div className="ph-hero-img-overlay" />
            </div>

            <div className="ph-float-card ph-float-card--tl ph-anim-float" style={{ animationDelay: "0s" }}>
              <p className="ph-fc-label">Revenue Growth</p>
              <div className="ph-fc-bars">
                {[55, 100, 75, 85, 60].map((h, i) => (
                  <div key={i} className="ph-fc-bar" style={{ height: `${h}%`, "--bar-color": ["#c084fc","#0891b2","#a855f7","#22d3ee","#7c3aed"][i] }} />
                ))}
              </div>
              <p className="ph-fc-sub">Daily</p>
            </div>

            <div className="ph-float-card ph-float-card--tr ph-anim-float" style={{ animationDelay: "0.8s" }}>
              <p className="ph-fc-label">Data Analytics</p>
              <div className="ph-fc-analytics-row">
                <span className="ph-fc-big">48k</span>
                <span className="ph-fc-check">✓</span>
              </div>
              <svg viewBox="0 0 100 35" className="ph-fc-sparkline">
                <defs>
                  <linearGradient id="sgrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points="0,30 20,22 40,26 60,12 80,18 100,6 100,35 0,35" fill="url(#sgrad)" />
                <polyline points="0,30 20,22 40,26 60,12 80,18 100,6" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="ph-float-card ph-float-card--br ph-anim-float" style={{ animationDelay: "1.4s" }}>
              <p className="ph-fc-label">Sales Stats</p>
              <div className="ph-fc-donut-row">
                <svg viewBox="0 0 36 36" className="ph-fc-donut">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#0891b2" strokeWidth="5" strokeDasharray="62 88" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#7c3aed" strokeWidth="5" strokeDasharray="26 88" strokeDashoffset="-62" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="ph-fc-sub">Daily Visitor</p>
                  <p className="ph-fc-big">800+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ph-section ph-section--white">
        <div className="ph-container ph-text-center">
          <span className="ph-pill-tag ph-pill-tag--teal">How It Works</span>
          <h2 className="ph-section-title">Making Healthcare Easy</h2>
          <p className="ph-section-desc">
            A simple three-step process to connect every part of the healthcare ecosystem.
          </p>

          <div className="ph-steps-grid">
            {[
              {
                step: "01",
                icon: (
                  <svg className="ph-step-icon" viewBox="0 0 100 100">
                    <rect x="20" y="20" width="60" height="50" rx="8" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
                    <rect x="30" y="35" width="15" height="15" rx="4" fill="#3B82F6" />
                    <circle cx="60" cy="42" r="8" fill="#3B82F6" />
                    <line x1="35" y1="60" x2="65" y2="60" stroke="#3B82F6" strokeWidth="2" />
                  </svg>
                ),
                title: "Create Your Account",
                desc: "Sign up as a patient, doctor, pharmacist, or supplier to access our comprehensive healthcare platform.",
              },
              {
                step: "02",
                icon: (
                  <svg className="ph-step-icon" viewBox="0 0 100 100">
                    <rect x="25" y="15" width="50" height="60" rx="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                    <rect x="35" y="25" width="10" height="15" rx="2" fill="#10B981" />
                    <rect x="55" y="30" width="10" height="10" rx="2" fill="#EF4444" />
                    <rect x="35" y="50" width="30" height="4" rx="2" fill="#3B82F6" />
                    <text x="50" y="70" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#000">Rx</text>
                  </svg>
                ),
                title: "Manage Prescriptions",
                desc: "Doctors issue digital prescriptions, patients submit them, and pharmacists verify and process orders.",
              },
              {
                step: "03",
                icon: (
                  <svg className="ph-step-icon" viewBox="0 0 100 100">
                    <rect x="20" y="20" width="60" height="50" rx="8" fill="#E0F2FE" stroke="#06B6D4" strokeWidth="2" />
                    <rect x="30" y="35" width="12" height="25" rx="2" fill="#06B6D4" />
                    <rect x="45" y="30" width="12" height="30" rx="2" fill="#3B82F6" />
                    <rect x="60" y="40" width="12" height="20" rx="2" fill="#14B8A6" />
                  </svg>
                ),
                title: "Streamlined Supply Chain",
                desc: "Pharmacists request stock from suppliers, track deliveries, and manage inventory — all seamlessly.",
              },
            ].map((step, i) => (
              <div key={i} className="ph-step-card">
                <div className="ph-step-number">{step.step}</div>
                <div className="ph-step-icon-wrap">{step.icon}</div>
                <h3 className="ph-step-title">{step.title}</h3>
                <p className="ph-step-desc">{step.desc}</p>
                {i < 2 && <div className="ph-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-section--slate">
        <div className="ph-container ph-why-grid">
          <div className="ph-why-visual">
            <div className="ph-why-img-frame">
              <img src="/images/why-choose-us.jpg" alt="Why Choose Us" className="ph-why-img" />
              <div className="ph-why-badge">
                <FiAward size={20} />
                <span>Trusted by 1000+ patients</span>
              </div>
            </div>
          </div>

          <div className="ph-why-content">
            <span className="ph-pill-tag">Why Pharmora</span>
            <h2 className="ph-section-title ph-section-title--left">
              Built for Trust & Reliability
            </h2>

            <div className="ph-why-features">
              {[
                { icon: <FiShield size={22} />, title: "Secure & Trusted", desc: "Safe prescriptions with end-to-end encryption and verified healthcare professionals." },
                { icon: <FiClock size={22} />, title: "24/7 Availability", desc: "Order medicines anytime, anywhere with round-the-clock customer support." },
                { icon: <FiAward size={22} />, title: "Quality Assured", desc: "All medicines are sourced from certified suppliers and thoroughly verified." },
              ].map((item, i) => (
                <div key={i} className="ph-feature-row">
                  <div className="ph-feature-icon">{item.icon}</div>
                  <div>
                    <h3 className="ph-feature-title">{item.title}</h3>
                    <p className="ph-feature-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ph-cta">
        <div className="ph-cta-blob ph-cta-blob--1" />
        <div className="ph-cta-blob ph-cta-blob--2" />

        <div className="ph-container ph-text-center ph-cta-inner">
          <div className="ph-cta-pill">Our Promise</div>
          <h2 className="ph-cta-title">Your Priorities, Our Promise</h2>
          <p className="ph-cta-desc">
            Pharmora connects patients, doctors, pharmacists, and suppliers — delivering
            prescriptions, medicine, and healthcare solutions in one secure system.
          </p>
          <Link to="/login">
            <button className="ph-btn ph-btn--white">
              Get Started Today <FiArrowRight />
            </button>
          </Link>
        </div>
      </section>

      <section className="ph-section ph-section--white">
        <div className="ph-container ph-text-center">
          <span className="ph-pill-tag ph-pill-tag--teal">What We Offer</span>
          <h2 className="ph-section-title">Our Services</h2>
          <p className="ph-section-desc">Everything you need for modern healthcare — in one place.</p>

          <div className="ph-services-grid">
            {[
              { icon: <FiTruck size={28} />, title: "Fast Delivery", desc: "Get your medicines delivered to your doorstep in record time with real-time tracking." },
              { icon: <FiUserCheck size={28} />, title: "Expert Consultation", desc: "Connect with certified doctors and pharmacists for professional medical advice." },
              { icon: <FiHeart size={28} />, title: "Healthcare Support", desc: "Comprehensive healthcare services tailored for patients and healthcare providers." },
            ].map((service, i) => (
              <div key={i} className="ph-service-card">
                <div className="ph-service-icon-wrap">{service.icon}</div>
                <h3 className="ph-service-title">{service.title}</h3>
                <p className="ph-service-desc">{service.desc}</p>
                <div className="ph-service-hover-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ph-section ph-section--dark-stats">
        <div className="ph-stats-bg-rings" />
        <div className="ph-container">
          <div className="ph-text-center ph-stats-header">
            <h2 className="ph-stats-title">Pharmora by the Numbers</h2>
            <p className="ph-stats-sub">Trusted by thousands across Pakistan</p>
          </div>
          <div className="ph-stats-grid">
            {[
              { target: 1000, suffix: "+", label: "Happy Customers", icon: <FiHeart /> },
              { target: 100, suffix: "+", label: "Medicines Available", icon: <FiPackage /> },
              { target: 50, suffix: "+", label: "Expert Doctors", icon: <FiUserCheck /> },
              { target: null, display: "24/7", label: "Support Available", icon: <FiClock /> },
            ].map((stat, i) => (
              <div key={i} className="ph-stat-card">
                <div className="ph-stat-icon">{stat.icon}</div>
                <div className="ph-stat-num">
                  {stat.target !== null
                    ? <CountUp target={stat.target} suffix={stat.suffix} />
                    : stat.display}
                </div>
                <div className="ph-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="ph-footer">
        <div className="ph-footer-top-line" />
        <div className="ph-container ph-footer-grid">
          <div>
            <h3 className="ph-footer-brand">Pharmora</h3>
            <p className="ph-footer-tagline">
              Your trusted digital pharmacy for safe, fast, and reliable healthcare solutions.
            </p>
          </div>
          <div>
            <h4 className="ph-footer-heading">Quick Links</h4>
            <ul className="ph-footer-links">
              {[
                { to: "/", label: "Home" },
                { to: "/products", label: "Products" },
                { to: "/doctors", label: "Doctors" },
                { to: "/pharmacists", label: "Pharmacists" },
                { to: "/suppliers", label: "Suppliers" },
              ].map(({ to, label }) => (
                <li key={label}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="ph-footer-heading">Services</h4>
            <ul className="ph-footer-links ph-footer-links--plain">
              {["Medicine Delivery", "Doctor Consultation", "Health Support", "Supply Management"].map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="ph-footer-heading">Contact Us</h4>
            <ul className="ph-footer-contact">
              <li><FiMail size={14} /><span>support@pharmora.com</span></li>
              <li><FiPhone size={14} /><span>+92 300 1234567</span></li>
              <li><FiMapPin size={14} /><span>Karachi, Pakistan</span></li>
            </ul>
          </div>
        </div>
        <div className="ph-footer-bottom">
          © {new Date().getFullYear()} Pharmora. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}

export default Home;