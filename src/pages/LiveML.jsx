import { useState, useEffect, useRef } from 'react';

/* ─── Constants (mirror Prediction.jsx exactly) ─────────────────────────── */
const DEPENDENTS_OPTIONS = ['0', '1', '2', '3+'];
const PROPERTY_OPTIONS   = ['Urban', 'Semiurban', 'Rural'];
const CREDIT_OPTIONS     = [
  { label: '1 — Good credit history',      value: '1' },
  { label: '0 — Poor / no credit history', value: '0' },
];
const LOAN_TERM_OPTIONS  = [
  { label: '12 months',  value: '12'  }, { label: '36 months',  value: '36'  },
  { label: '60 months',  value: '60'  }, { label: '84 months',  value: '84'  },
  { label: '120 months', value: '120' }, { label: '180 months', value: '180' },
  { label: '240 months', value: '240' }, { label: '300 months', value: '300' },
  { label: '360 months', value: '360' }, { label: '480 months', value: '480' },
];
const INITIAL_FORM = {
  Gender: '', Married: '', Dependents: '', Education: '', Self_Employed: '',
  ApplicantIncome: '', CoapplicantIncome: '', LoanAmount: '',
  Loan_Amount_Term: '', Credit_History: '', Property_Area: '',
};
const ANALYZE_URL = 'http://localhost:5000/analyze';

/* ─── Validation (same rules as Prediction page) ────────────────────────── */
function validate(form) {
  const e = {};
  ['Gender','Married','Dependents','Education','Self_Employed','Credit_History','Property_Area','Loan_Amount_Term']
    .forEach(f => { if (!form[f]) e[f] = 'Required.'; });
  if (!form.ApplicantIncome || isNaN(+form.ApplicantIncome) || +form.ApplicantIncome <= 0)
    e.ApplicantIncome = 'Enter a valid positive number.';
  if (form.CoapplicantIncome === '' || isNaN(+form.CoapplicantIncome) || +form.CoapplicantIncome < 0)
    e.CoapplicantIncome = 'Enter a valid number (≥ 0).';
  if (!form.LoanAmount || isNaN(+form.LoanAmount) || +form.LoanAmount <= 0)
    e.LoanAmount = 'Enter a valid positive number.';
  return e;
}

/* ─── Tiny field helpers ─────────────────────────────────────────────────── */
function Sel({ id, label, value, onChange, options, error }) {
  return (
    <div className="lml-field">
      <label htmlFor={id} className="lml-label">{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`lml-input${error ? ' lml-input--err' : ''}`}>
        <option value="">Select…</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="lml-field-err">{error}</p>}
    </div>
  );
}
function Num({ id, label, value, onChange, error, placeholder }) {
  return (
    <div className="lml-field">
      <label htmlFor={id} className="lml-label">{label}</label>
      <input id={id} type="number" min="0" value={value} placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        className={`lml-input${error ? ' lml-input--err' : ''}`} />
      {error && <p className="lml-field-err">{error}</p>}
    </div>
  );
}

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
function StepCard({ num, title, desc, visible, children }) {
  return (
    <div className={`step-card${visible ? ' step-card--visible' : ''}`}>
      <div className="step-card-head">
        <span className="step-num">{num}</span>
        <div>
          <div className="step-title">{title}</div>
          {desc && <div className="step-desc">{desc}</div>}
        </div>
      </div>
      {visible && <div className="step-body">{children}</div>}
    </div>
  );
}

