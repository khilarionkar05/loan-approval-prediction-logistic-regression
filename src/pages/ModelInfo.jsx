import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/analytics-data';

export default function ModelInfo() {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadInfo() {
      try {
        const res = await fetch(API_URL);
        if (res.ok) {
          const json = await res.json();
          if (mounted) setModelData(json.model_summary);
        }
      } catch {
        // graceful fallback if backend is momentarily unreachable
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadInfo();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="model-info-page">
      {/* ── Page Header ── */}
      <div className="info-head">
        <div className="info-head-inner">
          <div className="info-badge" role="note">
            <span className="material-symbols-outlined info-badge-icon">menu_book</span>
            Architecture &amp; Mathematics
          </div>
          <h1 className="info-title">Model Information</h1>
          <p className="info-subtitle">
            Complete technical documentation of the Binary Logistic Regression classification pipeline,
            mathematical formulation, preprocessing stages, and learned parameters.
          </p>
        </div>
      </div>

      <div className="info-content">
        {/* ── Model Specifications Card ── */}
        <section className="info-card">
          <div className="info-card-header">
            <span className="material-symbols-outlined icon-blue">tune</span>
            <div>
              <h2 className="info-card-title">Model Specifications</h2>
              <p className="info-card-desc">Core supervised learning configuration and scikit-learn parameters.</p>
            </div>
          </div>

          <div className="specs-grid">
            <div className="spec-item">
              <span className="spec-label">Algorithm</span>
              <span className="spec-value">Logistic Regression</span>
              <span className="spec-sub">scikit-learn linear_model</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Classification Type</span>
              <span className="spec-value">Binary Classification</span>
              <span className="spec-sub">y ∈ {'{0: Rejected, 1: Approved}'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Optimization Solver</span>
              <span className="spec-value">L-BFGS</span>
              <span className="spec-sub">Limited-memory BFGS quasi-Newton</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Regularization</span>
              <span className="spec-value">L2 Penalty (C=1.0)</span>
              <span className="spec-sub">Standard inverse regularization strength</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Decision Threshold</span>
              <span className="spec-value">θ = 0.50 (50%)</span>
              <span className="spec-sub">Standard binary boundary</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Target Domain</span>
              <span className="spec-value">Loan Approval Decision</span>
              <span className="spec-sub">Banking risk evaluation</span>
            </div>
          </div>
        </section>

        {/* ── Mathematical Formulation ── */}
        <section className="info-card">
          <div className="info-card-header">
            <span className="material-symbols-outlined icon-purple">functions</span>
            <div>
              <h2 className="info-card-title">Mathematical Formulation</h2>
              <p className="info-card-desc">How Logistic Regression transforms applicant features into approval probability.</p>
            </div>
          </div>

          <div className="math-steps-grid">
            <div className="math-box">
              <div className="math-box-tag">Step 1: Linear Combination (Logit)</div>
              <div className="math-formula">
                <code>z = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ = β₀ + Σ(βᵢ · xᵢ)</code>
              </div>
              <p className="math-box-desc">
                The dot product of learned feature weights (<code>βᵢ</code>) and preprocessed applicant inputs (<code>xᵢ</code>), plus the intercept bias term (<code>β₀</code>).
              </p>
            </div>

            <div className="math-box">
              <div className="math-box-tag">Step 2: Sigmoid Activation</div>
              <div className="math-formula">
                <code>P(y = 1 | x) = σ(z) = 1 / (1 + e^(-z))</code>
              </div>
              <p className="math-box-desc">
                The standard logistic function maps the linear score <code>z ∈ (-∞, +∞)</code> into a calibrated probability <code>P ∈ [0, 1]</code>.
              </p>
            </div>

            <div className="math-box">
              <div className="math-box-tag">Step 3: Threshold Decision Rule</div>
              <div className="math-formula">
                <code>Prediction = Approved if P ≥ 0.50 else Rejected</code>
              </div>
              <p className="math-box-desc">
                If the calculated probability meets or exceeds the 50% cutoff, the applicant is classified as <strong>Approved</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Preprocessing Pipeline Architecture ── */}
        <section className="info-card">
          <div className="info-card-header">
            <span className="material-symbols-outlined icon-amber">account_tree</span>
            <div>
              <h2 className="info-card-title">End-to-End Preprocessing Pipeline</h2>
              <p className="info-card-desc">
                Built with <code>scikit-learn ColumnTransformer</code> and <code>Pipeline</code> to ensure identical preprocessing during training and inference.
              </p>
            </div>
          </div>

          <div className="pipeline-flow">
            <div className="pipeline-step">
              <div className="pipe-num">1</div>
              <div className="pipe-content">
                <h4>Raw Applicant Data Input</h4>
                <p>11 raw features (6 categorical attributes + 5 numerical quantities) collected via the web form.</p>
              </div>
            </div>

            <div className="pipeline-step">
              <div className="pipe-num">2</div>
              <div className="pipe-content">
                <h4>Categorical Pipeline (SimpleImputer + OrdinalEncoder)</h4>
                <p>
                  Missing values imputed using <code>most_frequent</code> strategy. Categorical variables mapped to discrete integer indices aligned with the training dictionary.
                </p>
                <div className="pipe-tags">
                  <span>Gender</span><span>Married</span><span>Dependents</span>
                  <span>Education</span><span>Self_Employed</span><span>Property_Area</span>
                </div>
              </div>
            </div>

            <div className="pipeline-step">
              <div className="pipe-num">3</div>
              <div className="pipe-content">
                <h4>Numerical Pipeline (SimpleImputer + StandardScaler)</h4>
                <p>
                  Missing numerical values imputed via <code>median</code>. Features standardized to zero mean (<code>μ = 0</code>) and unit variance (<code>σ = 1</code>) to prevent scale dominance.
                </p>
                <div className="pipe-tags">
                  <span>ApplicantIncome</span><span>CoapplicantIncome</span><span>LoanAmount</span>
                  <span>Loan_Amount_Term</span><span>Credit_History</span>
                </div>
              </div>
            </div>

            <div className="pipeline-step">
              <div className="pipe-num">4</div>
              <div className="pipe-content">
                <h4>ColumnTransformer Integration</h4>
                <p>Combines transformed numerical and encoded categorical vectors into an engineered feature matrix <code>X</code>.</p>
              </div>
            </div>

            <div className="pipeline-step">
              <div className="pipe-num">5</div>
              <div className="pipe-content">
                <h4>LogisticRegression Classification</h4>
                <p>
                  Computes linear score <code>z = X · β + β₀</code>, passes through sigmoid <code>σ(z)</code>, and evaluates <code>P ≥ 0.50</code>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Learned Parameters (Live Model Values) ── */}
        <section className="info-card">
          <div className="info-card-header">
            <span className="material-symbols-outlined icon-green">data_object</span>
            <div>
              <h2 className="info-card-title">Learned Model Parameters</h2>
              <p className="info-card-desc">
                Parameters learned by the solver from the training dataset.
              </p>
            </div>
          </div>

          <div className="learned-params-wrap">
            <div className="intercept-highlight">
              <span className="intercept-title">Model Intercept (Bias Term β₀)</span>
              <span className="intercept-value">
                {loading ? 'Loading…' : modelData ? `+${modelData.intercept.toFixed(4)}` : '+4.4280'}
              </span>
              <p className="intercept-desc">
                Baseline log-odds of loan approval prior to evaluating specific applicant features.
              </p>
            </div>

            <div className="coef-summary-list">
              <h4 className="coef-list-heading">Learned Feature Weights (β)</h4>
              <div className="coef-items-grid">
                {(modelData?.coefficients || [
                  { feature: 'Credit_History', coefficient: 2.0624, type: 'numerical' },
                  { feature: 'Property_Area', coefficient: -1.6862, type: 'categorical' },
                  { feature: 'LoanAmount', coefficient: -0.9129, type: 'numerical' },
                  { feature: 'Dependents', coefficient: -0.7176, type: 'categorical' },
                  { feature: 'CoapplicantIncome', coefficient: 0.4291, type: 'numerical' },
                  { feature: 'Education', coefficient: -0.4029, type: 'categorical' },
                  { feature: 'Self_Employed', coefficient: -0.3218, type: 'categorical' },
                  { feature: 'Gender', coefficient: 0.3036, type: 'categorical' },
                  { feature: 'Married', coefficient: 0.2848, type: 'categorical' },
                  { feature: 'Loan_Amount_Term', coefficient: -0.2274, type: 'numerical' },
                  { feature: 'ApplicantIncome', coefficient: -0.0120, type: 'numerical' },
                ]).map(c => (
                  <div key={c.feature} className="coef-box">
                    <div className="coef-box-top">
                      <code>{c.feature}</code>
                      <span className={`coef-val ${c.coefficient >= 0 ? 'pos' : 'neg'}`}>
                        {c.coefficient >= 0 ? `+${c.coefficient.toFixed(4)}` : c.coefficient.toFixed(4)}
                      </span>
                    </div>
                    <span className="coef-box-sub">
                      {c.coefficient >= 0 ? 'Increases approval chance' : 'Decreases approval chance'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Academic Justification Card ── */}
        <section className="info-card">
          <div className="info-card-header">
            <span className="material-symbols-outlined icon-blue">school</span>
            <div>
              <h2 className="info-card-title">Why Logistic Regression for Loan Approval?</h2>
              <p className="info-card-desc">Academic rationale for binary classification in credit underwriting.</p>
            </div>
          </div>

          <div className="reasons-grid">
            <div className="reason-item">
              <span className="material-symbols-outlined reason-icon">visibility</span>
              <h4>Explainability &amp; Transparency</h4>
              <p>
                Unlike black-box models, every feature in Logistic Regression has a direct, readable weight (β) that transparently explains the contribution to the approval or rejection decision.
              </p>
            </div>

            <div className="reason-item">
              <span className="material-symbols-outlined reason-icon">percent</span>
              <h4>Calibrated Probabilities</h4>
              <p>
                Logistic Regression outputs true posterior probabilities <code>P(y=1|x)</code> via the sigmoid curve, allowing financial risk analysts to evaluate credit confidence rather than just discrete binary outputs.
              </p>
            </div>

            <div className="reason-item">
              <span className="material-symbols-outlined reason-icon">balance</span>
              <h4>Regulatory Compliance</h4>
              <p>
                Financial lending regulations (such as the Equal Credit Opportunity Act and Fair Housing Act) mandate adverse action notices explaining why a loan was rejected, which linear weights naturally satisfy.
              </p>
            </div>

            <div className="reason-item">
              <span className="material-symbols-outlined reason-icon">speed</span>
              <h4>Computation Efficiency</h4>
              <p>
                Inference requires a single vector dot product and exponentiation, delivering sub-millisecond predictions ideal for real-time web application deployment.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .model-info-page {
          flex: 1;
          background: var(--bg);
          padding-bottom: 64px;
        }

        .info-head {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 36px 24px;
        }
        .info-head-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .info-badge {
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
        .info-badge-icon { font-size: 16px; }
        .info-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
        }
        .info-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
          max-width: 780px;
          line-height: 1.6;
        }

        .info-content {
          max-width: var(--max-w);
          margin: 32px auto 0;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .info-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        .info-card-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .info-card-header .material-symbols-outlined {
          font-size: 26px;
          margin-top: 2px;
        }
        .icon-blue { color: #2563eb; }
        .icon-purple { color: #9333ea; }
        .icon-amber { color: #d97706; }
        .icon-green { color: #16a34a; }

        .info-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
        }
        .info-card-desc {
          font-size: 0.86rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Specs Grid */
        .specs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .spec-item {
          background: var(--surface-alt);
          padding: 16px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .spec-label { font-size: 0.74rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
        .spec-value { font-size: 1.05rem; font-weight: 700; color: var(--text); }
        .spec-sub { font-size: 0.78rem; color: var(--text-light); }

        /* Math Steps */
        .math-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .math-box {
          background: var(--surface-alt);
          padding: 20px;
          border-radius: 8px;
          border-top: 3px solid var(--primary);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .math-box-tag {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--primary);
        }
        .math-formula {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          font-family: monospace;
          font-size: 0.85rem;
          color: var(--text);
          word-break: break-word;
        }
        .math-box-desc {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* Pipeline Flow */
        .pipeline-flow {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pipeline-step {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          padding: 14px 16px;
          background: var(--surface-alt);
          border-radius: 8px;
        }
        .pipe-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .pipe-content h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }
        .pipe-content p {
          font-size: 0.84rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .pipe-tags {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .pipe-tags span {
          background: #fff;
          border: 1px solid var(--border);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.74rem;
          font-family: monospace;
          color: var(--text-muted);
        }

        /* Learned Params */
        .learned-params-wrap {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .intercept-highlight {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          padding: 18px 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .intercept-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: #16a34a; letter-spacing: 0.05em; }
        .intercept-value { font-size: 1.8rem; font-weight: 800; color: #15803d; font-family: monospace; }
        .intercept-desc { font-size: 0.82rem; color: #166534; }

        .coef-list-heading {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .coef-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 12px;
        }
        .coef-box {
          background: var(--surface-alt);
          padding: 12px 14px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .coef-box-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .coef-box-top code {
          font-weight: 600;
          color: var(--text);
          font-size: 0.82rem;
        }
        .coef-val {
          font-weight: 700;
          font-family: monospace;
          font-size: 0.88rem;
        }
        .coef-val.pos { color: #16a34a; }
        .coef-val.neg { color: #dc2626; }
        .coef-box-sub {
          font-size: 0.72rem;
          color: var(--text-light);
        }

        /* Reasons Grid */
        .reasons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 18px;
        }
        .reason-item {
          background: var(--surface-alt);
          padding: 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .reason-icon { font-size: 26px; color: var(--primary); }
        .reason-item h4 { font-size: 0.98rem; font-weight: 700; color: var(--text); }
        .reason-item p { font-size: 0.84rem; color: var(--text-muted); line-height: 1.55; }

        @media (max-width: 1024px) {
          .specs-grid { grid-template-columns: repeat(2, 1fr); }
          .math-steps-grid { grid-template-columns: 1fr; }
          .reasons-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .specs-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
