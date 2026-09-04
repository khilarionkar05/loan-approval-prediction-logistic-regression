import { useState, useRef, useEffect } from 'react';

/* ─── Constants — mirror Prediction.jsx exactly ──────────────────────────── */
const DEPENDENTS_OPTIONS = ['0', '1', '2', '3+'];
const PROPERTY_OPTIONS   = ['Urban', 'Semiurban', 'Rural'];
const CREDIT_OPTIONS     = [
  { label: '1 — Good credit history',      value: '1' },
  { label: '0 — Poor / no credit history', value: '0' },
];
const LOAN_TERM_OPTIONS = [
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

/* Analysis pipeline stage labels */
const PIPELINE_STAGES = [
  { icon: 'input',           label: 'Input Received'       },
  { icon: 'transform',       label: 'Preprocessing'        },
  { icon: 'data_array',      label: 'Feature Encoding'     },
  { icon: 'function',        label: 'Logistic Regression'  },
  { icon: 'percent',         label: 'Probability Calc.'    },
  { icon: 'compare_arrows',  label: 'Threshold Decision'   },
  { icon: 'task_alt',        label: 'Analysis Complete'    },
];

const ANALYZE_URL = 'http://localhost:5000/analyze';

/* ─── Validation (same rules as Prediction + LiveML) ────────────────────── */
function validate(form) {
  const e = {};
  ['Gender','Married','Dependents','Education','Self_Employed',
   'Credit_History','Property_Area','Loan_Amount_Term']
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
    <div className="lad-field">
      <label htmlFor={id} className="lad-label">{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`lad-input${error ? ' lad-input--err' : ''}`}>
        <option value="">Select…</option>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="lad-field-err">{error}</p>}
    </div>
  );
}
function Num({ id, label, value, onChange, error, placeholder }) {
  return (
    <div className="lad-field">
      <label htmlFor={id} className="lad-label">{label}</label>
      <input id={id} type="number" min="0" value={value} placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        className={`lad-input${error ? ' lad-input--err' : ''}`} />
      {error && <p className="lad-field-err">{error}</p>}
    </div>
  );
}

/* ─── Probability gauge ring ─────────────────────────────────────────────── */
function ProbRing({ prob, approved }) {
  const r = 52, circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(1, prob));
  const fill = pct * circ;
  const color = approved ? '#16a34a' : '#dc2626';
  return (
    <div className="lad-ring-wrap">
      <svg viewBox="0 0 120 120" className="lad-ring-svg" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray .8s ease' }} />
      </svg>
      <div className="lad-ring-label">
        <span className="lad-ring-pct" style={{ color }}>{(pct * 100).toFixed(1)}%</span>
        <span className="lad-ring-sub">Approval Prob.</span>
      </div>
    </div>
  );
}

/* ─── Contribution bar (CSS only, no library) ───────────────────────────── */
function ContribBar({ value, maxAbs }) {
  const pct = Math.min(100, Math.abs(value) / maxAbs * 100);
  const pos = value >= 0;
  return (
    <div className="contrib-bar-wrap">
      <div className="contrib-bar-track">
        {pos
          ? <div className="contrib-bar contrib-bar--pos" style={{ width: `${pct}%` }} />
          : <div className="contrib-bar contrib-bar--neg" style={{ width: `${pct}%` }} />}
      </div>
      <span className={`contrib-bar-val ${pos ? 'ctb-pos' : 'ctb-neg'}`}>
        {pos ? '+' : ''}{value.toFixed(4)}
      </span>
    </div>
  );
}

