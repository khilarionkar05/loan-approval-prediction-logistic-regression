import { Link } from 'react-router-dom';

export default function About() {
  return (
    <main className="about-page">
      {/* ── Page Header ── */}
      <div className="about-head">
        <div className="about-head-inner">
          <div className="about-badge" role="note">
            <span className="material-symbols-outlined about-badge-icon">school</span>
            Academic Semester Mini Project 2026–2027
          </div>
          <h1 className="about-title">About LoanPredict AI</h1>
          <p className="about-subtitle">
            An educational Machine Learning web application designed to demonstrate binary classification
            for loan approval decisions using transparent, interpretable Logistic Regression.
          </p>
        </div>
      </div>

      <div className="about-content">
        {/* ── Academic Disclaimer Alert ── */}
        <div className="disclaimer-banner" role="alert">
          <span className="material-symbols-outlined banner-icon">verified_user</span>
          <div className="banner-text">
            <h3>Academic Project Disclaimer</h3>
            <p>
              This system is built exclusively for educational demonstration and academic research
              purposes as part of a Semester Mini Project (2026–2027). It is <strong>not</strong> an authorized
              financial institution, credit bureau, or banking system. Predicted probabilities and decisions
              must not be used for actual lending or financial decisions.
            </p>
          </div>
        </div>

        {/* ── Project Overview & Problem Statement ── */}
        <div className="about-grid-2">
          <section className="about-card">
            <div className="about-card-header">
              <span className="material-symbols-outlined card-icon">flag</span>
              <h2 className="about-card-title">Project Purpose</h2>
            </div>
            <p className="about-card-body">
              LoanPredict AI was developed to bridge the gap between theoretical Machine Learning
              concepts taught in engineering and practical software engineering. While modern AI often
              focuses on opaque deep neural networks, financial and credit institutions legally require
              strict explainability and algorithmic fairness.
            </p>
            <p className="about-card-body">
              This project provides complete visibility into every stage of the Logistic Regression
              pipeline—from applicant feature ingestion and normalization to linear weight dot-products
              and sigmoid probability calibration.
            </p>
          </section>

          <section className="about-card">
            <div className="about-card-header">
              <span className="material-symbols-outlined card-icon">psychology</span>
              <h2 className="about-card-title">Problem Statement</h2>
            </div>
            <p className="about-card-body">
              Manual loan evaluation is time-intensive, subjective, and prone to human inconsistency.
              A binary classification system predicts whether an applicant’s requested credit line
              will be <strong>Approved (Y)</strong> or <strong>Rejected (N)</strong> based on demographic,
              financial, and credit history attributes.
            </p>
            <p className="about-card-body">
              The model evaluates applicant income, co-applicant income, credit history, loan amount,
              loan term, dependents, education, and property area to compute a reliable risk assessment.
            </p>
          </section>
        </div>

        {/* ── End-to-End Workflow ── */}
        <section className="about-card">
          <div className="about-card-header">
            <span className="material-symbols-outlined card-icon">linear_scale</span>
            <div>
              <h2 className="about-card-title">Machine Learning Architecture Workflow</h2>
              <p className="about-card-desc">The synchronous lifecycle of an applicant prediction request.</p>
            </div>
          </div>

          <div className="workflow-steps">
            <div className="wf-step">
              <div className="wf-step-num">01</div>
              <h4>Input Collection &amp; Validation</h4>
              <p>Applicant inputs are validated client-side with immediate feedback, then transmitted as JSON to Flask.</p>
            </div>

            <div className="wf-step">
              <div className="wf-step-num">02</div>
              <h4>Pipeline Preprocessing</h4>
              <p>Flask passes raw data into a scikit-learn ColumnTransformer. Numerical features are scaled (StandardScaler), and categories are mapped (OrdinalEncoder).</p>
            </div>

            <div className="wf-step">
              <div className="wf-step-num">03</div>
              <h4>Linear Dot Product (z)</h4>
              <p>The model computes <code>z = β₀ + Σ(βᵢ · xᵢ)</code>, aggregating the bias intercept and per-feature weighted contributions.</p>
            </div>

            <div className="wf-step">
              <div className="wf-step-num">04</div>
              <h4>Sigmoid &amp; Threshold Decision</h4>
              <p>The sigmoid function maps <code>z</code> into <code>P ∈ [0, 1]</code>. An approval decision is made based on the <code>P ≥ 0.50</code> decision threshold.</p>
            </div>
          </div>
        </section>

        {/* ── Technology Stack ── */}
        <section className="about-card">
          <div className="about-card-header">
            <span className="material-symbols-outlined card-icon">terminal</span>
            <div>
              <h2 className="about-card-title">Technology Stack</h2>
              <p className="about-card-desc">Modern, responsive, zero-bloat technology stack.</p>
            </div>
          </div>

          <div className="tech-stack-grid">
            <div className="tech-box">
              <div className="tech-badge">Frontend</div>
              <h3>React 19 + Vite</h3>
              <ul>
                <li><strong>React Router v7</strong> for seamless client-side single-page navigation</li>
                <li><strong>Vanilla CSS</strong> custom design system with CSS custom properties</li>
                <li><strong>Google Material Symbols</strong> for iconography</li>
                <li>Accessible, responsive layout tested across mobile, tablet, and desktop</li>
              </ul>
            </div>

            <div className="tech-box">
              <div className="tech-badge">Backend Service</div>
              <h3>Python 3 + Flask</h3>
              <ul>
                <li><strong>Flask RESTful API</strong> handling <code>/predict</code>, <code>/analyze</code>, and <code>/analytics-data</code></li>
                <li><strong>Flask-CORS</strong> for secure cross-origin communication with Vite dev server</li>
                <li>Strict input payload validation preventing malformed or out-of-domain requests</li>
                <li>In-memory model inference using <code>joblib</code> serialization</li>
              </ul>
            </div>

            <div className="tech-box">
              <div className="tech-badge">Machine Learning</div>
              <h3>scikit-learn</h3>
              <ul>
                <li><strong>LogisticRegression</strong> with L-BFGS solver and L2 regularization</li>
                <li><strong>ColumnTransformer &amp; Pipeline</strong> for reproducible, leak-free preprocessing</li>
                <li><strong>StandardScaler &amp; SimpleImputer</strong> for numerical feature normalization</li>
                <li><strong>OrdinalEncoder</strong> aligned strictly with training domain categories</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Quick Links CTA ── */}
        <section className="about-cta-card">
          <div className="cta-left">
            <h3>Explore the Interactive Machine Learning Pipeline</h3>
            <p>Test individual applicant profiles, inspect real coefficient contributions, or explore full dataset metrics.</p>
          </div>
          <div className="cta-actions">
            <Link to="/prediction" className="cta-btn primary">
              <span className="material-symbols-outlined">play_arrow</span>
              Run Prediction
            </Link>
            <Link to="/live-ml" className="cta-btn secondary">
              <span className="material-symbols-outlined">science</span>
              Explore Live ML
            </Link>
            <Link to="/analytics" className="cta-btn secondary">
              <span className="material-symbols-outlined">analytics</span>
              Analytics Dashboard
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        .about-page {
          flex: 1;
          background: var(--bg);
          padding-bottom: 64px;
        }

        .about-head {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 36px 24px;
        }
        .about-head-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .about-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: var(--primary-light);
          border: 1px solid rgba(37,99,235,.2);
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--primary);
          width: fit-content;
          text-transform: uppercase;
        }
        .about-badge-icon { font-size: 16px; }
        .about-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
        }
        .about-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
          max-width: 780px;
          line-height: 1.6;
        }

        .about-content {
          max-width: var(--max-w);
          margin: 32px auto 0;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Disclaimer Banner ── */
        .disclaimer-banner {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--radius);
          padding: 20px 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          box-shadow: var(--shadow-sm);
        }
        .banner-icon { font-size: 28px; color: var(--primary); flex-shrink: 0; margin-top: 2px; }
        .banner-text h3 { font-size: 1rem; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
        .banner-text p { font-size: 0.88rem; color: #1e3a8a; line-height: 1.55; }

        /* ── Grid 2 ── */
        .about-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .about-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .about-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .card-icon { font-size: 24px; color: var(--primary); }
        .about-card-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text);
        }
        .about-card-desc {
          font-size: 0.84rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .about-card-body {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.65;
        }

        /* ── Workflow Steps ── */
        .workflow-steps {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        .wf-step {
          background: var(--surface-alt);
          padding: 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wf-step-num {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--primary);
          background: #fff;
          border: 1px solid var(--border);
          width: fit-content;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .wf-step h4 {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text);
        }
        .wf-step p {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* ── Tech Stack Grid ── */
        .tech-stack-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .tech-box {
          background: var(--surface-alt);
          padding: 22px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tech-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--primary);
        }
        .tech-box h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
        }
        .tech-box ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .tech-box li {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
          position: relative;
          padding-left: 14px;
        }
        .tech-box li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--primary);
        }

        /* ── CTA Card ── */
        .about-cta-card {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: var(--radius);
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .cta-left h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }
        .cta-left p {
          font-size: 0.86rem;
          color: var(--text-muted);
        }
        .cta-actions {
          display: flex;
          gap: 10px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.1s;
        }
        .cta-btn.primary {
          background: var(--primary);
          color: #fff;
        }
        .cta-btn.secondary {
          background: #fff;
          color: var(--text);
          border: 1px solid var(--border);
        }
        .cta-btn:hover { transform: translateY(-1px); }

        @media (max-width: 1024px) {
          .about-grid-2 { grid-template-columns: 1fr; }
          .workflow-steps { grid-template-columns: repeat(2, 1fr); }
          .tech-stack-grid { grid-template-columns: 1fr; }
          .about-cta-card { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 640px) {
          .workflow-steps { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
