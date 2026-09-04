import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'loanPredictMLAnalysis';

/* ─── Probability gauge (SVG ring) ─────────────────────────────────────── */
function ProbGauge({ prob, approved }) {
  const r    = 44, circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(1, prob));
  const fill = pct * circ;
  const color = approved ? '#16a34a' : '#dc2626';
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 100 100" className="gauge-svg" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray .7s ease' }} />
      </svg>
      <div className="gauge-label">
        <span className="gauge-pct" style={{ color }}>{(pct * 100).toFixed(1)}%</span>
        <span className="gauge-sub">Probability</span>
      </div>
    </div>
  );
}

/* ─── Step card wrapper ─────────────────────────────────────────────────── */
function StepCard({ num, title, desc, children }) {
  return (
    <div className="step-card step-card--visible">
      <div className="step-card-head">
        <span className="step-num">{num}</span>
        <div>
          <div className="step-title">{title}</div>
          {desc && <div className="step-desc">{desc}</div>}
        </div>
      </div>
      <div className="step-body">{children}</div>
    </div>
  );
}

function loadStoredAnalysis() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.prediction && parsed.probability != null && parsed.feature_names) {
        return parsed;
      }
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

/* ─── Main LiveML page (Read-Only Visualization) ───────────────────────── */
export default function LiveML() {
  const [result, setResult] = useState(() => loadStoredAnalysis());

  // Listen to potential storage events or keep synchronized
  useEffect(() => {
    const handleStorage = () => {
      setResult(loadStoredAnalysis());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const r = result;

  return (
    <main className="lml-page">

      {/* ── Page header ── */}
      <div className="lml-page-head">
        <div className="lml-head-inner">
          <div className="lml-head-top">
            <div className="lml-badge" role="note">
              <span className="material-symbols-outlined lml-badge-icon">play_circle</span>
              LIVE MODEL VISUALIZATION
            </div>
            {r && (
              <span className="lml-sync-badge">
                <span className="material-symbols-outlined" style={{fontSize:'14px'}}>sync</span>
                Real Analysis from Prediction Page
              </span>
            )}
          </div>
          <h1 className="lml-title">Live Logistic Regression</h1>
          <p className="lml-subtitle">
            Complete real-time scikit-learn Logistic Regression processing breakdown for your loan application.
          </p>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="lml-main">

        {/* Empty State when no analysis is available in sessionStorage */}
        {!r && (
          <div className="lml-idle" role="status">
            <span className="material-symbols-outlined lml-idle-icon">model_training</span>
            <h3>No Prediction Analysis Available</h3>
            <p>
              Make a prediction on the Prediction page to view the complete real-time ML processing here.
            </p>
            <Link to="/prediction" className="lml-btn-goto-pred">
              <span className="material-symbols-outlined">psychology</span>
              Go to Prediction Page
            </Link>
          </div>
        )}

        {/* Complete 10-Step ML Pipeline Display (Read-Only) */}
        {r && (
          <div className="lml-steps">

              {/* STEP 1: Applicant Input Data */}
              <StepCard num="1" title="Applicant Input Data"
                desc="Raw values submitted by the applicant.">
                <div className="lml-input-grid">
                  <div className="lml-input-chip"><span className="chip-lbl">Gender:</span> <strong>{r.applicant?.Gender || r.raw_values?.[0]}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Married:</span> <strong>{r.applicant?.Married || r.raw_values?.[1]}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Dependents:</span> <strong>{r.applicant?.Dependents || r.raw_values?.[2]}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Education:</span> <strong>{r.applicant?.Education || r.raw_values?.[3]}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Self Employed:</span> <strong>{r.applicant?.Self_Employed || r.raw_values?.[4]}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Property Area:</span> <strong>{r.applicant?.Property_Area || r.raw_values?.[5]}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Applicant Income:</span> <strong>₹{Number(r.applicant?.ApplicantIncome ?? r.raw_values?.[6]).toLocaleString('en-IN')}/mo</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Co-applicant Income:</span> <strong>₹{Number(r.applicant?.CoapplicantIncome ?? r.raw_values?.[7]).toLocaleString('en-IN')}/mo</strong></div>
                  <div className="lml-input-chip highlight-chip"><span className="chip-lbl">Loan Amount (Entered):</span> <strong>₹{Number(r.raw_loan_amount ?? (Number(r.raw_values?.[8]) >= 1000 ? r.raw_values[8] : Number(r.raw_values[8])*1000)).toLocaleString('en-IN')}</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Loan Term:</span> <strong>{r.applicant?.Loan_Amount_Term || r.raw_values?.[9]} months</strong></div>
                  <div className="lml-input-chip"><span className="chip-lbl">Credit History:</span> <strong>{Number(r.applicant?.Credit_History ?? r.raw_values?.[10]) === 1 ? '1 (Good)' : '0 (Poor)'}</strong></div>
                </div>
              </StepCard>

              {/* STEP 2: Input Normalization */}
              <StepCard num="2" title="Input Normalization (Model Units)"
                desc="Converting real-world rupee inputs to the exact units expected by the trained dataset.">
                <div className="norm-card">
                  <div className="norm-row">
                    <div className="norm-col">
                      <span className="norm-badge-lbl">User Entered Amount</span>
                      <div className="norm-val mono">₹{Number(r.raw_loan_amount ?? 500000).toLocaleString('en-IN')}</div>
                      <span className="norm-sub">Full rupee value</span>
                    </div>
                    <div className="norm-arrow-col">
                      <span className="material-symbols-outlined norm-arrow">arrow_forward</span>
                      <span className="norm-formula">divide by 1,000</span>
                    </div>
                    <div className="norm-col">
                      <span className="norm-badge-lbl">Model-Facing Unit</span>
                      <div className="norm-val mono norm-val--model">{(r.model_loan_amount ?? 500.0).toFixed(1)}</div>
                      <span className="norm-sub">Thousands of rupees (₹{Number(r.model_loan_amount ?? 500).toFixed(1)}k)</span>
                    </div>
                  </div>
                  <p className="norm-note">
                    <span className="material-symbols-outlined" style={{fontSize:'16px'}}>info</span>
                    The dataset represents <code>LoanAmount</code> in thousands of rupees (mean: 146.3, max: 397). Entering ₹5,00,000 is safely converted once by the backend to <strong>500.0 model units</strong> before entering the preprocessing pipeline.
                  </p>
                </div>
              </StepCard>

              {/* STEP 3: Feature Preparation / Encoding */}
              <StepCard num="3" title="Feature Preparation & Encoding"
                desc="Categorical variables encoded into numerical indices.">
                <div className="feat-table">
                  <div className="feat-row feat-row--head">
                    <span>Categorical Feature</span><span>Raw Input</span><span>Encoded Index</span>
                  </div>
                  {r.feature_names.slice(0, 6).map((name, i) => (
                    <div key={name} className="feat-row">
                      <span className="feat-name">{name.replace(/_/g,' ')}</span>
                      <span className="feat-raw">{r.raw_values[i]}</span>
                      <span className="feat-proc mono">{r.processed_values[i].toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </StepCard>

              {/* STEP 4: Preprocessing & StandardScaler */}
              <StepCard num="4" title="Numerical Preprocessing (StandardScaler)"
                desc="Numerical features scaled to zero mean and unit variance: z = (x - μ) / σ.">
                <div className="feat-table">
                  <div className="feat-row feat-row--head">
                    <span>Numerical Feature</span><span>Model Input (x)</span><span>Scaled Value (z)</span>
                  </div>
                  {r.feature_names.slice(6).map((name, i) => {
                    const idx = i + 6;
                    return (
                      <div key={name} className="feat-row">
                        <span className="feat-name">{name.replace(/_/g,' ')}</span>
                        <span className="feat-raw mono">{r.raw_values[idx]}</span>
                        <span className="feat-proc mono">{r.processed_values[idx].toFixed(4)}</span>
                      </div>
                    );
                  })}
                </div>
              </StepCard>

              {/* STEP 5: Logistic Regression Model */}
              <StepCard num="5" title="Logistic Regression Model Information"
                desc="Trained binary classification model configuration and parameters.">
                <div className="model-summary-grid">
                  <div className="summary-item">
                    <span className="summary-lbl">Model Architecture:</span>
                    <span className="summary-val">{r.model || 'Logistic Regression (scikit-learn)'}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-lbl">Solver & Regularization:</span>
                    <span className="summary-val">L-BFGS (C=1.0, L2 Penalty)</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-lbl">Decision Threshold:</span>
                    <span className="summary-val mono">{(r.threshold ?? 0.5).toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-lbl">Intercept (β₀):</span>
                    <span className="summary-val mono">{r.intercept >= 0 ? '+' : ''}{(r.intercept ?? 0).toFixed(6)}</span>
                  </div>
                </div>
              </StepCard>

              {/* STEP 6: Feature Coefficients */}
              <StepCard num="6" title="Learned Feature Coefficients (β)"
                desc="Weights learned by Logistic Regression during dataset training.">
                <div className="coef-table">
                  <div className="feat-row feat-row--head">
                    <span>Feature</span><span>Coefficient (β)</span>
                  </div>
                  {r.feature_names.map((name, i) => (
                    <div key={name} className="feat-row">
                      <span className="feat-name">{name.replace(/_/g,' ')}</span>
                      <span className={`coef-val mono ${r.coefficients[i] >= 0 ? 'coef-pos' : 'coef-neg'}`}>
                        {r.coefficients[i] >= 0 ? '+' : ''}{r.coefficients[i].toFixed(4)}
                      </span>
                    </div>
                  ))}
                  <div className="feat-row feat-row--intercept">
                    <span className="feat-name">Intercept (β₀)</span>
                    <span className={`coef-val mono ${r.intercept >= 0 ? 'coef-pos' : 'coef-neg'}`}>
                      {r.intercept >= 0 ? '+' : ''}{r.intercept.toFixed(4)}
                    </span>
                  </div>
                </div>
              </StepCard>

              {/* STEP 7: Feature Contributions */}
              <StepCard num="7" title="Weighted Feature Contributions (βᵢ × xᵢ)"
                desc="Each feature's transformed value multiplied by its trained coefficient.">
                <div className="contrib-table">
                  <div className="feat-row feat-row--head">
                    <span>Feature</span><span>Value × Coef</span><span>Contribution</span>
                  </div>
                  {r.feature_names.map((name, i) => (
                    <div key={name} className="feat-row">
                      <span className="feat-name">{name.replace(/_/g,' ')}</span>
                      <span className="contrib-calc mono">
                        {r.processed_values[i].toFixed(4)} × {r.coefficients[i] >= 0 ? '+' : ''}{r.coefficients[i].toFixed(4)}
                      </span>
                      <span className={`contrib-val mono ${r.contributions[i] >= 0 ? 'coef-pos' : 'coef-neg'}`}>
                        {r.contributions[i] >= 0 ? '+' : ''}{r.contributions[i].toFixed(4)}
                      </span>
                    </div>
                  ))}
                  <div className="feat-row feat-row--intercept">
                    <span className="feat-name">Intercept (β₀)</span>
                    <span className="contrib-calc mono">—</span>
                    <span className={`contrib-val mono ${r.intercept >= 0 ? 'coef-pos' : 'coef-neg'}`}>
                      {r.intercept >= 0 ? '+' : ''}{r.intercept.toFixed(4)}
                    </span>
                  </div>
                </div>
              </StepCard>

              {/* STEP 8: Linear Decision Score (z) */}
              <StepCard num="8" title="Linear Decision Score  z = β₀ + Σ(βᵢxᵢ)"
                desc="The raw log-odds score produced by the linear combination.">
                <div className="math-box">
                  <div className="math-row">
                    <span className="math-label">z</span>
                    <span className="math-eq">=</span>
                    <span className="math-val mono">{(r.linear_score_exact ?? r.linear_score).toFixed(6)}</span>
                  </div>
                  <p className="math-note">
                    Sum of all feature contributions ({r.contributions.reduce((a,b)=>a+b,0).toFixed(4)}) + intercept ({r.intercept.toFixed(4)}) = {(r.linear_score_exact ?? r.linear_score).toFixed(4)}
                  </p>
                </div>
              </StepCard>

              {/* STEP 9: Sigmoid & Probability */}
              <StepCard num="9" title="Sigmoid Activation  σ(z) = 1 / (1 + e⁻ᶻ)"
                desc="Converts the real-valued decision score into a calibrated probability.">
                <div className="math-box">
                  <div className="math-row">
                    <span className="math-label">σ({Number(r.linear_score).toFixed(4)})</span>
                    <span className="math-eq">=</span>
                    <span className="math-val mono">
                      1 / (1 + e<sup>−{Number(r.linear_score).toFixed(4)}</sup>)
                    </span>
                  </div>
                  <div className="math-row">
                    <span className="math-label">P(Approved | x)</span>
                    <span className="math-eq">=</span>
                    <span className="math-val mono sig-result">{(r.probability * 100).toFixed(2)}%</span>
                  </div>
                </div>
                <div className="gauge-section" style={{marginTop:'14px'}}>
                  <ProbGauge prob={r.probability} approved={r.approved} />
                  <div className="gauge-detail">
                    <div className="gauge-detail-row">
                      <span>Approval Probability:</span>
                      <span className="mono">{(r.probability * 100).toFixed(2)}%</span>
                    </div>
                    <div className="gauge-detail-row">
                      <span>Rejection Probability:</span>
                      <span className="mono">{((1 - r.probability) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </StepCard>

              {/* STEP 10: Threshold Decision & Final Verdict */}
              <StepCard num="10" title="Decision Threshold & Final Verdict"
                desc="Compares predicted probability against classification threshold θ = 0.50.">
                <div className="decision-box">
                  <div className="threshold-row">
                    <div className="th-item">
                      <div className="th-label">Probability</div>
                      <div className="th-val mono">{r.probability.toFixed(4)}</div>
                    </div>
                    <div className="th-op">{r.probability >= r.threshold ? '≥' : '<'}</div>
                    <div className="th-item">
                      <div className="th-label">Threshold</div>
                      <div className="th-val mono">{r.threshold.toFixed(2)}</div>
                    </div>
                    <div className="th-arrow">→</div>
                    <div className={`verdict ${r.approved ? 'verdict--approved' : 'verdict--rejected'}`}>
                      <span className="material-symbols-outlined verdict-icon">
                        {r.approved ? 'check_circle' : 'cancel'}
                      </span>
                      {r.prediction.toUpperCase()}
                    </div>
                  </div>
                  <p className="decision-rule">
                    Decision rule: <code>P(Approved) ≥ 0.50</code> → <strong>Approved</strong>, otherwise <strong>Rejected</strong>.
                  </p>
                </div>
              </StepCard>

            </div>
          )}
        </div>

      {/* Disclaimer */}
      <div className="lml-disclaimer-bar">
        <div className="lml-disclaimer-inner">
          <span className="material-symbols-outlined" style={{fontSize:'16px',flexShrink:0}}>info</span>
          This visualization is an academic demonstration of Logistic Regression and is not an actual banking decision system.
          Semester Mini Project 2026–2027.
        </div>
      </div>

      {/* ─── Styles ─────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Page ── */
        .lml-page { flex: 1; background: var(--bg); }

        /* ── Header band ── */
        .lml-page-head { background: var(--surface); border-bottom: 1px solid var(--border); }
        .lml-head-inner { max-width: var(--max-w); margin: 0 auto; padding: 40px 24px 28px; }
        .lml-head-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
        .lml-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px;
          background: var(--primary-light); border: 1px solid rgba(37,99,235,.22);
          border-radius: 999px; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.07em; color: var(--primary);
        }
        .lml-badge-icon { font-size: 15px; }
        .lml-sync-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;
          padding: 4px 10px; border-radius: 999px; font-size: 0.73rem; font-weight: 600;
        }
        .lml-title {
          font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 800;
          color: var(--text); letter-spacing: -0.02em; margin-bottom: 8px;
        }
        .lml-subtitle { font-size: 0.95rem; color: var(--text-muted); }

        /* ── Main content area (Read-Only 10-Step ML Pipeline) ── */
        .lml-main {
          max-width: 900px; margin: 0 auto;
          padding: 32px 24px 56px;
        }

        /* ── Empty state ── */
        .lml-idle {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm);
          padding: 56px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .lml-idle-icon {
          font-size: 48px; color: var(--text-light);
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48;
        }
        .lml-idle h3 { font-size: 1.1rem; font-weight: 700; color: var(--text); }
        .lml-idle p  { font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; max-width: 440px; margin: 0; }
        .lml-btn-goto-pred {
          display: inline-flex; align-items: center; gap: 7px;
          margin-top: 14px; padding: 10px 20px;
          background: var(--primary); color: #fff; text-decoration: none;
          border-radius: var(--radius); font-size: 0.86rem; font-weight: 600;
          box-shadow: var(--shadow-sm); transition: background .15s, transform .1s;
        }
        .lml-btn-goto-pred:hover { background: var(--primary-dark); transform: translateY(-1px); }

        /* ── Step cards list ── */
        .lml-steps { display: flex; flex-direction: column; gap: 16px; }

        .step-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; box-shadow: var(--shadow-sm); overflow: hidden;
        }
        .step-card-head {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-alt);
        }
        .step-num {
          min-width: 26px; height: 26px; border-radius: 50%;
          background: var(--primary); color: #fff;
          font-size: 0.75rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .step-title { font-size: 0.92rem; font-weight: 700; color: var(--text); font-family: 'Courier New', monospace; }
        .step-desc  { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; font-family: 'Inter', sans-serif; }
        .step-body  { padding: 16px 18px; }

        /* Step 1: Input chip grid */
        .lml-input-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px; font-size: 0.82rem;
        }
        .lml-input-chip {
          background: var(--surface-alt); border: 1px solid var(--border);
          border-radius: 8px; padding: 9px 12px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .lml-input-chip.highlight-chip {
          background: var(--primary-light); border-color: rgba(37,99,235,0.25);
        }
        .chip-lbl { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; }

        /* Step 2: Normalization visual card */
        .norm-card {
          background: var(--surface-alt); border: 1px solid var(--border);
          border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px;
        }
        .norm-row {
          display: flex; align-items: center; justify-content: space-around; gap: 16px; flex-wrap: wrap;
        }
        .norm-col {
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px;
        }
        .norm-badge-lbl {
          font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
        }
        .norm-val {
          font-size: 1.25rem; font-weight: 800; color: var(--text);
        }
        .norm-val--model {
          color: var(--primary); font-size: 1.35rem;
        }
        .norm-sub { font-size: 0.74rem; color: var(--text-muted); }
        .norm-arrow-col {
          display: flex; flex-direction: column; align-items: center; gap: 2px;
        }
        .norm-arrow { font-size: 26px; color: var(--primary); }
        .norm-formula {
          font-size: 0.7rem; font-weight: 600; color: var(--text-muted); background: var(--surface);
          padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border);
        }
        .norm-note {
          font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;
          display: flex; align-items: flex-start; gap: 8px;
          border-top: 1px solid var(--border); padding-top: 12px; margin: 0;
        }
        .norm-note code {
          background: var(--surface); padding: 1px 5px; border-radius: 3px; font-size: 0.76rem;
        }

        /* Step 3 & 4: Feature / coefficient tables */
        .feat-table, .coef-table, .contrib-table { display: flex; flex-direction: column; gap: 0; }
        .feat-row {
          display: grid; gap: 8px; padding: 7px 4px;
          border-bottom: 1px solid var(--border); font-size: 0.82rem; align-items: center;
        }
        .feat-table .feat-row     { grid-template-columns: 2fr 1.2fr 1.2fr; }
        .coef-table .feat-row     { grid-template-columns: 2.2fr 1fr; }
        .contrib-table .feat-row  { grid-template-columns: 1.6fr 1.6fr 1fr; }

        .feat-row:last-child { border-bottom: none; }
        .feat-row--head {
          font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em;
          background: var(--surface-alt); padding: 6px 6px; border-radius: 4px;
          margin-bottom: 2px;
        }
        .feat-row--intercept { background: var(--primary-light); border-radius: 4px; padding: 6px 6px; }
        .feat-name { color: var(--text); font-weight: 500; }
        .feat-raw  { color: var(--text-muted); }
        .feat-proc { color: var(--primary); }
        .mono { font-family: 'Courier New', monospace; }
        .coef-pos { color: #16a34a; font-weight: 600; }
        .coef-neg { color: #dc2626; font-weight: 600; }
        .coef-val   { text-align: right; }
        .contrib-calc { color: var(--text-muted); font-size: 0.77rem; }
        .contrib-val  { text-align: right; font-weight: 600; }

        /* Step 5: Model summary grid */
        .model-summary-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px; font-size: 0.82rem;
        }
        .summary-item {
          background: var(--surface-alt); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; gap: 3px;
        }
        .summary-lbl { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .summary-val { font-size: 0.88rem; font-weight: 700; color: var(--text); }

        /* Step 8 & 9: Math boxes */
        .math-box {
          background: var(--surface-alt); border-radius: 8px;
          padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;
        }
        .math-row {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .math-label { font-size: 0.9rem; font-weight: 600; color: var(--text); font-family: 'Courier New', monospace; }
        .math-eq { font-size: 1.05rem; color: var(--text-muted); font-weight: 300; }
        .math-val { font-size: 1.05rem; font-weight: 700; color: var(--primary); font-family: 'Courier New', monospace; }
        .sig-result { font-size: 1.2rem; color: var(--text); font-weight: 800; }
        .math-note { font-size: 0.78rem; color: var(--text-muted); }

        /* ── Gauge section ── */
        .gauge-section { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
        .gauge-wrap { position: relative; display: flex; align-items: center; gap: 14px; }
        .gauge-svg { width: 90px; height: 90px; transform: rotate(-90deg); flex-shrink: 0; }
        .gauge-label { display: flex; flex-direction: column; align-items: center; }
        .gauge-pct { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; }
        .gauge-sub { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; margin-top: 2px; }
        .gauge-detail { display: flex; flex-direction: column; gap: 8px; }
        .gauge-detail-row { display: flex; gap: 14px; align-items: center; font-size: 0.85rem; color: var(--text-muted); }
        .gauge-detail-row .mono { font-weight: 700; color: var(--text); }

        /* ── Decision box (Step 10) ── */
        .decision-box { display: flex; flex-direction: column; gap: 14px; }
        .threshold-row {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .th-item { text-align: center; }
        .th-label { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
        .th-val { font-size: 1.15rem; font-weight: 700; color: var(--text); font-family: 'Courier New', monospace; }
        .th-op { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
        .th-arrow { font-size: 1.2rem; color: var(--text-muted); font-weight: 300; }
        .verdict {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px; border-radius: 999px;
          font-size: 0.95rem; font-weight: 800; letter-spacing: .06em;
        }
        .verdict--approved { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
        .verdict--rejected { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }
        .verdict-icon { font-size: 20px; font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24; }
        .decision-rule { font-size: 0.8rem; color: var(--text-muted); }
        .decision-rule code { background: var(--primary-light); color: var(--primary); padding: 1px 6px; border-radius: 4px; font-size: 0.78rem; }

        /* ── Disclaimer ── */
        .lml-disclaimer-bar { background: var(--surface-alt); border-top: 1px solid var(--border); }
        .lml-disclaimer-inner {
          max-width: var(--max-w); margin: 0 auto; padding: 14px 24px;
          font-size: 0.78rem; color: var(--text-muted);
          display: flex; align-items: center; gap: 7px;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .lml-main { padding: 20px 16px 40px; }
          .lml-head-inner { padding: 28px 16px 20px; }
          .threshold-row { flex-wrap: wrap; gap: 10px; justify-content: center; }
          .contrib-table .feat-row { grid-template-columns: 1fr 1fr; }
          .contrib-table .feat-row .contrib-calc { grid-column: 1 / -1; font-size: 0.72rem; }
          .feat-table .feat-row { grid-template-columns: 1.2fr 1fr 1fr; }
        }
      `}</style>
    </main>
  );
}
