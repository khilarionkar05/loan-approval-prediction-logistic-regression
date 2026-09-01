import { useNavigate } from 'react-router-dom';

/* ─── Circular probability ring ───────────────────────────────────────────── */
function ProbabilityRing({ probability }) {
  const r = 40;
  const circ = 2 * Math.PI * r; // ≈ 251.3
  // probability: 0–1 or null
  const pct   = probability != null ? Math.max(0, Math.min(1, probability)) : 0;
  const dash  = pct * circ;
  const gap   = circ - dash;
  const label = probability != null ? `${(pct * 100).toFixed(1)}%` : '—';
  const empty = probability == null;

  return (
    <div className="prob-ring-wrap">
      <svg viewBox="0 0 100 100" className="prob-ring-svg" aria-hidden="true">
        {/* track */}
        <circle cx="50" cy="50" r={r} className="ring-track" />
        {/* fill — only render when data exists */}
        {!empty && (
          <circle
            cx="50" cy="50" r={r}
            className="ring-fill"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={circ * 0.25} /* start at top */
          />
        )}
      </svg>
      <div className="prob-ring-label">
        <span className="prob-value">{label}</span>
        <span className="prob-sub">Probability</span>
      </div>
    </div>
  );
}

/* ─── Main Home component ──────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();

  /*
   * modelData: will be populated by the ML backend when implemented.
   * For now — null → card shows a clean ready / waiting state.
   * Shape when real data arrives:
   *   { probability: 0.726, prediction: 'APPROVED' | 'REJECTED',
   *     linearScore: 0.96, threshold: 0.50 }
   */
  const modelData = null;

  const hasData  = modelData != null;
  const approved = hasData && modelData.prediction === 'APPROVED';

  return (
    <main className="home-page">
      {/* subtle grid background */}
      <div className="home-bg-grid" aria-hidden="true" />

      <div className="hero-inner">

        {/* ── LEFT: Introduction ── */}
        <section className="hero-left" aria-labelledby="hero-title">

          {/* Badge */}
          <div className="hero-badge" role="note">
            <span className="badge-dot" aria-hidden="true" />
            MACHINE LEARNING PROJECT
          </div>

          {/* Title */}
          <h1 id="hero-title" className="hero-title">
            Loan Approval Prediction Using{' '}
            <span className="hero-title-highlight">Logistic Regression</span>
          </h1>

          {/* Description */}
          <p className="hero-desc">
            An interactive Machine Learning system that predicts loan approval
            probability and visually explains how Logistic Regression transforms
            applicant data into a final decision. Built for transparency and
            academic insight.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-row">
            <button
              id="btn-start-prediction"
              className="cta-primary"
              onClick={() => navigate('/prediction')}
              aria-label="Start a loan approval prediction"
            >
              <span className="material-symbols-outlined cta-icon">arrow_forward</span>
              Start Prediction
            </button>

            <button
              id="btn-explore-live-ml"
              className="cta-secondary"
              onClick={() => navigate('/live-ml')}
              aria-label="Explore the Live ML working page"
            >
              <span className="material-symbols-outlined cta-icon">science</span>
              Explore Live ML
            </button>
          </div>

          {/* Academic note */}
          <p className="hero-academic-note">
            <span className="material-symbols-outlined note-icon">info</span>
            Academic demonstration · Semester Mini Project 2026–2027
          </p>
        </section>

        {/* ── RIGHT: LR Preview Card ── */}
        <aside className="hero-right" aria-label="Logistic Regression model status">

          {/* Decorative floating nodes */}
          <div className="deco-nodes" aria-hidden="true">
            <span className="dnode dnode-1" />
            <span className="dnode dnode-2" />
            <span className="dnode dnode-3" />
            {/* connecting SVG line */}
            <svg className="dnode-line" viewBox="0 0 160 120" fill="none">
              <path d="M20 20 Q80 60 140 100" stroke="#2563eb" strokeWidth="1.5"
                    strokeOpacity="0.18" strokeDasharray="4 4" />
            </svg>
          </div>

          <div className="lr-card">

            {/* Card Header */}
            <div className="lr-card-header">
              <span className="material-symbols-outlined lr-header-icon">functions</span>
              <span className="lr-header-title">Logistic Regression</span>
              <span className={`lr-status-badge ${hasData ? 'lr-status-live' : 'lr-status-ready'}`}>
                {hasData ? 'LIVE' : 'READY'}
              </span>
            </div>

            {/* Probability ring */}
            <ProbabilityRing probability={hasData ? modelData.probability : null} />

            {/* Prediction label */}
            <div className="lr-prediction-row">
              <span className="lr-row-label">Prediction</span>
              {hasData ? (
                <span className={`lr-prediction-val ${approved ? 'pred-approved' : 'pred-rejected'}`}>
                  <span className="material-symbols-outlined pred-icon">
                    {approved ? 'check_circle' : 'cancel'}
                  </span>
                  {modelData.prediction}
                </span>
              ) : (
                <span className="lr-waiting">Awaiting applicant data</span>
              )}
            </div>

            {/* Divider */}
            <div className="lr-divider" />

            {/* Data rows */}
            <div className="lr-data-rows">
              <div className="lr-data-row">
                <span className="lr-data-label">Linear Score (z)</span>
                <span className="lr-data-val">
                  {hasData && modelData.linearScore != null
                    ? (modelData.linearScore >= 0 ? '+' : '') + modelData.linearScore.toFixed(3)
                    : '—'}
                </span>
              </div>
              <div className="lr-data-row">
                <span className="lr-data-label">Threshold</span>
                <span className="lr-data-val">
                  {hasData && modelData.threshold != null
                    ? modelData.threshold.toFixed(2)
                    : '0.50'}
                </span>
              </div>
              <div className="lr-data-row">
                <span className="lr-data-label">Decision Rule</span>
                <span className="lr-data-val lr-formula">P(y=1|x) ≥ θ</span>
              </div>
            </div>

            {/* Footer note */}
            <p className="lr-card-note">
              {hasData
                ? 'Values from the trained Logistic Regression model.'
                : 'Run a prediction to see live model output.'}
            </p>
          </div>
        </aside>
      </div>

      {/* ─── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Page shell ── */
        .home-page {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        /* Subtle dot-grid background */
        .home-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 60% 10%, rgba(37,99,235,.06) 0%, transparent 60%),
            radial-gradient(rgba(37,99,235,.07) 1px, transparent 1px);
          background-size: 100% 100%, 28px 28px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Hero layout ── */
        .hero-inner {
          position: relative;
          z-index: 1;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 72px 24px 80px;
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 56px;
          align-items: center;
        }

        /* ── LEFT side ── */
        .hero-left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Badge */
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--primary-light);
          border: 1px solid rgba(37,99,235,.22);
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--primary);
          width: fit-content;
        }
        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary);
          animation: badge-pulse 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .55; transform: scale(.85); }
        }

        /* Title */
        .hero-title {
          font-size: clamp(1.8rem, 3.5vw, 3rem);
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.03em;
          color: var(--text);
        }
        .hero-title-highlight {
          color: var(--primary);
        }

        /* Description */
        .hero-desc {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 520px;
        }

        /* CTA buttons */
        .hero-cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .cta-primary, .cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 22px;
          border-radius: var(--radius);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .cta-primary {
          background: var(--primary);
          color: #fff;
          box-shadow: var(--shadow-md);
        }
        .cta-primary:hover  { background: var(--primary-dark); box-shadow: 0 6px 18px rgba(37,99,235,.25); }
        .cta-primary:active { transform: translateY(1px); }

        .cta-secondary {
          background: var(--surface);
          color: var(--primary);
          border: 1.5px solid var(--border);
          box-shadow: var(--shadow-sm);
        }
        .cta-secondary:hover  { background: var(--primary-light); border-color: rgba(37,99,235,.3); }
        .cta-secondary:active { transform: translateY(1px); }

        .cta-icon { font-size: 18px; }

        /* Academic note */
        .hero-academic-note {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-light);
        }
        .note-icon { font-size: 15px; }

        /* ── RIGHT side ── */
        .hero-right {
          position: relative;
        }

        /* Decorative nodes */
        .deco-nodes {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .dnode {
          position: absolute;
          border-radius: 50%;
          background: var(--primary);
          opacity: .15;
        }
        .dnode-1 { width: 14px; height: 14px; top: 8%;  right: 6%;  opacity: .22; }
        .dnode-2 { width:  9px; height:  9px; top: 38%; right: -2%; opacity: .14; }
        .dnode-3 { width: 12px; height: 12px; top: 75%; right: 12%; opacity: .18; }
        .dnode-line { position: absolute; top: 0; right: 0; width: 160px; height: 120px; }

        /* Card */
        .lr-card {
          position: relative;
          z-index: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(37,99,235,.09), 0 2px 8px rgba(0,0,0,.05);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .lr-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 40px rgba(37,99,235,.13), 0 4px 12px rgba(0,0,0,.07);
        }

        /* Card header row */
        .lr-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lr-header-icon {
          font-size: 20px;
          color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .lr-header-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          flex: 1;
        }
        .lr-status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 3px 9px;
          border-radius: 999px;
        }
        .lr-status-ready {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .lr-status-live {
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid rgba(37,99,235,.25);
        }

        /* ── Probability ring ── */
        .prob-ring-wrap {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .prob-ring-svg {
          width: 100px;
          height: 100px;
          transform: rotate(-90deg);
          flex-shrink: 0;
        }
        .ring-track {
          fill: none;
          stroke: var(--border);
          stroke-width: 8;
        }
        .ring-fill {
          fill: none;
          stroke: var(--primary);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.6s ease;
        }
        .prob-ring-label {
          display: flex;
          flex-direction: column;
        }
        .prob-value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
          letter-spacing: -0.03em;
        }
        .prob-sub {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
          font-weight: 500;
        }

        /* Prediction row */
        .lr-prediction-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .lr-row-label {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .lr-prediction-val {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .pred-icon { font-size: 16px; }
        .pred-approved { color: #16a34a; }
        .pred-rejected { color: #dc2626; }
        .lr-waiting {
          font-size: 0.8rem;
          color: var(--text-light);
          font-style: italic;
        }

        /* Divider */
        .lr-divider {
          height: 1px;
          background: var(--border);
          margin: 0 -4px;
        }

        /* Data rows */
        .lr-data-rows {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .lr-data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lr-data-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .lr-data-val {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }
        .lr-formula {
          font-family: 'Courier New', monospace;
          font-size: 0.78rem;
          color: var(--primary);
          background: var(--primary-light);
          padding: 2px 7px;
          border-radius: 4px;
        }

        /* Card footer note */
        .lr-card-note {
          font-size: 0.75rem;
          color: var(--text-light);
          text-align: center;
          padding-top: 4px;
          border-top: 1px solid var(--border);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hero-inner {
            grid-template-columns: 1fr;
            padding: 48px 24px 56px;
            gap: 40px;
          }
          .hero-right { order: 2; }
          .hero-left  { order: 1; }
          .lr-card    { max-width: 480px; margin: 0 auto; width: 100%; }
        }

        @media (max-width: 480px) {
          .hero-inner { padding: 36px 16px 48px; gap: 32px; }
          .hero-cta-row { flex-direction: column; }
          .cta-primary, .cta-secondary { width: 100%; justify-content: center; }
          .prob-ring-svg { width: 80px; height: 80px; }
          .prob-value { font-size: 1.6rem; }
        }
      `}</style>
    </main>
  );
}