/* ─── Pipeline stage timeline ────────────────────────────────────────────── */
function PipelineTimeline({ activeStage }) {
  return (
    <div className="pipeline-timeline">
      {PIPELINE_STAGES.map((s, i) => {
        const done    = i < activeStage;
        const current = i === activeStage - 1 && activeStage < PIPELINE_STAGES.length;
        const complete = activeStage >= PIPELINE_STAGES.length && i === PIPELINE_STAGES.length - 1;
        return (
          <div key={s.label}
            className={`pipeline-step${done || complete ? ' pipeline-step--done' : ''}${current ? ' pipeline-step--active' : ''}`}>
            <div className="pipeline-dot">
              <span className="material-symbols-outlined pipeline-dot-icon">
                {done || complete ? 'check_circle' : current ? s.icon : 'radio_button_unchecked'}
              </span>
            </div>
            <span className="pipeline-step-label">{s.label}</span>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={`pipeline-line${done ? ' pipeline-line--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function LiveAnalysis() {
  const [form,    setForm]    = useState(INITIAL_FORM);
  const [errors,  setErrors]  = useState({});
  const [status,  setStatus]  = useState('idle');   // idle | loading | done | error
  const [result,  setResult]  = useState(null);
  const [apiErr,  setApiErr]  = useState('');
  const [pipeStg, setPipeStg] = useState(0);
  const timerRef = useRef([]);

  useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  const setField = k => v => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const handleReset = () => {
    timerRef.current.forEach(clearTimeout);
    setForm(INITIAL_FORM);
    setErrors({});
    setResult(null);
    setStatus('idle');
    setApiErr('');
    setPipeStg(0);
  };

  const handleRun = async e => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus('loading');
    setResult(null);
    setApiErr('');
    setPipeStg(0);
    timerRef.current.forEach(clearTimeout);

    /* Animate pipeline stages while awaiting response */
    PIPELINE_STAGES.forEach((_, i) => {
      const t = setTimeout(() => setPipeStg(i + 1), (i + 1) * 380);
      timerRef.current.push(t);
    });

    try {
      const rawLoan = +form.LoanAmount;
      const loanAmount = rawLoan >= 1000 ? rawLoan / 1000 : rawLoan;

      const payload = {
        Gender:            form.Gender,
        Married:           form.Married,
        Dependents:        form.Dependents,
        Education:         form.Education,
        Self_Employed:     form.Self_Employed,
        ApplicantIncome:   +form.ApplicantIncome,
        CoapplicantIncome: +(form.CoapplicantIncome) || 0,
        LoanAmount:        loanAmount,
        Loan_Amount_Term:  +form.Loan_Amount_Term,
        Credit_History:    +form.Credit_History,
        Property_Area:     form.Property_Area,
      };
      const res = await fetch(ANALYZE_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.details?.join(' ') || body?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      /* Ensure pipeline completes before showing result */
      const delay = Math.max(0, PIPELINE_STAGES.length * 380 + 100);
      const t = setTimeout(() => {
        setResult(data);
        setStatus('done');
        setPipeStg(PIPELINE_STAGES.length);
      }, delay);
      timerRef.current.push(t);
    } catch (err) {
      const msg = err.message?.toLowerCase().includes('fetch')
        ? 'Unable to connect to the ML service. Make sure the backend is running (python backend/app.py).'
        : `Analysis failed: ${err.message}`;
      setApiErr(msg);
      setStatus('error');
      setPipeStg(0);
    }
  };

  const r = result;
  const maxAbs = r
    ? Math.max(...r.contributions.map(Math.abs), 0.0001)
    : 0.0001;

  /* Status badge config */
  const badgeCfg = {
    idle:    { cls: 'lad-badge--idle',     icon: 'radio_button_unchecked', text: 'READY' },
    loading: { cls: 'lad-badge--analyzing', icon: 'progress_activity',     text: 'ANALYZING' },
    done:    { cls: 'lad-badge--complete',  icon: 'check_circle',           text: 'ANALYSIS COMPLETE' },
    error:   { cls: 'lad-badge--error',     icon: 'error',                  text: 'ERROR' },
  }[status];

  return (
    <main className="lad-page">

      {/* ── Page header ── */}
      <div className="lad-page-head">
        <div className="lad-head-inner">
          <div className={`lad-status-badge ${badgeCfg.cls}`} role="status">
            <span className={`material-symbols-outlined lad-badge-icon${status === 'loading' ? ' lad-spin' : ''}`}>
              {badgeCfg.icon}
            </span>
            {badgeCfg.text}
          </div>
          <h1 className="lad-title">Live Analysis Dashboard</h1>
          <p className="lad-subtitle">
            Submit applicant data to see a real-time Logistic Regression model analysis.
          </p>
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div className="lad-main">

        {/* LEFT: Input form */}
        <section className="lad-form-card" aria-label="Applicant information form">
          <div className="lad-card-head">
            <span className="material-symbols-outlined lad-card-icon">person_search</span>
            <div>
              <h2 className="lad-card-title">Applicant Information</h2>
              <p className="lad-card-note">Enter data and click <strong>Analyze Application</strong>.</p>
            </div>
          </div>

          <form onSubmit={handleRun} noValidate>
            {/* Personal */}
            <div className="lad-section-label">Personal Details</div>
            <div className="lad-grid-2">
              <Sel id="lad-Gender"    label="Gender"        value={form.Gender}        onChange={setField('Gender')}        options={['Male','Female']}          error={errors.Gender} />
              <Sel id="lad-Married"   label="Married"       value={form.Married}       onChange={setField('Married')}       options={['Yes','No']}               error={errors.Married} />
              <Sel id="lad-Deps"      label="Dependents"    value={form.Dependents}    onChange={setField('Dependents')}    options={DEPENDENTS_OPTIONS}         error={errors.Dependents} />
              <Sel id="lad-Edu"       label="Education"     value={form.Education}     onChange={setField('Education')}     options={['Graduate','Not Graduate']} error={errors.Education} />
              <Sel id="lad-SelfEmp"   label="Self Employed" value={form.Self_Employed} onChange={setField('Self_Employed')} options={['Yes','No']}               error={errors.Self_Employed} />
              <Sel id="lad-Area"      label="Property Area" value={form.Property_Area} onChange={setField('Property_Area')} options={PROPERTY_OPTIONS}           error={errors.Property_Area} />
            </div>

            {/* Financial */}
            <div className="lad-section-label" style={{ marginTop: 14 }}>Financial Details</div>
            <div className="lad-grid-2">
              <Num id="lad-AppInc"  label="Applicant Income (₹/mo)"     value={form.ApplicantIncome}   onChange={setField('ApplicantIncome')}   error={errors.ApplicantIncome}   placeholder="e.g. 5000" />
              <Num id="lad-CoInc"   label="Co-applicant Income (₹/mo)"  value={form.CoapplicantIncome} onChange={setField('CoapplicantIncome')} error={errors.CoapplicantIncome} placeholder="0 if none" />
              <Num id="lad-Loan"    label="Loan Amount (₹ thousands)"   value={form.LoanAmount}        onChange={setField('LoanAmount')}        error={errors.LoanAmount}        placeholder="e.g. 128" />
              <Sel id="lad-Term"    label="Loan Term"                    value={form.Loan_Amount_Term}  onChange={setField('Loan_Amount_Term')}  options={LOAN_TERM_OPTIONS}      error={errors.Loan_Amount_Term} />
              <Sel id="lad-Credit"  label="Credit History"               value={form.Credit_History}    onChange={setField('Credit_History')}    options={CREDIT_OPTIONS}         error={errors.Credit_History} />
            </div>

            {/* Buttons */}
            <div className="lad-actions">
              <button id="btn-analyze" type="submit"
                className="lad-btn-primary"
                disabled={status === 'loading'}
                aria-busy={status === 'loading'}>
                {status === 'loading' ? (
                  <><span className="material-symbols-outlined lad-spin">progress_activity</span>Analyzing…</>
                ) : (
                  <><span className="material-symbols-outlined">analytics</span>Analyze Application</>
                )}
              </button>
              <button id="btn-lad-reset" type="button"
                className="lad-btn-reset" onClick={handleReset}>
                <span className="material-symbols-outlined">refresh</span>Reset
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT: Dashboard */}
        <div className="lad-dashboard" aria-live="polite" aria-label="Live analysis result">

          {/* ── Idle ── */}
          {status === 'idle' && (
            <div className="lad-empty">
              <span className="material-symbols-outlined lad-empty-icon">query_stats</span>
              <h3>No Analysis Yet</h3>
              <p>Enter applicant information and click <strong>Analyze Application</strong> to view the live model analysis dashboard.</p>
            </div>
          )}

          {/* ── Loading — pipeline timeline ── */}
          {(status === 'loading' || (status === 'done' && pipeStg < PIPELINE_STAGES.length)) && (
            <div className="lad-loading-card">
              <div className="lad-loading-head">
                <span className="material-symbols-outlined lad-spin lad-loading-icon">progress_activity</span>
                <div>
                  <div className="lad-loading-title">Running Model Analysis</div>
                  <div className="lad-loading-sub">The Logistic Regression model is processing applicant data…</div>
                </div>
              </div>
              <PipelineTimeline activeStage={pipeStg} />
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <div className="lad-error-card" role="alert">
              <span className="material-symbols-outlined lad-error-icon">error</span>
              <h3>Analysis Failed</h3>
              <p>{apiErr}</p>
              <button className="lad-btn-retry" onClick={handleReset}>
                <span className="material-symbols-outlined">refresh</span>Try Again
              </button>
            </div>
          )}

          {/* ── Done: full dashboard ── */}
          {status === 'done' && r && pipeStg >= PIPELINE_STAGES.length && (
            <div className="lad-result-grid">

              {/* Row 1: Verdict + Probability */}
              <div className="lad-row-top">

                {/* Verdict card */}
                <div className={`lad-verdict-card ${r.approved ? 'verdict-approved' : 'verdict-rejected'}`}>
                  <div className="lad-verdict-label">Final Prediction</div>
                  <div className="lad-verdict-value">
                    <span className="material-symbols-outlined lad-verdict-icon">
                      {r.approved ? 'check_circle' : 'cancel'}
                    </span>
                    {r.prediction.toUpperCase()}
                  </div>
                  <div className="lad-verdict-rule">
                    P(y=1|x)&nbsp;
                    <code>{r.probability.toFixed(4)}</code>
                    &nbsp;{r.probability >= r.threshold ? '≥' : '<'}&nbsp;
                    <code>{r.threshold.toFixed(2)}</code>
                    &nbsp;(θ)
                  </div>
                  <div className="lad-verdict-model">
                    <span className="material-symbols-outlined" style={{fontSize:'13px'}}>model_training</span>
                    {r.model}
                  </div>
                </div>

                {/* Probability gauge */}
                <div className="lad-prob-card">
                  <div className="lad-card-section-label">Approval Probability</div>
                  <ProbRing prob={r.probability} approved={r.approved} />
                  <div className="lad-prob-meta">
                    <div className="lad-meta-row">
                      <span>Linear Score (z)</span>
                      <code className="lad-code">{r.linear_score >= 0 ? '+' : ''}{r.linear_score.toFixed(4)}</code>
                    </div>
                    <div className="lad-meta-row">
                      <span>σ(z) = P(y=1|x)</span>
                      <code className="lad-code">{r.probability.toFixed(6)}</code>
                    </div>
                    <div className="lad-meta-row">
                      <span>Threshold (θ)</span>
                      <code className="lad-code">{r.threshold.toFixed(2)}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Feature Contributions */}
              <div className="lad-contrib-card">
                <div className="lad-card-section-label">
                  <span className="material-symbols-outlined" style={{fontSize:'15px',verticalAlign:'middle'}}>bar_chart</span>
                  &nbsp;Feature Contributions &nbsp;
                  <span className="lad-section-hint">contribution = processed value × coefficient</span>
                </div>
                <div className="lad-contrib-table">
                  <div className="lad-contrib-head">
                    <span>Feature</span>
                    <span>Raw Value</span>
                    <span>Processed</span>
                    <span>Coefficient</span>
                    <span>Contribution</span>
                  </div>
                  {r.feature_names.map((name, i) => (
                    <div key={name} className="lad-contrib-row">
                      <span className="lad-feat-name">{name.replace(/_/g, ' ')}</span>
                      <span className="lad-feat-raw">{r.raw_values[i]}</span>
                      <code className="lad-feat-proc">{r.processed_values[i].toFixed(4)}</code>
                      <code className={`lad-feat-coef ${r.coefficients[i] >= 0 ? 'ctb-pos' : 'ctb-neg'}`}>
                        {r.coefficients[i] >= 0 ? '+' : ''}{r.coefficients[i].toFixed(4)}
                      </code>
                      <ContribBar value={r.contributions[i]} maxAbs={maxAbs} />
                    </div>
                  ))}
                  {/* Intercept row */}
                  <div className="lad-contrib-row lad-contrib-row--intercept">
                    <span className="lad-feat-name">Intercept (β₀)</span>
                    <span className="lad-feat-raw">—</span>
                    <code className="lad-feat-proc">—</code>
                    <code className={`lad-feat-coef ${r.intercept >= 0 ? 'ctb-pos' : 'ctb-neg'}`}>
                      {r.intercept >= 0 ? '+' : ''}{r.intercept.toFixed(4)}
                    </code>
                    <ContribBar value={r.intercept} maxAbs={maxAbs} />
                  </div>
                </div>
              </div>

              {/* Row 3: Equation + Pipeline */}
              <div className="lad-row-bottom">

                {/* Decision equation */}
                <div className="lad-equation-card">
                  <div className="lad-card-section-label">Decision Equation</div>
                  <div className="lad-eq-block">
                    <div className="lad-eq-row">
                      <span className="lad-eq-label">z</span>
                      <span className="lad-eq-op">=</span>
                      <code className="lad-eq-val">{r.linear_score.toFixed(6)}</code>
                    </div>
                    <div className="lad-eq-row">
                      <span className="lad-eq-label">σ(z)</span>
                      <span className="lad-eq-op">=</span>
                      <code className="lad-eq-val">1 / (1 + e<sup>−z</sup>)</code>
                    </div>
                    <div className="lad-eq-row">
                      <span className="lad-eq-label">P(y=1|x)</span>
                      <span className="lad-eq-op">=</span>
                      <code className="lad-eq-val lad-eq-highlight">{r.probability.toFixed(6)}</code>
                    </div>
                    <div className="lad-eq-divider" />
                    <div className="lad-eq-row">
                      <span className="lad-eq-label">{r.probability.toFixed(4)}</span>
                      <span className="lad-eq-op">{r.probability >= r.threshold ? '≥' : '<'}</span>
                      <span className="lad-eq-label">{r.threshold.toFixed(2)}</span>
                      <span className="lad-eq-arrow">→</span>
                      <span className={`lad-eq-verdict ${r.approved ? 'lad-eq-approved' : 'lad-eq-rejected'}`}>
                        {r.prediction.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Completed pipeline */}
                <div className="lad-pipeline-card">
                  <div className="lad-card-section-label">Analysis Pipeline</div>
                  <PipelineTimeline activeStage={PIPELINE_STAGES.length} />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="lad-disclaimer-bar">
        <div className="lad-disclaimer-inner">
          <span className="material-symbols-outlined" style={{ fontSize: '16px', flexShrink: 0 }}>info</span>
          This dashboard is an academic demonstration of a Logistic Regression loan prediction system and is not an actual banking decision system.
          Semester Mini Project 2026–2027.
        </div>
      </div>

      {/* ─── Styles ──────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Page ── */
        .lad-page { flex: 1; background: var(--bg); }

        /* ── Page header ── */
        .lad-page-head {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .lad-head-inner {
          max-width: var(--max-w); margin: 0 auto;
          padding: 36px 24px 28px;
        }

        /* Status badge */
        .lad-status-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em;
          margin-bottom: 14px; border: 1px solid transparent;
          transition: background .25s, color .25s;
        }
        .lad-badge--idle      { background: var(--surface-alt); color: var(--text-muted); border-color: var(--border); }
        .lad-badge--analyzing { background: #eff6ff; color: var(--primary); border-color: rgba(37,99,235,.25); }
        .lad-badge--complete  { background: #f0fdf4; color: #16a34a;        border-color: #bbf7d0; }
        .lad-badge--error     { background: #fef2f2; color: #dc2626;        border-color: #fecaca; }
        .lad-badge-icon { font-size: 15px; }

        .lad-title {
          font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 800;
          color: var(--text); letter-spacing: -0.02em; margin-bottom: 7px;
        }
        .lad-subtitle { font-size: 0.95rem; color: var(--text-muted); }

        /* ── Main grid: form (left) + dashboard (right) ── */
        .lad-main {
          max-width: var(--max-w); margin: 0 auto;
          padding: 28px 24px 48px;
          display: grid; grid-template-columns: 360px 1fr;
          gap: 24px; align-items: start;
        }

        /* ── Form card ── */
        .lad-form-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 22px;
          position: sticky; top: calc(var(--header-h) + 16px);
        }
        .lad-card-head {
          display: flex; align-items: flex-start; gap: 10px; margin-bottom: 16px;
          padding-bottom: 14px; border-bottom: 1px solid var(--border);
        }
        .lad-card-icon {
          font-size: 22px; color: var(--primary); margin-top: 2px;
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .lad-card-title { font-size: 0.95rem; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .lad-card-note  { font-size: 0.75rem; color: var(--text-muted); }

        .lad-section-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--primary); margin-bottom: 10px;
        }
        .lad-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 14px; }

        /* Field helpers */
        .lad-field { display: flex; flex-direction: column; gap: 3px; }
        .lad-label { font-size: 0.76rem; font-weight: 600; color: var(--text); }
        .lad-input {
          padding: 7px 10px; border: 1.5px solid var(--border);
          border-radius: var(--radius); font-family: 'Inter', sans-serif;
          font-size: 0.8rem; color: var(--text); background: var(--surface);
          outline: none; transition: border-color .15s, box-shadow .15s; appearance: auto;
        }
        .lad-input:focus     { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
        .lad-input--err      { border-color: #dc2626; }
        .lad-field-err       { font-size: 0.68rem; color: #dc2626; }

        /* Buttons */
        .lad-actions { display: flex; gap: 10px; margin-top: 16px; }
        .lad-btn-primary {
          flex: 1; display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; padding: 10px 16px;
          background: var(--primary); color: #fff;
          font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 600;
          border: none; border-radius: var(--radius); cursor: pointer;
          box-shadow: var(--shadow-md); transition: background .15s, transform .1s, opacity .15s;
        }
        .lad-btn-primary:hover:not(:disabled)  { background: var(--primary-dark); }
        .lad-btn-primary:active:not(:disabled) { transform: translateY(1px); }
        .lad-btn-primary:disabled { opacity: .65; cursor: not-allowed; }
        .lad-btn-reset {
          display: inline-flex; align-items: center; gap: 5px; padding: 10px 14px;
          background: var(--surface); color: var(--text-muted);
          font-family: 'Inter', sans-serif; font-size: 0.82rem; font-weight: 500;
          border: 1.5px solid var(--border); border-radius: var(--radius);
          cursor: pointer; transition: background .12s;
        }
        .lad-btn-reset:hover { background: var(--surface-alt); color: var(--text); }
        .lad-btn-retry {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 4px; padding: 8px 16px;
          background: #dc2626; color: #fff; border: none;
          border-radius: var(--radius); font-family: 'Inter', sans-serif;
          font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background .15s;
        }
        .lad-btn-retry:hover { background: #b91c1c; }

        @keyframes lad-spin { to { transform: rotate(360deg); } }
        .lad-spin { display: inline-block; animation: lad-spin 1s linear infinite; }

        /* ── Dashboard panel ── */
        .lad-dashboard { min-height: 420px; }

        /* Empty state */
        .lad-empty {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm);
          padding: 64px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .lad-empty-icon {
          font-size: 52px; color: var(--text-light);
          font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48;
        }
        .lad-empty h3 { font-size: 1rem; font-weight: 700; color: var(--text); }
        .lad-empty p  { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; max-width: 380px; }

        /* Loading card */
        .lad-loading-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 28px;
        }
        .lad-loading-head {
          display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px;
          padding-bottom: 20px; border-bottom: 1px solid var(--border);
        }
        .lad-loading-icon { font-size: 28px; color: var(--primary); margin-top: 2px; }
        .lad-loading-title { font-size: 0.95rem; font-weight: 700; color: var(--text); margin-bottom: 3px; }
        .lad-loading-sub   { font-size: 0.82rem; color: var(--text-muted); }

        /* Error card */
        .lad-error-card {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px;
          padding: 40px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }
        .lad-error-icon { font-size: 38px; color: #dc2626; }
        .lad-error-card h3 { font-size: 1rem; font-weight: 700; color: #991b1b; }
        .lad-error-card p  { font-size: 0.83rem; color: #7f1d1d; line-height: 1.55; max-width: 380px; }

        /* ── Pipeline timeline ── */
        .pipeline-timeline {
          display: flex; flex-direction: column; gap: 0;
        }
        .pipeline-step {
          display: flex; align-items: center; gap: 12px;
          position: relative; padding: 6px 0;
        }
        .pipeline-dot .material-symbols-outlined {
          font-size: 20px; color: var(--text-light); transition: color .3s;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .pipeline-step--done .pipeline-dot .material-symbols-outlined {
          color: #16a34a;
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .pipeline-step--active .pipeline-dot .material-symbols-outlined {
          color: var(--primary);
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .pipeline-step-label {
          font-size: 0.82rem; font-weight: 500; color: var(--text-muted);
          transition: color .3s;
        }
        .pipeline-step--done  .pipeline-step-label { color: var(--text); font-weight: 600; }
        .pipeline-step--active .pipeline-step-label { color: var(--primary); font-weight: 600; }
        .pipeline-line {
          position: absolute; left: 10px; top: 28px;
          width: 1px; height: 12px;
          background: var(--border); transition: background .3s;
        }
        .pipeline-line--done { background: #16a34a; }

        /* ── Result grid ── */
        .lad-result-grid { display: flex; flex-direction: column; gap: 16px; }

        /* Top row: verdict + probability side by side */
        .lad-row-top {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }

        /* Verdict card */
        .lad-verdict-card {
          border-radius: 14px; box-shadow: var(--shadow-md);
          padding: 24px; display: flex; flex-direction: column; gap: 10px;
          border: 1px solid var(--border);
        }
        .verdict-approved { background: #f0fdf4; border-top: 3px solid #16a34a; }
        .verdict-rejected { background: #fef2f2; border-top: 3px solid #dc2626; }
        .lad-verdict-label { font-size: 0.7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
        .lad-verdict-value {
          display: flex; align-items: center; gap: 8px;
          font-size: 1.5rem; font-weight: 900; letter-spacing: -.01em;
        }
        .verdict-approved .lad-verdict-value { color: #16a34a; }
        .verdict-rejected .lad-verdict-value { color: #dc2626; }
        .lad-verdict-icon {
          font-size: 26px;
          font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
        }
        .lad-verdict-rule {
          font-size: 0.78rem; color: var(--text-muted);
          display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
        }
        .lad-verdict-rule code {
          background: var(--surface); border: 1px solid var(--border);
          padding: 1px 5px; border-radius: 4px; font-size: 0.75rem;
        }
        .lad-verdict-model {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.72rem; color: var(--text-light);
        }

        /* Probability card */
        .lad-prob-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
        }
        .lad-card-section-label {
          font-size: 0.7rem; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .lad-section-hint {
          font-size: 0.65rem; font-weight: 400; letter-spacing: 0; text-transform: none;
          color: var(--text-light);
        }

        /* Probability ring */
        .lad-ring-wrap { display: flex; align-items: center; gap: 14px; justify-content: center; }
        .lad-ring-svg  { width: 100px; height: 100px; transform: rotate(-90deg); flex-shrink: 0; }
        .lad-ring-label { display: flex; flex-direction: column; align-items: center; }
        .lad-ring-pct { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.03em; }
        .lad-ring-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }

        /* Meta rows */
        .lad-prob-meta { display: flex; flex-direction: column; gap: 7px; }
        .lad-meta-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.78rem; color: var(--text-muted);
        }
        .lad-code {
          font-family: 'Courier New', monospace; font-size: 0.78rem;
          font-weight: 600; color: var(--text);
          background: var(--surface-alt); padding: 1px 6px; border-radius: 4px;
        }

        /* ── Feature contributions card ── */
        .lad-contrib-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 20px;
          overflow-x: auto;
        }
        .lad-contrib-table { display: flex; flex-direction: column; gap: 0; margin-top: 12px; }
        .lad-contrib-head {
          display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 2fr;
          gap: 8px; padding: 5px 4px;
          font-size: 0.67rem; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .05em;
          background: var(--surface-alt); border-radius: 6px; margin-bottom: 4px;
        }
        .lad-contrib-row {
          display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr 2fr;
          gap: 8px; padding: 6px 4px; border-bottom: 1px solid var(--border);
          font-size: 0.8rem; align-items: center;
        }
        .lad-contrib-row:last-child { border-bottom: none; }
        .lad-contrib-row--intercept { background: var(--primary-light); border-radius: 6px; padding: 6px 8px; }
        .lad-feat-name { color: var(--text); font-weight: 500; }
        .lad-feat-raw  { color: var(--text-muted); font-size: 0.77rem; }
        .lad-feat-proc { font-family: 'Courier New', monospace; font-size: 0.76rem; color: var(--primary); }
        .lad-feat-coef { font-family: 'Courier New', monospace; font-size: 0.76rem; font-weight: 600; }
        .ctb-pos { color: #16a34a; }
        .ctb-neg { color: #dc2626; }

        /* Contribution bar */
        .contrib-bar-wrap { display: flex; align-items: center; gap: 8px; }
        .contrib-bar-track {
          flex: 1; height: 8px; background: var(--surface-alt);
          border-radius: 4px; overflow: hidden;
        }
        .contrib-bar { height: 100%; border-radius: 4px; transition: width .6s ease; }
        .contrib-bar--pos { background: #16a34a; }
        .contrib-bar--neg { background: #dc2626; }
        .contrib-bar-val {
          font-family: 'Courier New', monospace; font-size: 0.72rem;
          font-weight: 600; white-space: nowrap; min-width: 56px; text-align: right;
        }

        /* ── Bottom row: equation + pipeline ── */
        .lad-row-bottom {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }

        /* Equation card */
        .lad-equation-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 20px;
        }
        .lad-eq-block {
          background: var(--surface-alt); border-radius: 8px;
          padding: 16px; margin-top: 10px; display: flex; flex-direction: column; gap: 10px;
        }
        .lad-eq-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .lad-eq-label { font-family: 'Courier New', monospace; font-size: 0.85rem; font-weight: 600; color: var(--text); min-width: 80px; }
        .lad-eq-op    { font-size: 1rem; color: var(--text-muted); font-weight: 300; }
        .lad-eq-val   { font-family: 'Courier New', monospace; font-size: 0.9rem; font-weight: 700; color: var(--primary); }
        .lad-eq-highlight { font-size: 1rem; color: var(--text); }
        .lad-eq-divider { height: 1px; background: var(--border); }
        .lad-eq-arrow { font-size: 1rem; color: var(--text-muted); }
        .lad-eq-verdict {
          padding: 4px 12px; border-radius: 999px;
          font-size: 0.82rem; font-weight: 800; letter-spacing: .05em;
        }
        .lad-eq-approved { background: #f0fdf4; color: #16a34a; border: 1.5px solid #bbf7d0; }
        .lad-eq-rejected { background: #fef2f2; color: #dc2626; border: 1.5px solid #fecaca; }

        /* Pipeline complete card */
        .lad-pipeline-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow-sm); padding: 20px;
        }

        /* ── Disclaimer ── */
        .lad-disclaimer-bar { background: var(--surface-alt); border-top: 1px solid var(--border); }
        .lad-disclaimer-inner {
          max-width: var(--max-w); margin: 0 auto; padding: 14px 24px;
          font-size: 0.78rem; color: var(--text-muted);
          display: flex; align-items: center; gap: 7px;
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .lad-row-top    { grid-template-columns: 1fr; }
          .lad-row-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 960px) {
          .lad-main { grid-template-columns: 1fr; padding: 20px 24px 40px; }
          .lad-form-card { position: static; }
        }
        @media (max-width: 640px) {
          .lad-grid-2 { grid-template-columns: 1fr; }
          .lad-actions { flex-direction: column; }
          .lad-btn-primary, .lad-btn-reset { width: 100%; }
          .lad-head-inner { padding: 24px 16px 20px; }
          .lad-main { padding: 16px 16px 36px; }
          .lad-contrib-head, .lad-contrib-row { grid-template-columns: 1.4fr 0.8fr 1fr 2fr; }
          .lad-contrib-head span:nth-child(3),
          .lad-contrib-row .lad-feat-proc { display: none; }
        }
      `}</style>
    </main>
  );
}
