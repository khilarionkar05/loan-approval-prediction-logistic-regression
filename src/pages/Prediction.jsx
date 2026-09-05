import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

/* ─── Field definitions — must match backend ALLOWED_VALUES exactly ───────── */
const DEPENDENTS_OPTIONS  = ['0', '1', '2', '3+'];
const PROPERTY_OPTIONS    = ['Urban', 'Semiurban', 'Rural'];
const CREDIT_OPTIONS      = [
  { label: '1 — Good credit history',      value: '1' },
  { label: '0 — Poor / no credit history', value: '0' },
];
const LOAN_TERM_OPTIONS   = [
  { label: '12 months',  value: '12'  },
  { label: '36 months',  value: '36'  },
  { label: '60 months',  value: '60'  },
  { label: '84 months',  value: '84'  },
  { label: '120 months', value: '120' },
  { label: '180 months', value: '180' },
  { label: '240 months', value: '240' },
  { label: '300 months', value: '300' },
  { label: '360 months', value: '360' },
  { label: '480 months', value: '480' },
];

const INITIAL_FORM = {
  Gender:            '',
  Married:           '',
  Dependents:        '',
  Education:         '',
  Self_Employed:     '',
  ApplicantIncome:   '',
  CoapplicantIncome: '',
  LoanAmount:        '',
  Loan_Amount_Term:  '',
  Credit_History:    '',
  Property_Area:     '',
};

const API_URL = API_ENDPOINTS.predict;

/* ─── Small helper: select field ─────────────────────────────────────────── */
function SelectField({ id, label, value, onChange, options, error, hint }) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="field-label">{label}</label>
      <select
        id={id} name={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`field-input${error ? ' field-input--error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      >
        <option value="">Select…</option>
        {options.map(opt =>
          typeof opt === 'string'
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
      {hint  && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-err`}  className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/* ─── Indian Rupee formatting helper ─────────────────────────────────────── */
function formatINR(val) {
  const n = parseFloat(val);
  if (isNaN(n) || n <= 0) return null;
  return '₹' + n.toLocaleString('en-IN');
}

