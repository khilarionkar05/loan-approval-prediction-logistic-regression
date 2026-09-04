import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',              to: '/'              },
  { label: 'Prediction',        to: '/prediction'    },
  { label: 'Live ML',           to: '/live-ml'       },
  { label: 'Live Analysis',     to: '/live-analysis' },
  { label: 'Analytics',         to: '/analytics'     },
  { label: 'Model Information', to: '/model-info'    },
  { label: 'About',             to: '/about'         },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleStartPrediction = () => {
    navigate('/prediction');
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand */}
        <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="material-symbols-outlined brand-icon">analytics</span>
          <span className="brand-name">LoanPredict AI</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' nav-link--active' : '')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <button className="btn-predict" onClick={handleStartPrediction}>
          Start Prediction
          <span className="material-symbols-outlined btn-icon">arrow_forward</span>
        </button>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(prev => !prev)}
        >
          <span className="material-symbols-outlined">
            {menuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  'mobile-nav-link' + (isActive ? ' mobile-nav-link--active' : '')
                }
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <button className="mobile-btn-predict" onClick={handleStartPrediction}>
            Start Prediction
            <span className="material-symbols-outlined btn-icon">arrow_forward</span>
          </button>
        </div>
      )}

      <style>{`
        /* ---- Header Shell ---- */
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: var(--header-h);
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          z-index: 1000;
        }

        .header-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          height: 100%;
          padding: 0 24px;
          display: flex;
          align-items: center;
          gap: 32px;
        }

        /* ---- Brand ---- */
        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          text-decoration: none;
        }
        .brand-icon {
          font-size: 26px;
          color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .brand-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        /* ---- Desktop Nav ---- */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .nav-link {
          padding: 6px 12px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-muted);
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: var(--primary);
        }
        .nav-link--active {
          color: var(--primary);
          font-weight: 600;
          border-bottom-color: var(--primary);
          padding-bottom: 4px;
        }

        /* ---- Desktop CTA ---- */
        .btn-predict {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          background: var(--primary);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s, transform 0.1s;
          flex-shrink: 0;
        }
        .btn-predict:hover  { background: var(--primary-dark); }
        .btn-predict:active { transform: translateY(1px); }
        .btn-icon { font-size: 18px; }

        /* ---- Hamburger ---- */
        .hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text);
          padding: 4px;
          margin-left: auto;
        }
        .hamburger .material-symbols-outlined { font-size: 26px; }

        /* ---- Mobile Menu ---- */
        .mobile-menu {
          position: fixed;
          top: var(--header-h);
          left: 0;
          width: 100%;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          padding: 16px 24px 20px;
          z-index: 999;
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 16px;
        }
        .mobile-nav-link {
          padding: 10px 12px;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-muted);
          border-radius: 6px;
          transition: background 0.12s, color 0.12s;
        }
        .mobile-nav-link:hover { background: var(--primary-light); color: var(--primary); }
        .mobile-nav-link--active { background: var(--primary-light); color: var(--primary); font-weight: 600; }

        .mobile-btn-predict {
          display: flex;
          align-items: center;
          gap: 6px;
          width: 100%;
          justify-content: center;
          padding: 11px 18px;
          background: var(--primary);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          transition: background 0.15s;
        }
        .mobile-btn-predict:hover { background: var(--primary-dark); }

        /* ---- Responsive ---- */
        @media (max-width: 900px) {
          .desktop-nav   { display: none; }
          .btn-predict   { display: none; }
          .hamburger     { display: flex; }
          .brand-name    { font-size: 1.05rem; }
        }

        @media (max-width: 480px) {
          .header-inner { padding: 0 16px; gap: 12px; }
        }
      `}</style>
    </header>
  );
}