/* ─── Main LiveML page ──────────────────────────────────────────────────── */
export default function LiveML() {
  const [form,     setForm]    = useState(INITIAL_FORM);
  const [errors,   setErrors]  = useState({});
  const [status,   setStatus]  = useState('idle');  // idle|loading|done|error
  const [result,   setResult]  = useState(null);
  const [apiErr,   setApiErr]  = useState('');
  const [visStep,  setVisStep] = useState(0);  // which steps are visible (0 = none)
  const timerRef = useRef([]);

  const setField = (k) => (v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  /* Clear timers on unmount */
  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  const handleReset = () => {
    timerRef.current.forEach(clearTimeout);
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
    setStatus('idle');
    setApiErr('');
    setVisStep(0);
  };

  const handleRun = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus('loading');
    setResult(null);
    setVisStep(0);
    setApiErr('');
    timerRef.current.forEach(clearTimeout);

    try {
      const payload = {
        Gender: form.Gender, Married: form.Married, Dependents: form.Dependents,
        Education: form.Education, Self_Employed: form.Self_Employed,
        ApplicantIncome: +form.ApplicantIncome,
        CoapplicantIncome: +(form.CoapplicantIncome) || 0,
        LoanAmount: +form.LoanAmount, Loan_Amount_Term: +form.Loan_Amount_Term,
        Credit_History: +form.Credit_History, Property_Area: form.Property_Area,
      };
      const res = await fetch(ANALYZE_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.details?.join(' ') || body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setStatus('done');

      // Stagger step reveal: steps 1–7 appear 350ms apart
      for (let s = 1; s <= 7; s++) {
        const t = setTimeout(() => setVisStep(s), s * 350);
        timerRef.current.push(t);
      }
    } catch (err) {
      const msg = err.message?.toLowerCase().includes('fetch')
        ? 'Unable to connect to the ML service. Please make sure the backend is running (python backend/app.py).'
        : `Model analysis failed: ${err.message}`;
      setApiErr(msg);
      setStatus('error');
    }
  };

  const r = result;
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));

  return (
    <main className="lml-page">

      {/* ── Page header ── */}
      <div className="lml-page-head">
        <div className="lml-head-inner">
          <div className="lml-badge" role="note">
            <span className="material-symbols-outlined lml-badge-icon">play_circle</span>
            LIVE MODEL VISUALIZATION
          </div>
          <h1 className="lml-title">Live Logistic Regression</h1>
          <p className="lml-subtitle">
            See how applicant data moves through Logistic Regression in real time.
          </p>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="lml-main">

        {/* LEFT: Input form */}
        <section className="lml-form-card" aria-label="Applicant data input">
          <div className="lml-card-head">
            <span className="material-symbols-outlined lml-card-icon">input</span>
            <h2 className="lml-card-title">Applicant Data</h2>
          </div>
          <p className="lml-card-note">Enter applicant details, then click <strong>Run Live Analysis</strong>.</p>

          <form onSubmit={handleRun} noValidate>
            <div className="lml-grid-2">
              <Sel id="lml-Gender"    label="Gender"        value={form.Gender}        onChange={setField('Gender')}        options={['Male','Female']}        error={errors.Gender} />
              <Sel id="lml-Married"   label="Married"       value={form.Married}       onChange={setField('Married')}       options={['Yes','No']}             error={errors.Married} />
              <Sel id="lml-Deps"      label="Dependents"    value={form.Dependents}    onChange={setField('Dependents')}    options={DEPENDENTS_OPTIONS}       error={errors.Dependents} />
              <Sel id="lml-Edu"       label="Education"     value={form.Education}     onChange={setField('Education')}     options={['Graduate','Not Graduate']} error={errors.Education} />
              <Sel id="lml-SelfEmp"   label="Self Employed" value={form.Self_Employed} onChange={setField('Self_Employed')} options={['Yes','No']}             error={errors.Self_Employed} />
              <Sel id="lml-Area"      label="Property Area" value={form.Property_Area} onChange={setField('Property_Area')} options={PROPERTY_OPTIONS}         error={errors.Property_Area} />
              <Num id="lml-AppInc"    label="Applicant Income (₹/mo)" value={form.ApplicantIncome}   onChange={setField('ApplicantIncome')}   error={errors.ApplicantIncome}   placeholder="e.g. 5000" />
              <Num id="lml-CoInc"     label="Co-applicant Income (₹/mo)" value={form.CoapplicantIncome} onChange={setField('CoapplicantIncome')} error={errors.CoapplicantIncome} placeholder="0 if none" />
              <Num id="lml-Loan"      label="Loan Amount (₹ thousands)" value={form.LoanAmount}        onChange={setField('LoanAmount')}        error={errors.LoanAmount}        placeholder="e.g. 128" />
              <Sel id="lml-Term"      label="Loan Term"     value={form.Loan_Amount_Term} onChange={setField('Loan_Amount_Term')} options={LOAN_TERM_OPTIONS}     error={errors.Loan_Amount_Term} />
              <Sel id="lml-Credit"    label="Credit History" value={form.Credit_History} onChange={setField('Credit_History')} options={CREDIT_OPTIONS}         error={errors.Credit_History} />
            </div>

            <div className="lml-actions">
              <button id="btn-run-analysis" type="submit" className="lml-btn-primary"
                disabled={status === 'loading'} aria-busy={status === 'loading'}>
                {status === 'loading' ? (
                  <><span className="material-symbols-outlined lml-spin">progress_activity</span>Analyzing Model…</>
                ) : (
                  <><span className="material-symbols-outlined">play_arrow</span>Run Live Analysis</>
                )}
              </button>
              <button id="btn-reset-lml" type="button" className="lml-btn-reset" onClick={handleReset}>
                <span className="material-symbols-outlined">refresh</span>Reset
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT: Visualization panel */}
        <div className="lml-vis-panel" aria-live="polite" aria-label="Logistic Regression visualization">

          {/* Idle */}
          {status === 'idle' && (
            <div className="lml-idle">
              <span className="material-symbols-outlined lml-idle-icon">model_training</span>
              <h3>Ready to Visualize Logistic Regression</h3>
              <p>Enter applicant data and click <strong>Run Live Analysis</strong> to see how the model transforms the inputs into a prediction.</p>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="lml-idle">
              <span className="material-symbols-outlined lml-idle-icon lml-spin">progress_activity</span>
              <h3>Running Logistic Regression…</h3>
              <p>The model is processing your applicant data.</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="lml-error" role="alert">
              <span className="material-symbols-outlined">error</span>
              <h3>Analysis Failed</h3>
              <p>{apiErr}</p>
              <button className="lml-btn-retry" onClick={handleReset}>
                <span className="material-symbols-outlined">refresh</span>Try Again
              </button>
            </div>
          )}

          {/* Results — step-by-step */}
          {status === 'done' && r && (
            <div className="lml-steps">

              {/* STEP 1: Features */}
              <StepCard num="1" title="Feature Preprocessing"
                desc="Raw applicant values encoded into numerical model inputs."
                visible={visStep >= 1}>
                <div className="feat-table">
                  <div className="feat-row feat-row--head">
                    <span>Feature</span><span>Raw Value</span><span>Processed</span>
                  </div>
                  {r.feature_names.map((name, i) => (
                    <div key={name} className="feat-row">
                      <span className="feat-name">{name.replace(/_/g,' ')}</span>
                      <span className="feat-raw">{r.raw_values[i]}</span>
                      <span className="feat-proc mono">{r.processed_values[i].toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </StepCard>

              {/* STEP 2: Coefficients */}
              <StepCard num="2" title="Model Coefficients"
                desc="Weights learned by Logistic Regression during training."
                visible={visStep >= 2}>
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

              {/* STEP 3: Weighted contributions */}
              <StepCard num="3" title="Weighted Contributions"
                desc="Each feature's processed value multiplied by its coefficient."
                visible={visStep >= 3}>
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
                    <span className="feat-name">Intercept</span>
                    <span className="contrib-calc mono">—</span>
                    <span className={`contrib-val mono ${r.intercept >= 0 ? 'coef-pos' : 'coef-neg'}`}>
                      {r.intercept >= 0 ? '+' : ''}{r.intercept.toFixed(4)}
                    </span>
                  </div>
                </div>
              </StepCard>

              {/* STEP 4: Linear Score */}
              <StepCard num="4" title="Linear Score  z = Σ (βᵢxᵢ) + β₀"
                desc="Weighted sum of all contributions plus the intercept."
                visible={visStep >= 4}>
                <div className="math-box">
                  <div className="math-row">
                    <span className="math-label">z</span>
                    <span className="math-eq">=</span>
                    <span className="math-val mono">{r.linear_score.toFixed(6)}</span>
                  </div>
                  <p className="math-note">
                    Sum of {r.contributions.length} contributions ({r.contributions.reduce((a,b)=>a+b,0).toFixed(4)}) + intercept ({r.intercept.toFixed(4)})
                  </p>
                </div>
              </StepCard>

              {/* STEP 5: Sigmoid */}
              <StepCard num="5" title="Sigmoid Function  σ(z) = 1 / (1 + e⁻ᶻ)"
                desc="Converts the linear score into a probability between 0 and 1."
                visible={visStep >= 5}>
                <div className="math-box">
                  <div className="math-row">
                    <span className="math-label">σ({r.linear_score.toFixed(4)})</span>
                    <span className="math-eq">=</span>
                    <span className="math-val mono">
                      1 / (1 + e<sup>−{r.linear_score.toFixed(4)}</sup>)
                    </span>
                  </div>
                  <div className="math-row">
                    <span className="math-label">P(y=1|x)</span>
                    <span className="math-eq">=</span>
                    <span className="math-val mono sig-result">{r.probability.toFixed(6)}</span>
                  </div>
                </div>
              </StepCard>

              {/* STEP 6: Probability gauge */}
              <StepCard num="6" title="Approval Probability"
                desc="The model's estimated probability of loan approval."
                visible={visStep >= 6}>
                <div className="gauge-section">
                  <ProbGauge prob={r.probability} approved={r.approved} />
                  <div className="gauge-detail">
                    <div className="gauge-detail-row">
                      <span>P(Approved)</span>
                      <span className="mono">{(r.probability * 100).toFixed(2)}%</span>
                    </div>
                    <div className="gauge-detail-row">
                      <span>P(Rejected)</span>
                      <span className="mono">{((1 - r.probability) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              </StepCard>

              {/* STEP 7: Threshold + Final Decision */}
              <StepCard num="7" title="Decision Threshold"
                desc="Probability is compared against the configured threshold."
                visible={visStep >= 7}>
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
                    Decision rule: <code>P(y=1|x) ≥ θ</code> → Approved, otherwise Rejected
                  </p>
                </div>
              </StepCard>

            </div>
          )}
        </div>
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
        .lml-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px;
          background: var(--primary-light); border: 1px solid rgba(37,99,235,.22);
          border-radius: 999px; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.07em; color: var(--primary); margin-bottom: 14px;
        }
        .lml-badge-icon { font-size: 15px; }
        .lml-title {
          font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 800;
          color: var(--text); letter-spacing: -0.02em; margin-bottom: 8px;
        }
        .lml-subtitle { font-size: 0.95rem; color: var(--text-muted); }

        /* ── Main grid ── */
        .lml-main {
          max-width: var(--max-w); margin: 0 auto;
          padding: 28px 24px 48px;
          display: grid; grid-template-columns: 380px 1fr;
          gap: 24px; align-items: start;
        }

        /* ── Form card ── */
        .lml-form-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 22px;
          position: sticky; top: calc(var(--header-h) + 16px);
        }
        .lml-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .lml-card-icon {
          font-size: 20px; color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .lml-card-title { font-size: 0.95rem; font-weight: 700; color: var(--text); }
        .lml-card-note { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 16px; }

        .lml-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; }

        /* Field helpers */
        .lml-field { display: flex; flex-direction: column; gap: 3px; }
        .lml-label { font-size: 0.78rem; font-weight: 600; color: var(--text); }
        .lml-input {
          padding: 7px 10px; border: 1.5px solid var(--border);
          border-radius: var(--radius); font-family: 'Inter', sans-serif;
          font-size: 0.82rem; color: var(--text); background: var(--surface);
          outline: none; transition: border-color .15s, box-shadow .15s; appearance: auto;
        }
        .lml-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
        .lml-input--err  { border-color: #dc2626; }
        .lml-field-err   { font-size: 0.7rem; color: #dc2626; }

        /* Actions */
        .lml-actions { display: flex; gap: 10px; margin-top: 14px; }
        .lml-btn-primary {
          flex: 1; display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 16px;
          background: var(--primary); color: #fff;
          font-family: 'Inter', sans-serif; font-size: 0.88rem; font-weight: 600;
          border: none; border-radius: var(--radius); cursor: pointer;
          box-shadow: var(--shadow-md); transition: background .15s, transform .1s, opacity .15s;
        }
        .lml-btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
        .lml-btn-primary:active:not(:disabled) { transform: translateY(1px); }
        .lml-btn-primary:disabled { opacity: .65; cursor: not-allowed; }
        .lml-btn-reset {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 14px; background: var(--surface); color: var(--text-muted);
          font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 500;
          border: 1.5px solid var(--border); border-radius: var(--radius);
          cursor: pointer; transition: background .12s;
        }
        .lml-btn-reset:hover { background: var(--surface-alt); color: var(--text); }

        @keyframes lml-spin { to { transform: rotate(360deg); } }
        .lml-spin { display: inline-block; animation: lml-spin 1s linear infinite; }

        /* ── Visualization panel ── */
        .lml-vis-panel { min-height: 400px; }

        .lml-idle {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm);
          padding: 56px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .lml-idle-icon {
          font-size: 44px; color: var(--text-light);
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 44;
        }
        .lml-idle h3 { font-size: 1rem; font-weight: 700; color: var(--text); }
        .lml-idle p  { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; max-width: 360px; }

        .lml-error {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px;
          padding: 40px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .lml-error .material-symbols-outlined { font-size: 36px; color: #dc2626; }
        .lml-error h3 { font-size: 1rem; font-weight: 700; color: #991b1b; }
        .lml-error p  { font-size: 0.83rem; color: #7f1d1d; line-height: 1.55; max-width: 380px; }
        .lml-btn-retry {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 6px; padding: 8px 16px; background: #dc2626; color: #fff;
          border: none; border-radius: var(--radius);
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: background .15s;
        }
        .lml-btn-retry:hover { background: #b91c1c; }

        /* ── Step cards ── */
        .lml-steps { display: flex; flex-direction: column; gap: 12px; }

        .step-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; box-shadow: var(--shadow-sm); overflow: hidden;
          opacity: 0; transform: translateY(8px);
          transition: opacity .35s ease, transform .35s ease;
        }
        .step-card--visible { opacity: 1; transform: translateY(0); }

        .step-card-head {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px;
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
        .step-title { font-size: 0.88rem; font-weight: 700; color: var(--text); font-family: 'Courier New', monospace; }
        .step-desc  { font-size: 0.76rem; color: var(--text-muted); margin-top: 2px; font-family: 'Inter', sans-serif; }
        .step-body  { padding: 14px 16px; }

        /* ── Feature / coefficient table ── */
        .feat-table, .coef-table, .contrib-table { display: flex; flex-direction: column; gap: 0; }
        .feat-row {
          display: grid; gap: 8px; padding: 5px 0;
          border-bottom: 1px solid var(--border); font-size: 0.8rem; align-items: center;
        }
        .feat-table .feat-row     { grid-template-columns: 1.8fr 1fr 1fr; }
        .coef-table .feat-row     { grid-template-columns: 2fr 1fr; }
        .contrib-table .feat-row  { grid-template-columns: 1.4fr 1.6fr 0.9fr; }

        .feat-row:last-child { border-bottom: none; }
        .feat-row--head {
          font-size: 0.7rem; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.05em;
          background: var(--surface-alt); padding: 5px 4px; border-radius: 4px;
          margin-bottom: 2px;
        }
        .feat-row--intercept { background: var(--primary-light); border-radius: 4px; padding: 5px 4px; }
        .feat-name { color: var(--text); font-weight: 500; }
        .feat-raw  { color: var(--text-muted); }
        .feat-proc { color: var(--primary); }
        .mono { font-family: 'Courier New', monospace; }
        .coef-pos { color: #16a34a; font-weight: 600; }
        .coef-neg { color: #dc2626; font-weight: 600; }
        .coef-val   { text-align: right; }
        .contrib-calc { color: var(--text-muted); font-size: 0.75rem; }
        .contrib-val  { text-align: right; font-weight: 600; }

        /* ── Math box ── */
        .math-box {
          background: var(--surface-alt); border-radius: 8px;
          padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;
        }
        .math-row {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .math-label { font-size: 0.85rem; font-weight: 600; color: var(--text); font-family: 'Courier New', monospace; }
        .math-eq { font-size: 1rem; color: var(--text-muted); font-weight: 300; }
        .math-val { font-size: 1rem; font-weight: 700; color: var(--primary); font-family: 'Courier New', monospace; }
        .sig-result { font-size: 1.1rem; color: var(--text); }
        .math-note { font-size: 0.76rem; color: var(--text-muted); }

        /* ── Gauge section ── */
        .gauge-section { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .gauge-wrap { position: relative; display: flex; align-items: center; gap: 14px; }
        .gauge-svg { width: 90px; height: 90px; transform: rotate(-90deg); flex-shrink: 0; }
        .gauge-label { display: flex; flex-direction: column; align-items: center; }
        .gauge-pct { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; }
        .gauge-sub { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; margin-top: 2px; }
        .gauge-detail { display: flex; flex-direction: column; gap: 8px; }
        .gauge-detail-row { display: flex; gap: 12px; align-items: center; font-size: 0.82rem; color: var(--text-muted); }
        .gauge-detail-row .mono { font-weight: 600; color: var(--text); }

        /* ── Decision box ── */
        .decision-box { display: flex; flex-direction: column; gap: 14px; }
        .threshold-row {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }
        .th-item { text-align: center; }
        .th-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
        .th-val { font-size: 1.1rem; font-weight: 700; color: var(--text); font-family: 'Courier New', monospace; }
        .th-op { font-size: 1.4rem; font-weight: 700; color: var(--primary); }
        .th-arrow { font-size: 1.1rem; color: var(--text-muted); font-weight: 300; }
        .verdict {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 18px; border-radius: 999px;
          font-size: 0.9rem; font-weight: 800; letter-spacing: .06em;
        }
        .verdict--approved { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
        .verdict--rejected { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }
        .verdict-icon { font-size: 18px; font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24; }
        .decision-rule { font-size: 0.76rem; color: var(--text-muted); }
        .decision-rule code { background: var(--primary-light); color: var(--primary); padding: 1px 5px; border-radius: 4px; font-size: 0.75rem; }

        /* ── Disclaimer ── */
        .lml-disclaimer-bar { background: var(--surface-alt); border-top: 1px solid var(--border); }
        .lml-disclaimer-inner {
          max-width: var(--max-w); margin: 0 auto; padding: 14px 24px;
          font-size: 0.78rem; color: var(--text-muted);
          display: flex; align-items: center; gap: 7px;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .lml-main { grid-template-columns: 1fr; padding: 20px 24px 40px; }
          .lml-form-card { position: static; }
        }
        @media (max-width: 640px) {
          .lml-grid-2 { grid-template-columns: 1fr; }
          .lml-actions { flex-direction: column; }
          .lml-btn-primary, .lml-btn-reset { width: 100%; }
          .lml-head-inner { padding: 28px 16px 20px; }
          .lml-main { padding: 16px 16px 36px; }
          .threshold-row { flex-wrap: wrap; gap: 8px; justify-content: center; }
          .contrib-table .feat-row { grid-template-columns: 1fr 1fr; }
          .contrib-table .feat-row .contrib-calc { grid-column: 1 / -1; font-size: 0.7rem; }
          .feat-table .feat-row { grid-template-columns: 1.2fr 1fr 1fr; }
          .math-val { font-size: 0.9rem; }
        }
      `}</style>
    </main>
  );
}