/* ─── Small helper: number input ─────────────────────────────────────────── */
function NumberField({ id, label, value, onChange, error, hint, placeholder, showINR }) {
  const inrFormatted = showINR ? formatINR(value) : null;
  return (
    <div className="form-field">
      <div className="field-label-row">
        <label htmlFor={id} className="field-label">{label}</label>
        {inrFormatted && <span className="field-inr-tag">{inrFormatted}</span>}
      </div>
      <input
        id={id} name={id} type="number" min="0"
        value={value} placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        className={`field-input${error ? ' field-input--error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
      />
      {hint  && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {error && <p id={`${id}-err`}  className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/* ─── Probability ring (reused visual pattern from Home) ─────────────────── */
function ProbabilityRing({ probability, approved }) {
  const r    = 44;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(1, probability));
  const dash = pct * circ;
  const gap  = circ - dash;
  const color = approved ? '#16a34a' : '#dc2626';

  return (
    <div className="result-ring-wrap">
      <svg viewBox="0 0 100 100" className="result-ring-svg" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="ring-track" />
        <circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div className="result-ring-label">
        <span className="result-prob-value" style={{ color }}>
          {(pct * 100).toFixed(1)}%
        </span>
        <span className="result-prob-sub">Approval Probability</span>
      </div>
    </div>
  );
}

/* ─── Validate form, return errors object ─────────────────────────────────── */
function validate(form) {
  const e = {};
  const selectFields = ['Gender','Married','Dependents','Education','Self_Employed','Credit_History','Property_Area','Loan_Amount_Term'];
  selectFields.forEach(f => {
    if (!form[f]) e[f] = 'This field is required.';
  });
  const posFields = [
    { key: 'ApplicantIncome',   label: 'Applicant Income',     min: 1 },
    { key: 'LoanAmount',        label: 'Loan Amount',          min: 1 },
  ];
  posFields.forEach(({ key, label, min }) => {
    const v = parseFloat(form[key]);
    if (!form[key] || isNaN(v) || v < min)
      e[key] = `Please enter a valid ${label} (> 0).`;
  });
  const coapp = parseFloat(form.CoapplicantIncome);
  if (form.CoapplicantIncome === '' || isNaN(coapp) || coapp < 0)
    e.CoapplicantIncome = 'Please enter a valid Co-applicant Income (≥ 0).';
  return e;
}

/* ─── Main Prediction page ────────────────────────────────────────────────── */
export default function Prediction() {
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [errors,  setErrors]  = useState({});
  const [status,  setStatus]  = useState('idle');   // idle | loading | success | error
  const [result,  setResult]  = useState(null);
  const [apiError,setApiError]= useState('');

  const setField = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => { const next = { ...e }; delete next[key]; return next; });
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
    setStatus('idle');
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStatus('loading');
    setApiError('');
    setResult(null);

    try {
      const payload = {
        Gender:            form.Gender,
        Married:           form.Married,
        Dependents:        form.Dependents,
        Education:         form.Education,
        Self_Employed:     form.Self_Employed,
        ApplicantIncome:   parseFloat(form.ApplicantIncome),
        CoapplicantIncome: parseFloat(form.CoapplicantIncome) || 0,
        LoanAmount:        parseFloat(form.LoanAmount),
        Loan_Amount_Term:  parseFloat(form.Loan_Amount_Term),
        Credit_History:    parseFloat(form.Credit_History),
        Property_Area:     form.Property_Area,
      };

      const res = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.details?.join(' ') || body?.error || `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const data = await res.json();
      if (!data.prediction || data.probability == null) {
        throw new Error('Incomplete response from prediction service.');
      }

      // Persist complete real ML analysis in sessionStorage for Live ML visualization
      try {
        sessionStorage.setItem('loanPredictMLAnalysis', JSON.stringify(data));
      } catch (storageErr) {
        console.warn('Unable to save analysis to sessionStorage:', storageErr);
      }

      setResult(data);
      setStatus('success');
    } catch (err) {
      const msg = err.message?.includes('fetch')
        ? 'Unable to connect to the prediction service. Please make sure the backend is running (python backend/app.py).'
        : `Prediction failed: ${err.message}`;
      setApiError(msg);
      setStatus('error');
    }
  };

  const approved = result?.approved;

  return (
    <main className="pred-page">
      {/* Page heading */}
      <div className="pred-page-head">
        <div className="pred-page-head-inner">
          <div className="pred-badge" role="note">
            <span className="material-symbols-outlined pred-badge-icon">model_training</span>
            Logistic Regression Model
          </div>
          <h1 className="pred-title">Loan Approval Prediction</h1>
          <p className="pred-subtitle">
            Enter applicant details to predict loan approval probability using Logistic Regression.
          </p>
        </div>
      </div>

      {/* Main grid: form + result */}
      <div className="pred-main">

        {/* ── FORM CARD ── */}
        <section className="pred-form-card" aria-label="Applicant information form">
          <div className="form-card-header">
            <span className="material-symbols-outlined form-card-icon">person</span>
            <h2 className="form-card-title">Applicant Information</h2>
          </div>

          <form id="prediction-form" onSubmit={handleSubmit} noValidate>

            {/* Personal Details */}
            <fieldset className="form-section">
              <legend className="form-section-legend">Personal Details</legend>
              <div className="form-grid-2">
                <SelectField id="Gender"        label="Gender"        value={form.Gender}        onChange={setField('Gender')}        options={['Male','Female']}      error={errors.Gender} />
                <SelectField id="Married"       label="Marital Status" value={form.Married}       onChange={setField('Married')}       options={['Yes','No']}           error={errors.Married} />
                <SelectField id="Dependents"    label="Dependents"    value={form.Dependents}    onChange={setField('Dependents')}    options={DEPENDENTS_OPTIONS}     error={errors.Dependents} />
                <SelectField id="Education"     label="Education"     value={form.Education}     onChange={setField('Education')}     options={['Graduate','Not Graduate']} error={errors.Education} />
                <SelectField id="Self_Employed" label="Self Employed" value={form.Self_Employed} onChange={setField('Self_Employed')} options={['Yes','No']}           error={errors.Self_Employed} />
                <SelectField id="Property_Area" label="Property Area" value={form.Property_Area} onChange={setField('Property_Area')} options={PROPERTY_OPTIONS}      error={errors.Property_Area} />
              </div>
            </fieldset>

            {/* Financial Details */}
            <fieldset className="form-section">
              <legend className="form-section-legend">Financial Details</legend>
              <div className="form-grid-2">
                <NumberField id="ApplicantIncome"   label="Applicant Income (₹/month)"    value={form.ApplicantIncome}   onChange={setField('ApplicantIncome')}   error={errors.ApplicantIncome}   placeholder="e.g. 50000" showINR />
                <NumberField id="CoapplicantIncome" label="Co-applicant Income (₹/month)" value={form.CoapplicantIncome} onChange={setField('CoapplicantIncome')} error={errors.CoapplicantIncome} placeholder="e.g. 20000 (0 if none)" showINR />
                <NumberField id="LoanAmount"        label="Loan Amount (₹)"               value={form.LoanAmount}        onChange={setField('LoanAmount')}        error={errors.LoanAmount}        placeholder="e.g. 500000" hint="Enter the total loan amount in rupees (e.g. ₹5,00,000 → enter 500000)." showINR />
                <SelectField id="Loan_Amount_Term"  label="Loan Term"                     value={form.Loan_Amount_Term}  onChange={setField('Loan_Amount_Term')}  options={LOAN_TERM_OPTIONS}      error={errors.Loan_Amount_Term} />
                <SelectField id="Credit_History"    label="Credit History"                value={form.Credit_History}    onChange={setField('Credit_History')}    options={CREDIT_OPTIONS}         error={errors.Credit_History}   hint="1 = good credit history · 0 = poor / no history" />
              </div>
            </fieldset>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="submit"
                id="btn-predict-submit"
                className="btn-predict-submit"
                disabled={status === 'loading'}
                aria-busy={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <span className="material-symbols-outlined btn-spin">progress_activity</span>
                    Predicting…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Predict Loan Approval
                  </>
                )}
              </button>
              <button
                type="button"
                id="btn-reset-form"
                className="btn-reset"
                onClick={handleReset}
              >
                <span className="material-symbols-outlined">refresh</span>
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* ── RESULT PANEL ── */}
        <aside className="pred-result-panel" aria-label="Prediction result" aria-live="polite">

          {/* Idle state */}
          {status === 'idle' && (
            <div className="result-idle">
              <span className="material-symbols-outlined result-idle-icon">analytics</span>
              <h3>Prediction Result</h3>
              <p>Enter applicant information and click<br /><strong>Predict Loan Approval</strong> to see the result.</p>
            </div>
          )}

          {/* Loading state */}
          {status === 'loading' && (
            <div className="result-idle">
              <span className="material-symbols-outlined result-idle-icon spin-slow">progress_activity</span>
              <h3>Analyzing applicant data…</h3>
              <p>The Logistic Regression model is processing your request.</p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="result-error-box" role="alert">
              <span className="material-symbols-outlined result-error-icon">error</span>
              <h3>Prediction Failed</h3>
              <p>{apiError}</p>
              <button className="btn-retry" onClick={handleReset}>
                <span className="material-symbols-outlined">refresh</span>
                Try Again
              </button>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && result && (
            <div className={`result-card ${approved ? 'result-approved' : 'result-rejected'}`}>

              {/* Status header */}
              <div className="result-status-header">
                <span className={`result-verdict-badge ${approved ? 'verdict-approved' : 'verdict-rejected'}`}>
                  <span className="material-symbols-outlined verdict-icon">
                    {approved ? 'check_circle' : 'cancel'}
                  </span>
                  {result.prediction.toUpperCase()}
                </span>
              </div>

              {/* Ring + probability */}
              <ProbabilityRing probability={result.probability} approved={approved} />

              {/* Explanation */}
              <p className="result-explanation">
                {approved
                  ? 'The model predicts a higher probability of loan approval based on the submitted applicant information.'
                  : 'The model predicts a lower probability of loan approval based on the submitted applicant information.'}
              </p>

              <div className="result-divider" />

              {/* Model details */}
              <div className="result-details">
                <div className="result-detail-row">
                  <span className="result-detail-label">Model</span>
                  <span className="result-detail-val">{result.model}</span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-label">Linear Score (z)</span>
                  <span className="result-detail-val result-mono">
                    {result.linear_score >= 0 ? '+' : ''}{result.linear_score.toFixed(4)}
                  </span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-label">Threshold</span>
                  <span className="result-detail-val result-mono">{result.threshold.toFixed(2)}</span>
                </div>
                <div className="result-detail-row">
                  <span className="result-detail-label">Decision Rule</span>
                  <span className="result-detail-val result-formula">P(y=1|x) ≥ θ</span>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="result-disclaimer">
                Academic demonstration only — not a financial or banking decision.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Academic disclaimer */}
      <div className="pred-disclaimer-bar">
        <div className="pred-disclaimer-inner">
          <span className="material-symbols-outlined disc-icon">info</span>
          This application is an academic Machine Learning demonstration and does not provide
          actual banking or financial approval decisions.
          Semester Mini Project 2026–2027.
        </div>
      </div>

      {/* ─── Styles ──────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Page ── */
        .pred-page {
          flex: 1;
          background: var(--bg);
        }

        /* ── Page header band ── */
        .pred-page-head {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .pred-page-head-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 40px 24px 32px;
        }
        .pred-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 13px;
          background: var(--primary-light);
          border: 1px solid rgba(37,99,235,.22);
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          color: var(--primary);
          margin-bottom: 14px;
        }
        .pred-badge-icon { font-size: 16px; }
        .pred-title {
          font-size: clamp(1.4rem, 2.5vw, 2rem);
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .pred-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        /* ── Main grid ── */
        .pred-main {
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 32px 24px 48px;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          align-items: start;
        }

        /* ── Form card ── */
        .pred-form-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-sm);
          padding: 28px;
        }
        .form-card-header {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .form-card-icon {
          font-size: 22px;
          color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .form-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }

        /* Fieldsets */
        .form-section {
          border: none;
          padding: 0;
          margin-bottom: 24px;
        }
        .form-section-legend {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--primary);
          margin-bottom: 14px;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
        }

        /* Fields */
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .field-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .field-inr-tag {
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 1px 7px;
          border-radius: 4px;
        }
        .field-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text);
        }
        .field-input {
          padding: 9px 12px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: var(--text);
          background: var(--surface);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          appearance: auto;
        }
        .field-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }
        .field-input--error {
          border-color: #dc2626;
        }
        .field-input--error:focus {
          box-shadow: 0 0 0 3px rgba(220,38,38,.12);
        }
        .field-hint {
          font-size: 0.73rem;
          color: var(--text-light);
        }
        .field-error {
          font-size: 0.73rem;
          color: #dc2626;
          font-weight: 500;
        }

        /* Form actions */
        .form-actions {
          display: flex;
          gap: 12px;
          padding-top: 8px;
        }
        .btn-predict-submit {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 20px;
          background: var(--primary);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          box-shadow: var(--shadow-md);
          transition: background .15s, transform .1s, opacity .15s;
        }
        .btn-predict-submit:hover:not(:disabled) { background: var(--primary-dark); }
        .btn-predict-submit:active:not(:disabled) { transform: translateY(1px); }
        .btn-predict-submit:disabled { opacity: .65; cursor: not-allowed; }

        .btn-reset {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 11px 18px;
          background: var(--surface);
          color: var(--text-muted);
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          transition: background .12s, color .12s;
        }
        .btn-reset:hover { background: var(--surface-alt); color: var(--text); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-spin, .spin-slow { display: inline-block; animation: spin 1s linear infinite; }

        /* ── Result panel ── */
        .pred-result-panel {
          position: sticky;
          top: calc(var(--header-h) + 20px);
        }

        /* Idle / loading */
        .result-idle {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-sm);
          padding: 40px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .result-idle-icon {
          font-size: 40px;
          color: var(--text-light);
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 40;
        }
        .result-idle h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }
        .result-idle p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* Error box */
        .result-error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 14px;
          padding: 32px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .result-error-icon { font-size: 36px; color: #dc2626; }
        .result-error-box h3 { font-size: 1rem; font-weight: 700; color: #991b1b; }
        .result-error-box p  { font-size: 0.83rem; color: #7f1d1d; line-height: 1.55; }
        .btn-retry {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 6px; padding: 8px 16px;
          background: #dc2626; color: #fff;
          border: none; border-radius: var(--radius);
          font-family: 'Inter', sans-serif; font-size: 0.85rem; font-weight: 600;
          cursor: pointer; transition: background .15s;
        }
        .btn-retry:hover { background: #b91c1c; }

        /* Result card */
        .result-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .result-approved { border-top: 3px solid #16a34a; }
        .result-rejected { border-top: 3px solid #dc2626; }

        .result-status-header { display: flex; justify-content: center; }
        .result-verdict-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 20px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .verdict-approved { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
        .verdict-rejected { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }
        .verdict-icon { font-size: 18px; font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24; }

        /* Ring in result */
        .result-ring-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: center;
        }
        .result-ring-svg {
          width: 90px; height: 90px;
          transform: rotate(-90deg);
          flex-shrink: 0;
        }
        .ring-track { fill: none; stroke: var(--border); stroke-width: 8; }
        .result-ring-label { display: flex; flex-direction: column; align-items: center; }
        .result-prob-value {
          font-size: 1.8rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em;
        }
        .result-prob-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; font-weight: 500; }

        .result-explanation {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.6;
          text-align: center;
        }
        .result-divider { height: 1px; background: var(--border); }

        .result-details { display: flex; flex-direction: column; gap: 9px; }
        .result-detail-row { display: flex; justify-content: space-between; align-items: center; }
        .result-detail-label { font-size: 0.78rem; color: var(--text-muted); }
        .result-detail-val { font-size: 0.82rem; font-weight: 600; color: var(--text); }
        .result-mono { font-family: 'Courier New', monospace; }
        .result-formula {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          background: var(--primary-light);
          color: var(--primary);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .result-disclaimer {
          font-size: 0.72rem;
          color: var(--text-light);
          text-align: center;
          border-top: 1px solid var(--border);
          padding-top: 10px;
        }

        /* ── Disclaimer bar ── */
        .pred-disclaimer-bar {
          background: var(--surface-alt);
          border-top: 1px solid var(--border);
        }
        .pred-disclaimer-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 14px 24px;
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .disc-icon { font-size: 16px; flex-shrink: 0; }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .pred-main {
            grid-template-columns: 1fr;
            padding: 24px 24px 40px;
          }
          .pred-result-panel { position: static; }
        }
        @media (max-width: 640px) {
          .form-grid-2 { grid-template-columns: 1fr; }
          .form-actions { flex-direction: column; }
          .btn-predict-submit, .btn-reset { width: 100%; }
          .pred-page-head-inner { padding: 28px 16px 20px; }
          .pred-main { padding: 20px 16px 36px; }
        }
      `}</style>
    </main>
  );
}
