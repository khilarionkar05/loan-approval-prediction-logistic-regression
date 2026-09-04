import { Link } from 'react-router-dom';

const PROJECT_LINKS = [
  { label: 'Home',             to: '/'          },
  { label: 'Prediction Model', to: '/prediction' },
  { label: 'Live ML',          to: '/live-ml'   },
  { label: 'Methodology',      to: '/model-info' },
];

const LEGAL_LINKS = [
  { label: 'Academic Disclaimer', to: '#' },
  { label: 'Privacy Policy',      to: '#' },
  { label: 'Terms of Service',    to: '#' },
  { label: 'Data Sources',        to: '#' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Column 1+2: Brand + Description + Copyright */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand">
            <span className="material-symbols-outlined footer-brand-icon">analytics</span>
            <span className="footer-brand-name">LoanPredict AI</span>
          </Link>
          <p className="footer-desc">
            An educational tool demonstrating binary classification for loan approval
            using Logistic Regression.
          </p>
          <p className="footer-copy">
            © 2026 LoanPredict AI. All rights reserved.<br />
            Semester Mini Project 2026–2027.
          </p>
        </div>

        {/* Column 3: Project */}
        <div className="footer-links-col">
          <h3 className="footer-col-heading">Project</h3>
          <ul className="footer-links-list">
            {PROJECT_LINKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="footer-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Legal & Info */}
        <div className="footer-links-col">
          <h3 className="footer-col-heading">Legal &amp; Info</h3>
          <ul className="footer-links-list">
            {LEGAL_LINKS.map(({ label, to }) => (
              <li key={label}>
                <a href={to} className="footer-link">{label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        /* ---- Footer Shell ---- */
        .site-footer {
          background: var(--surface-alt);
          border-top: 1px solid var(--border);
          margin-top: auto;
        }
        .footer-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 48px 24px 40px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
        }

        /* ---- Brand Column ---- */
        .footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          text-decoration: none;
        }
        .footer-brand-icon {
          font-size: 22px;
          color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .footer-brand-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.02em;
        }
        .footer-desc {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.65;
          max-width: 380px;
          margin-bottom: 16px;
        }
        .footer-copy {
          font-size: 0.78rem;
          color: var(--text-light);
          line-height: 1.7;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* ---- Links Columns ---- */
        .footer-col-heading {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text);
          margin-bottom: 14px;
        }
        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .footer-link {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
        }
        .footer-link:hover { color: var(--primary); }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .footer-inner {
            grid-template-columns: 1fr 1fr;
            gap: 36px;
          }
          .footer-brand-col {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 480px) {
          .footer-inner {
            grid-template-columns: 1fr;
            padding: 36px 16px 28px;
            gap: 28px;
          }
        }
      `}</style>
    </footer>
  );
}
