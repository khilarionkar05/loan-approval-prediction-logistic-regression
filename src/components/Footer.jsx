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
        {/* Column 1+2: Brand + Copyright */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand">
            <img className="footer-brand-logo" src={`${import.meta.env.BASE_URL}load%20logo.png`} alt="LoanPredict AI logo" />
          </Link>
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

        <p className="footer-copy">
          © 2026 LoanPredict AI. All rights reserved. Semester Mini Project 2026–2027.
        </p>
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
        .footer-brand-col {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: start;
          column-gap: 20px;
        }
        .footer-brand {
          display: block;
          text-decoration: none;
        }
        .footer-brand-logo {
          width: 128px;
          max-width: 100%;
          height: auto;
          display: block;
          flex-shrink: 0;
        }
        .footer-copy {
          grid-column: 1 / -1;
          min-width: 0;
          width: 100vw;
          margin-left: -24px;
          font-size: 0.78rem;
          color: var(--text-light);
          line-height: 1.7;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          text-align: center;
          white-space: nowrap;
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
          .footer-brand-col {
            grid-template-columns: 1fr;
            row-gap: 16px;
          }
          .footer-brand {
            justify-self: center;
          }
          .footer-copy {
            margin-left: -16px;
            font-size: 0.5rem;
          }
        }
      `}</style>
    </footer>
  );
}
