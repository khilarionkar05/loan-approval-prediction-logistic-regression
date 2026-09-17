import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const STORAGE_KEY = 'loanPredictMLAnalysis';
const TRAINING_DATA_URL = API_ENDPOINTS.trainingData;

/* ─────────────────────────────────────────────────────────────────
   HELPER: Load stored prediction analysis from sessionStorage
   ───────────────────────────────────────────────────────────────── */
function loadStoredAnalysis() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.prediction && parsed.probability != null && parsed.feature_names) {
      return parsed;
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   HELPER: Build per-feature contributions from backend flat arrays
   Backend returns: feature_names[], processed_values[], coefficients[], contributions[], raw_values[]
   This assembles them into a usable row structure.
   ───────────────────────────────────────────────────────────────── */
function buildFeatureContributions(analysis) {
  if (!analysis) return [];
  const { feature_names, processed_values, coefficients, contributions, raw_values } = analysis;
  if (!feature_names || !coefficients || !contributions) return [];
  return feature_names.map((name, i) => ({
    feature: name,
    raw_value: raw_values?.[i] ?? '—',
    processed_value: processed_values?.[i] ?? 0,
    coefficient: coefficients?.[i] ?? 0,
    contribution: contributions?.[i] ?? 0,
  }));
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT: Historical Dataset Scatter Plot (native SVG, real data only)
   ══════════════════════════════════════════════════════════════════════════ */
function TrainingScatterPlot({ dataset, applicantPoint, selectedPoint, onSelectPoint }) {
  // Fixed SVG coordinate space
  const W = 700, H = 380;
  const pl = 70, pr = 30, pt = 30, pb = 55;
  const cW = W - pl - pr;
  const cH = H - pt - pb;

  // Axis domains: ApplicantIncome 0–18000, LoanAmount 0–420 (model units = ₹ thousands)
  const maxX = 18000, maxY = 420;
  const sx = (v) => pl + (Math.min(maxX, Math.max(0, v)) / maxX) * cW;
  const sy = (v) => pt + cH - (Math.min(maxY, Math.max(0, v)) / maxY) * cH;

  const xTicks = [0, 3000, 6000, 9000, 12000, 15000, 18000];
  const yTicks = [0, 70, 140, 210, 280, 350, 420];

  const approved = dataset.filter(d => d.approved).length;
  const rejected = dataset.filter(d => !d.approved).length;

  return (
    <div className="scatter-container">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="scatter-svg"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Scatter plot of historical loan applications: ApplicantIncome vs LoanAmount"
      >
        {/* Grid lines */}
        {xTicks.map(t => (
          <line key={`xg-${t}`} x1={sx(t)} y1={pt} x2={sx(t)} y2={pt + cH}
            stroke="var(--border)" strokeDasharray="2 2" strokeWidth="1" />
        ))}
        {yTicks.map(t => (
          <line key={`yg-${t}`} x1={pl} y1={sy(t)} x2={pl + cW} y2={sy(t)}
            stroke="var(--border)" strokeDasharray="2 2" strokeWidth="1" />
        ))}

        {/* Axes */}
        <line x1={pl} y1={pt + cH} x2={pl + cW} y2={pt + cH} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={pl} y1={pt}      x2={pl}       y2={pt + cH} stroke="#94a3b8" strokeWidth="1.5" />

        {/* X-axis tick labels */}
        {xTicks.map(t => (
          <text key={`xt-${t}`} x={sx(t)} y={pt + cH + 18}
            className="axis-tick-text" textAnchor="middle">
            ₹{(t / 1000).toFixed(0)}k
          </text>
        ))}

        {/* Y-axis tick labels */}
        {yTicks.map(t => (
          <text key={`yt-${t}`} x={pl - 8} y={sy(t) + 4}
            className="axis-tick-text" textAnchor="end">
            {t}
          </text>
        ))}

        {/* Axis titles */}
        <text x={pl + cW / 2} y={H - 8} className="axis-title-text" textAnchor="middle">
          Applicant Monthly Income (₹)
        </text>
        <text
          x={-(pt + cH / 2)} y={14}
          transform="rotate(-90)"
          className="axis-title-text" textAnchor="middle"
        >
          Loan Amount (₹ Thousands)
        </text>

        {/* Historical data points — each circle is a real dataset row */}
        {dataset.map((pt, i) => {
          const cx = sx(pt.ApplicantIncome);
          const cy = sy(pt.LoanAmount);
          const isSel = selectedPoint === pt;
          const color = pt.approved ? '#16a34a' : '#dc2626';
          return (
            <circle
              key={i}
              cx={cx} cy={cy}
              r={isSel ? 6 : 3.5}
              fill={color}
              opacity={isSel ? 1 : 0.62}
              stroke={isSel ? '#ffffff' : 'none'}
              strokeWidth={isSel ? 2 : 0}
              className="historical-point"
              onClick={() => onSelectPoint(isSel ? null : pt)}
              onKeyDown={e => e.key === 'Enter' && onSelectPoint(isSel ? null : pt)}
              role="button"
              tabIndex={0}
              aria-label={`Income ₹${pt.ApplicantIncome.toLocaleString('en-IN')}, Loan ₹${(pt.LoanAmount * 1000).toLocaleString('en-IN')}, ${pt.Loan_Status}`}
            />
          );
        })}

        {/* Applicant marker — only shown when prediction exists */}
        {applicantPoint && (
          <g>
            {/* Pulsing outer ring */}
            <circle
              cx={sx(applicantPoint.ApplicantIncome)}
              cy={sy(applicantPoint.LoanAmount)}
              r="14"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              className="applicant-pulse-ring"
            />
            {/* Solid core */}
            <circle
              cx={sx(applicantPoint.ApplicantIncome)}
              cy={sy(applicantPoint.LoanAmount)}
              r="7"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            {/* Label tooltip — flip if near right edge */}
            {(() => {
              const lx = sx(applicantPoint.ApplicantIncome);
              const ly = sy(applicantPoint.LoanAmount);
              const labelX = lx > W - 180 ? lx - 154 : lx + 12;
              return (
                <>
                  <rect x={labelX} y={ly - 28} width={142} height={24} rx="4"
                    fill="#0f172a" opacity="0.92" />
                  <text x={labelX + 8} y={ly - 11}
                    fill="#ffffff" fontSize="11" fontWeight="700"
                    fontFamily="Inter, sans-serif">
                    ★ YOUR APPLICATION
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Legend + stats row */}
      <div className="scatter-legend-bar">
        <div className="legend-items">
          <span className="legend-item">
            <span className="dot dot-approved" /> Approved ({approved})
          </span>
          <span className="legend-item">
            <span className="dot dot-rejected" /> Rejected ({rejected})
          </span>
          {applicantPoint && (
            <span className="legend-item highlight-legend">
              <span className="dot dot-applicant" />
              Your Application (₹{applicantPoint.ApplicantIncome.toLocaleString('en-IN')},&nbsp;
              {applicantPoint.LoanAmount.toFixed(1)}k)
            </span>
          )}
        </div>
        <span className="scatter-sample-info">
          {dataset.length} real rows from <code>loan_data.csv</code>
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT: Sigmoid Curve (pure math visualisation — NOT the scatter plot)
   ══════════════════════════════════════════════════════════════════════════ */
function SigmoidCurve({ applicantScore, applicantProb, isApproved }) {
  const svgW = 600, svgH = 260;
  const zToX = v => 40 + ((v + 6) / 12) * 520;
  const pToY = p => 220 - p * 180;

  // Build the smooth sigmoid path mathematically
  const pts = [];
  for (let z = -6; z <= 6; z += 0.2) {
    pts.push(`${zToX(z).toFixed(1)},${pToY(1 / (1 + Math.exp(-z))).toFixed(1)}`);
  }
  const pathD = `M ${pts.join(' L ')}`;

  const hasApplicant = applicantScore != null;
  const clampedZ = hasApplicant ? Math.min(6, Math.max(-6, applicantScore)) : null;
  const clampedP = hasApplicant ? Math.min(1, Math.max(0, applicantProb)) : null;
  const ax = hasApplicant ? zToX(clampedZ) : null;
  const ay = hasApplicant ? pToY(clampedP) : null;

  return (
    <div className="sigmoid-panel">
      <div className="sig-header">
        <div>
          <span className="sig-title-tag">NONLINEAR ACTIVATION FUNCTION</span>
          <h3 className="sig-title">Sigmoid Mapping: Score z → Probability P</h3>
        </div>
        <div className="sig-formula-badge mono">σ(z) = 1 / (1 + e⁻ᶻ)</div>
      </div>

      <div className="sig-svg-wrap">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="sig-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Sigmoid activation function curve showing probability from 0 to 1 as z increases"
        >
          {/* Threshold line at P = 0.50 */}
          <line x1="40" y1={pToY(0.5)} x2="560" y2={pToY(0.5)}
            stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="565" y={pToY(0.5) + 4} fill="#2563eb" fontSize="11" fontWeight="700">
            θ = 0.50
          </text>

          {/* Z = 0 vertical axis */}
          <line x1={zToX(0)} y1="30" x2={zToX(0)} y2="228" stroke="var(--border)" strokeWidth="1.5" />

          {/* X-axis baseline */}
          <line x1="40" y1="220" x2="560" y2="220" stroke="var(--border)" strokeWidth="1.5" />

          {/* Y-axis labels */}
          <text x="28" y={pToY(1.0) + 4} className="axis-tick-text">1.0</text>
          <text x="22" y={pToY(0.5) + 4} className="axis-tick-text">0.50</text>
          <text x="28" y={pToY(0.0) + 4} className="axis-tick-text">0.0</text>

          {/* X-axis labels */}
          <text x={zToX(-5)} y="238" className="axis-tick-text">−5</text>
          <text x={zToX(-3)} y="238" className="axis-tick-text">−3</text>
          <text x={zToX(0)}  y="238" className="axis-tick-text" textAnchor="middle">z = 0</text>
          <text x={zToX(3)}  y="238" className="axis-tick-text">+3</text>
          <text x={zToX(5)}  y="238" className="axis-tick-text">+5</text>

          {/* Sigmoid curve */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />

          {/* Center dot at (0, 0.5) */}
          <circle cx={zToX(0)} cy={pToY(0.5)} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />

          {/* Applicant's score projected onto the curve */}
          {hasApplicant && (
            <g>
              <line x1={ax} y1={ay} x2={ax} y2="220"
                stroke={isApproved ? '#16a34a' : '#dc2626'}
                strokeDasharray="4 3" strokeWidth="1.5" />
              <circle cx={ax} cy={ay} r="7"
                fill={isApproved ? '#16a34a' : '#dc2626'}
                stroke="#ffffff" strokeWidth="2.5" />
              {/* Score label above point */}
              <rect x={ax - 28} y={ay - 36} width="56" height="20" rx="4"
                fill={isApproved ? '#16a34a' : '#dc2626'} opacity="0.92" />
              <text x={ax} y={ay - 22}
                fill="#fff" fontSize="10" fontWeight="700"
                fontFamily="Inter, sans-serif" textAnchor="middle">
                z = {applicantScore >= 0 ? '+' : ''}{applicantScore.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Explanation footer */}
      <div className="sig-footer-explanation">
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)', flexShrink: 0 }}>info</span>
        <span>
          <strong>Mathematical Sigmoid Function:</strong> Converts the unbounded linear score{' '}
          <code>z ∈ (−∞, +∞)</code> into a calibrated probability bounded between{' '}
          <code>0.0</code> and <code>1.0</code>.{' '}
          {hasApplicant ? (
            <>Your score <strong>z = {applicantScore >= 0 ? '+' : ''}{applicantScore.toFixed(4)}</strong>{' '}
            evaluates to <strong>{(applicantProb * 100).toFixed(2)}%</strong> approval probability.</>
          ) : (
            'Make a prediction to see your applicant\'s score projected onto this curve.'
          )}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT: Animated ML Pipeline (Section 7)
   Sequential stage highlight using setInterval, resets when analysis changes
   ══════════════════════════════════════════════════════════════════════════ */
function MLPipeline({ analysis }) {
  const [activeStage, setActiveStage] = useState(0);
  const intervalRef = useRef(null);

  const stages = useMemo(() => [
    {
      id: 'data',
      label: '01 — HISTORICAL DATA',
      desc: 'Dataset of approved & rejected loan applications',
      value: null,
      hint: 'These are examples the model learns from.',
    },
    {
      id: 'preprocessing',
      label: '02 — PREPROCESSING',
      desc: 'Missing value imputation, label encoding & StandardScaler',
      value: null,
      hint: 'Raw data is encoded and standardized using the existing pipeline.',
    },
    {
      id: 'features',
      label: '03 — FEATURE VECTOR',
      desc: '11 standardized numerical features',
      value: analysis ? `${analysis.feature_names?.length ?? 11} features` : '11 features',
      hint: 'Raw data is encoded and standardized using the existing pipeline.',
    },
    {
      id: 'lr',
      label: '04 — LOGISTIC REGRESSION',
      desc: 'Dot product with learned weights β',
      value: 'z = β₀ + Σ(βᵢ · xᵢ)',
      hint: 'The model combines the processed features using learned coefficients.',
      formula: 'z = β₀ + Σβᵢxᵢ',
    },
    {
      id: 'score',
      label: '05 — DECISION SCORE',
      desc: 'Unbounded linear log-odds scalar z',
      value: analysis
        ? `z = ${analysis.linear_score >= 0 ? '+' : ''}${analysis.linear_score.toFixed(4)}`
        : 'z score',
      hint: 'The model calculates z.',
    },
    {
      id: 'sigmoid',
      label: '06 — SIGMOID',
      desc: 'Nonlinear probability mapping σ(z)',
      value: 'P = 1 / (1 + e⁻ᶻ)',
      hint: 'The score becomes a probability.',
      formula: 'σ(z) = 1 / (1 + e⁻ᶻ)',
    },
    {
      id: 'probability',
      label: '07 — PROBABILITY',
      desc: 'Calibrated confidence score P ∈ [0, 1]',
      value: analysis
        ? `${(analysis.probability * 100).toFixed(2)}%`
        : 'P(y=1|x)',
      hint: 'The probability is compared with 0.50.',
    },
    {
      id: 'threshold',
      label: '08 — THRESHOLD',
      desc: 'Binary classification boundary',
      value: `θ = ${analysis ? analysis.threshold.toFixed(2) : '0.50'}`,
      hint: 'P ≥ 0.50 → Approved',
    },
    {
      id: 'decision',
      label: '09 — FINAL DECISION',
      desc: 'Loan approval verdict',
      value: analysis ? analysis.prediction.toUpperCase() : 'Verdict',
      hint: 'Approved / Rejected.',
      formula: 'P ≥ 0.50 → Approved\nP < 0.50 → Rejected',
    },
  ], [analysis]);

  // Auto-advance every 2.6 s; restart whenever analysis changes
  const restart = useCallback(() => {
    setActiveStage(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveStage(prev => (prev + 1) % stages.length);
    }, 2600);
  }, [stages.length]);

  useEffect(() => {
    restart();
    return () => clearInterval(intervalRef.current);
  }, [restart]);

  return (
    <div className="pipeline-card">
      <div className="pipeline-track" role="list">
        {stages.map((stage, idx) => {
          const isActive = activeStage === idx;
          const isPassed = activeStage > idx;
          const isDecision = stage.id === 'decision';
          const approved = analysis?.approved;
          return (
            <div
              key={stage.id}
              role="listitem"
              className={`pipeline-step${isActive ? ' active' : ''}${isPassed ? ' passed' : ''}${isDecision && analysis ? (approved ? ' step-approved' : ' step-rejected') : ''}`}
              title={stage.formula ?? stage.hint}
              onClick={() => setActiveStage(idx)}
            >
              <div className="step-circle">
                {isPassed
                  ? <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check</span>
                  : idx + 1
                }
                {isActive && <span className="data-particle" aria-hidden="true" />}
              </div>
              <div className="step-info">
                <div className="step-title">{stage.label}</div>
                <div className="step-desc">{stage.desc}</div>
                {stage.value && (
                  <div className="step-val mono">{stage.value}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="pipeline-note">
        Click any stage to inspect it. Values shown are from the real backend analysis for the current applicant.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — LiveAnalysis (ML Visualization page)
   Route: /live-analysis   Nav label: ML Visualization
   ══════════════════════════════════════════════════════════════════════════ */
export default function LiveAnalysis() {
  // ── State ──
  const [analysis, setAnalysis]       = useState(() => loadStoredAnalysis());
  const [trainingData, setTrainingData] = useState([]);
  const [loadingData, setLoadingData]  = useState(true);
  const [dataError, setDataError]      = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // ── Keep in sync with sessionStorage (same tab + cross-tab) ──
  useEffect(() => {
    // Same-tab: poll for changes (Prediction page sets sessionStorage, then navigates here)
    let lastVal = sessionStorage.getItem(STORAGE_KEY);
    const poll = setInterval(() => {
      const cur = sessionStorage.getItem(STORAGE_KEY);
      if (cur !== lastVal) {
        lastVal = cur;
        setAnalysis(loadStoredAnalysis());
      }
    }, 500);

    // Cross-tab: storage event
    const onStorage = () => setAnalysis(loadStoredAnalysis());
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // ── Fetch real training data from backend ──
  useEffect(() => {
    let alive = true;
    fetch(TRAINING_DATA_URL)
      .then(r => {
        if (!r.ok) throw new Error(`Backend returned ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!alive) return;
        if (data && Array.isArray(data.data)) {
          setTrainingData(data.data);
        } else {
          setDataError('No valid data from training-data endpoint.');
        }
        setLoadingData(false);
      })
      .catch(err => {
        if (!alive) return;
        setDataError(
          err.message?.toLowerCase().includes('fetch')
            ? 'Cannot reach the prediction backend. Start it with: python backend/app.py'
            : err.message
        );
        setLoadingData(false);
      });
    return () => { alive = false; };
  }, []);

  // ── Derive applicant point for the scatter plot ──
  const applicantPoint = useMemo(() => {
    if (!analysis) return null;
    const inc  = Number(analysis.applicant?.ApplicantIncome ?? analysis.raw_values?.[6] ?? 0);
    const loan = Number(
      analysis.model_loan_amount
        ?? (analysis.raw_loan_amount ? analysis.raw_loan_amount / 1000 : 128)
    );
    return { ApplicantIncome: inc, LoanAmount: loan, approved: Boolean(analysis.approved) };
  }, [analysis]);

  // ── Build feature contribution rows from flat backend arrays ──
  const featureContributions = useMemo(() => buildFeatureContributions(analysis), [analysis]);

  const hasPrediction = Boolean(analysis?.prediction);

  const fmt = v => (v == null ? '₹0' : `₹${Number(v).toLocaleString('en-IN')}`);

  /* ── JSX ── */
  return (
    <main className="mlviz-page">

      {/* ════════════════════════════════════════════════════
          PAGE HERO
          ════════════════════════════════════════════════════ */}
      <div className="mlviz-hero">
        <div className="mlviz-hero-inner">
          <div className="hero-top-row">
            <div className="mlviz-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>insights</span>
              HOW THE MODEL THINKS
            </div>
            <div className="mlviz-status-tag">
              <span className="status-dot" aria-hidden="true" />
              LOGISTIC REGRESSION · MODEL READY
            </div>
          </div>
          <h1 className="mlviz-title">From Historical Loan Data to Your Prediction</h1>
          <p className="mlviz-subtitle">
            Explore how LoanPredict AI learns patterns from genuine historical applications,
            transforms raw financial features, and produces a mathematically explainable decision
            using Logistic Regression.
          </p>
        </div>
      </div>

      <div className="mlviz-content">

        {/* ════════════════════════════════════════════════════
            SECTION 01 — TRAINING DATA (real scatter from CSV)
            ════════════════════════════════════════════════════ */}
        <section className="mlviz-section" aria-labelledby="s01-title">
          <div className="section-head">
            <span className="section-num">01 — TRAINING DATA</span>
            <h2 id="s01-title" className="section-title">Where the Model Learns</h2>
            <p className="section-desc">
              Before making predictions, Logistic Regression learns from historical loan applications.
              Every point below corresponds to an <strong>actual unmodified row</strong> from{' '}
              <code>backend/data/loan_data.csv</code>.
            </p>
          </div>

          <div className="viz-card">
            {loadingData && (
              <div className="viz-loading" role="status" aria-live="polite">
                <span className="material-symbols-outlined spin-icon" aria-hidden="true">progress_activity</span>
                <span>Loading real dataset from backend/data/loan_data.csv…</span>
              </div>
            )}
            {!loadingData && dataError && (
              <div className="viz-error" role="alert">
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#dc2626' }}>error</span>
                <div>
                  <strong>Could not load training data</strong>
                  <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>{dataError}</p>
                </div>
              </div>
            )}
            {!loadingData && !dataError && (
              <>
                <TrainingScatterPlot
                  dataset={trainingData}
                  applicantPoint={applicantPoint}
                  selectedPoint={selectedPoint}
                  onSelectPoint={setSelectedPoint}
                />

                {/* Point detail panel (click to open) */}
                {selectedPoint && (
                  <div className="point-detail-card" role="region" aria-label="Selected historical record">
                    <div className="point-detail-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>person</span>
                      Historical Record — click another point to update, or click the same to close
                    </div>
                    <div className="point-detail-grid">
                      <div><strong>Applicant Income:</strong> ₹{selectedPoint.ApplicantIncome.toLocaleString('en-IN')}</div>
                      <div><strong>Co-Applicant Income:</strong> ₹{selectedPoint.CoapplicantIncome.toLocaleString('en-IN')}</div>
                      <div>
                        <strong>Loan Amount:</strong>{' '}
                        ₹{(selectedPoint.LoanAmount * 1000).toLocaleString('en-IN')}&nbsp;
                        ({selectedPoint.LoanAmount}k)
                      </div>
                      <div>
                        <strong>Credit History:</strong>{' '}
                        {selectedPoint.Credit_History === 1
                          ? '1.0 (Meets guidelines)'
                          : '0.0 (Defaults/Poor)'}
                      </div>
                      <div><strong>Property Area:</strong> {selectedPoint.Property_Area}</div>
                      <div>
                        <strong>Historical Status:</strong>{' '}
                        <span className={`badge-mini ${selectedPoint.approved ? 'approved' : 'rejected'}`}>
                          {selectedPoint.approved ? 'APPROVED' : 'REJECTED'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 02 — DATA PATTERNS
            ════════════════════════════════════════════════════ */}
        <section className="mlviz-section" aria-labelledby="s02-title">
          <div className="section-head">
            <span className="section-num">02 — DATA PATTERNS</span>
            <h2 id="s02-title" className="section-title">What the Data Shows</h2>
            <p className="section-desc">
              Logistic Regression looks for correlations between applicant attributes and the
              approval outcome. The six features below are the actual inputs used by this model.
            </p>
          </div>

          <div className="feature-concepts-grid">
            {[
              { icon: 'payments',       title: 'Applicant Income',    text: 'Primary indicator of direct repayment capacity. Higher income broadens debt-servicing ability.' },
              { icon: 'group',          title: 'Co-applicant Income', text: 'Secondary household income that lowers risk when the co-applicant contributes substantially.' },
              { icon: 'account_balance',title: 'Loan Amount',         text: 'Requested principal in ₹ thousands. Larger requests require corresponding income backing.' },
              { icon: 'calendar_month', title: 'Loan Term',           text: 'Repayment tenure in months (typically 360). Directly affects monthly amortization liability.' },
              { icon: 'verified',       title: 'Credit History',      text: 'Strongest statistical predictor. A value of 1 (good history) significantly elevates log-odds.' },
              { icon: 'location_city',  title: 'Property Area',       text: 'Semiurban, Urban, or Rural zoning. Each carries distinct regional risk multipliers.' },
            ].map(({ icon, title, text }) => (
              <div className="concept-card" key={title}>
                <div className="concept-icon-box">
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="accuracy-notice-callout" role="note">
            <span className="material-symbols-outlined" style={{ flexShrink: 0 }}>lightbulb</span>
            <div>
              <strong>Multi-dimensional Reality:</strong> The 2D scatter plot above shows only two of
              the eleven features. The model does not make its decision from that graph alone — it uses
              the complete feature vector and the trained preprocessing pipeline to determine the
              separating hyperplane.
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 03 — MODEL LEARNING
            ════════════════════════════════════════════════════ */}
        <section className="mlviz-section" aria-labelledby="s03-title">
          <div className="section-head">
            <span className="section-num">03 — MODEL LEARNING</span>
            <h2 id="s03-title" className="section-title">How Logistic Regression Learns</h2>
            <p className="section-desc">
              During training, maximum likelihood estimation finds the optimal weights β
              that best separate approved applications from rejected ones across all 11 features.
            </p>
          </div>

          <div className="math-explainer-card">
            {/* Visual flow: step boxes */}
            <div className="math-flow" role="list">
              {[
                { tag: 'Step 1', name: 'Historical Data' },
                { tag: 'Step 2', name: 'Feature Processing' },
                { tag: 'Step 3', name: 'Weighted Features' },
                { tag: 'Step 4', name: 'Linear Score z' },
                { tag: 'Step 5', name: 'Sigmoid → P(y=1)' },
              ].map(({ tag, name }, i, arr) => (
                <>
                  <div role="listitem" className="flow-step" key={name}>
                    <span className="step-tag">{tag}</span>
                    <span className="step-name">{name}</span>
                  </div>
                  {i < arr.length - 1 && <span className="flow-arrow" aria-hidden="true">→</span>}
                </>
              ))}
            </div>

            {/* Two formula boxes */}
            <div className="formula-display-grid">
              <div className="formula-box">
                <div className="formula-label">1. LINEAR COMBINATION (LOG-ODDS)</div>
                <div className="formula-math mono">z = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ</div>
                <div className="formula-desc">
                  Computes the linear decision score across the preprocessed feature vector.
                </div>
              </div>
              <div className="formula-box">
                <div className="formula-label">2. SIGMOID ACTIVATION</div>
                <div className="formula-math mono">P(y=1|x) = 1 / (1 + e⁻ᶻ)</div>
                <div className="formula-desc">
                  Converts the unbounded score z into a calibrated probability in [0, 1].
                </div>
              </div>
            </div>

            <p className="math-summary-text">
              The model combines the processed features using learned coefficients and converts
              the resulting score into a probability. Do not display fake coefficients — the actual
              values are shown in the ML breakdown on the{' '}
              <Link to="/live-ml" className="inline-link">Live ML page</Link>.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 04 — SIGMOID (pure math, separate from scatter)
            ════════════════════════════════════════════════════ */}
        <section className="mlviz-section" aria-labelledby="s04-title">
          <div className="section-head">
            <span className="section-num">04 — PROBABILITY</span>
            <h2 id="s04-title" className="section-title">The Sigmoid Activation Function</h2>
            <p className="section-desc">
              This graph shows the <em>mathematical sigmoid function</em> — not the training scatter
              plot. It visualises how any linear score z maps to a probability between 0 and 1.
            </p>
          </div>

          <SigmoidCurve
            applicantScore={analysis?.linear_score ?? null}
            applicantProb={analysis?.probability ?? null}
            isApproved={analysis?.approved ?? false}
          />
        </section>

        {/* ════════════════════════════════════════════════════
            SECTIONS 05 & 06 — NEW APPLICANT + GRAPH MARKER
            ════════════════════════════════════════════════════ */}
        <section className="mlviz-section" id="new-applicant-section" aria-labelledby="s05-title">
          <div className="section-head">
            <span className="section-num">05 &amp; 06 — NEW APPLICANT</span>
            <h2 id="s05-title" className="section-title">New Applicant Enters the Model</h2>
            <p className="section-desc">
              Your application from the Prediction page enters the exact same preprocessing and
              Logistic Regression pipeline. No re-entry required — data is read from{' '}
              <code>sessionStorage</code>.
            </p>
          </div>

          {!hasPrediction ? (
            <div className="no-prediction-card" role="status">
              <span className="material-symbols-outlined no-pred-icon" aria-hidden="true">person_search</span>
              <h3>No applicant prediction loaded</h3>
              <p>
                Go to Prediction to evaluate an applicant. The full ML breakdown and scatter
                marker will appear here automatically.
              </p>
              <Link to="/prediction" className="btn-start-prediction">
                Start Prediction
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="applicant-overview-grid">
              {/* Left: applicant data summary (read-only) */}
              <div className="applicant-summary-card">
                <div className="app-card-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>badge</span>
                  New applicant from Prediction page
                </div>
                <div className="app-data-grid">
                  <div className="app-datum">
                    <span className="datum-label">Applicant Income</span>
                    <span className="datum-value">{fmt(analysis.applicant?.ApplicantIncome)}</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Co-applicant Income</span>
                    <span className="datum-value">{fmt(analysis.applicant?.CoapplicantIncome)}</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Loan Amount</span>
                    <span className="datum-value">
                      {analysis.raw_loan_amount
                        ? fmt(analysis.raw_loan_amount)
                        : fmt(analysis.model_loan_amount * 1000)}
                    </span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Loan Term</span>
                    <span className="datum-value">
                      {analysis.applicant?.Loan_Amount_Term ?? '—'} months
                    </span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Credit History</span>
                    <span className="datum-value">
                      {Number(analysis.applicant?.Credit_History) === 1
                        ? 'Good (1.0)' : 'Defaults / Poor (0.0)'}
                    </span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Property Area</span>
                    <span className="datum-value">{analysis.applicant?.Property_Area ?? '—'}</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Gender</span>
                    <span className="datum-value">{analysis.applicant?.Gender ?? '—'}</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Education</span>
                    <span className="datum-value">{analysis.applicant?.Education ?? '—'}</span>
                  </div>
                </div>
                <div className="app-sync-footer">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#16a34a' }}>check_circle</span>
                  Synced from <code>sessionStorage (loanPredictMLAnalysis)</code>
                </div>
              </div>

              {/* Right: position note + graph reference */}
              <div className="applicant-position-note-card">
                <div className="note-head">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>pin_drop</span>
                  <h4>Projected on Historical Data</h4>
                </div>
                <p>
                  In Section 01 above, a pulsing blue marker labelled{' '}
                  <strong>★ YOUR APPLICATION</strong> has been placed at your applicant's
                  coordinates: Income{' '}
                  <strong>₹{applicantPoint.ApplicantIncome.toLocaleString('en-IN')}</strong>,
                  Loan <strong>{applicantPoint.LoanAmount.toFixed(1)}k</strong>.
                </p>
                <div className="ml-notice-box">
                  This point represents your application on a two-feature projection only.
                  The actual Logistic Regression prediction uses the complete 11-feature
                  vector — not solely these two dimensions.
                </div>
                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  <Link to="/live-ml" className="btn-outline-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>play_circle</span>
                    View 10-Step ML Breakdown
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════
            SECTION 07 — REAL ML PIPELINE ANIMATION
            ════════════════════════════════════════════════════ */}
        <section className="mlviz-section" aria-labelledby="s07-title">
          <div className="section-head">
            <span className="section-num">07 — REAL ML PROCESS PIPELINE</span>
            <h2 id="s07-title" className="section-title">Step-by-Step Data Journey</h2>
            <p className="section-desc">
              Watch a data particle traverse each mathematical stage of the LoanPredict AI
              pipeline. Values shown are from the real backend analysis for the current applicant.
            </p>
          </div>

          <MLPipeline analysis={analysis} />
        </section>

        {/* ════════════════════════════════════════════════════
            SECTIONS 08 & 09 — PREDICTION RESULT & DECISION
            (only shown when a prediction exists)
            ════════════════════════════════════════════════════ */}
        {hasPrediction && (
          <section className="mlviz-section" aria-labelledby="s08-title">
            <div className="section-head">
              <span className="section-num">08 &amp; 09 — REAL PREDICTION &amp; DECISION</span>
              <h2 id="s08-title" className="section-title">Final Model Prediction</h2>
              <p className="section-desc">
                Derived directly from the Logistic Regression inference. No values are hard-coded —
                all figures are read from <code>sessionStorage (loanPredictMLAnalysis)</code>.
              </p>
            </div>

            {/* 4 metric cards */}
            <div className="prediction-summary-grid">
              <div className={`decision-result-card ${analysis.approved ? 'approved' : 'rejected'}`}>
                <div className="card-top-label">MODEL DECISION</div>
                <div className="decision-verdict-row">
                  <span className="material-symbols-outlined verdict-icon"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {analysis.approved ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="verdict-text">{analysis.prediction.toUpperCase()}</span>
                </div>
                <div className="decision-rule-text">
                  P({analysis.probability.toFixed(4)}) {analysis.probability >= analysis.threshold ? '≥' : '<'} θ({analysis.threshold.toFixed(2)})
                </div>
              </div>

              <div className="stat-metric-card">
                <span className="metric-label">CALCULATED PROBABILITY</span>
                <div className="metric-val mono">{(analysis.probability * 100).toFixed(2)}%</div>
                <div className="metric-sub">P(Approval | Features)</div>
              </div>

              <div className="stat-metric-card">
                <span className="metric-label">LINEAR SCORE (z)</span>
                <div className="metric-val mono">
                  {analysis.linear_score >= 0 ? '+' : ''}{analysis.linear_score.toFixed(4)}
                </div>
                <div className="metric-sub">z = β₀ + Σ(βᵢ · xᵢ)</div>
              </div>

              <div className="stat-metric-card">
                <span className="metric-label">DECISION THRESHOLD (θ)</span>
                <div className="metric-val mono">{analysis.threshold.toFixed(2)}</div>
                <div className="metric-sub">Separating Hyperplane Cutoff</div>
              </div>
            </div>

            {/* Feature contributions table — built from real backend arrays */}
            {featureContributions.length > 0 && (
              <div className="contrib-section-card">
                <div className="contrib-head">
                  <div>
                    <h3 className="contrib-title">Feature Contributions to Score z</h3>
                    <p className="contrib-desc">
                      Each feature's preprocessed value multiplied by its trained coefficient (βᵢ · xᵢ).
                    </p>
                  </div>
                  <div className="intercept-badge mono">
                    β₀ = {analysis.intercept >= 0 ? '+' : ''}{analysis.intercept?.toFixed(4)}
                  </div>
                </div>

                <div className="contrib-table" role="table" aria-label="Feature contributions">
                  <div className="contrib-th" role="row">
                    <span role="columnheader">Feature</span>
                    <span role="columnheader">Raw Input</span>
                    <span role="columnheader">Preprocessed</span>
                    <span role="columnheader">Coefficient (β)</span>
                    <span role="columnheader">Contribution</span>
                  </div>
                  {featureContributions.map((c, i) => (
                    <div key={i} className="contrib-tr" role="row">
                      <span className="feat-name" role="cell">{c.feature.replace(/_/g, ' ')}</span>
                      <span className="feat-raw" role="cell">{String(c.raw_value)}</span>
                      <span className="feat-proc mono" role="cell">{Number(c.processed_value).toFixed(4)}</span>
                      <span className="feat-coef mono" role="cell">
                        {c.coefficient >= 0 ? '+' : ''}{Number(c.coefficient).toFixed(4)}
                      </span>
                      <span
                        className={`feat-contrib mono ${c.contribution >= 0 ? 'pos' : 'neg'}`}
                        role="cell"
                      >
                        {c.contribution >= 0 ? '+' : ''}{Number(c.contribution).toFixed(4)}
                      </span>
                    </div>
                  ))}
                  {/* Intercept row */}
                  <div className="contrib-tr intercept-row" role="row">
                    <span className="feat-name" role="cell">Intercept (β₀)</span>
                    <span role="cell">—</span>
                    <span role="cell">—</span>
                    <span role="cell">—</span>
                    <span
                      className={`feat-contrib mono ${analysis.intercept >= 0 ? 'pos' : 'neg'}`}
                      role="cell"
                    >
                      {analysis.intercept >= 0 ? '+' : ''}{analysis.intercept?.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="contrib-sum-row">
                  <span>Sum of all contributions + intercept</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    = {analysis.linear_score >= 0 ? '+' : ''}{(analysis.linear_score_exact ?? analysis.linear_score).toFixed(4)}
                    &nbsp;(= z)
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            SECTION 10 — NO PREDICTION EMPTY STATE
            (shown inline as part of sections 05-09 above)
            The page is still complete without a prediction — the
            empty state inside section 05/06 handles this.
            ════════════════════════════════════════════════════ */}

      </div>{/* /mlviz-content */}

      {/* ── Disclaimer ── */}
      <div className="mlviz-disclaimer">
        <span className="material-symbols-outlined" style={{ fontSize: '16px', flexShrink: 0 }}>info</span>
        This page is an academic Machine Learning demonstration. All values come from the real trained
        Logistic Regression model. Not a financial or banking decision system.
        Semester Mini Project 2026–2027.
      </div>

      {/* ════════════════════════════════════════════════════
          SCOPED STYLES
          ════════════════════════════════════════════════════ */}
      <style>{`
        /* ── Page shell ── */
        .mlviz-page {
          flex: 1;
          background: var(--bg);
          padding-bottom: 0;
        }

        /* ── Hero band ── */
        .mlviz-hero {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 36px 24px 30px;
        }
        .mlviz-hero-inner {
          max-width: var(--max-w);
          margin: 0 auto;
        }
        .hero-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }
        .mlviz-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .mlviz-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16a34a;
          animation: pulse-dot 2s ease infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(1.35); }
        }
        .mlviz-title {
          font-size: clamp(1.5rem, 2.8vw, 2.2rem);
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }
        .mlviz-subtitle {
          font-size: 0.98rem;
          color: var(--text-muted);
          max-width: 800px;
          line-height: 1.6;
        }

        /* ── Content column ── */
        .mlviz-content {
          max-width: var(--max-w);
          margin: 32px auto 0;
          padding: 0 24px 56px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Section card ── */
        .mlviz-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-sm);
          padding: 28px;
        }
        .section-head { margin-bottom: 20px; }
        .section-num {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .section-title {
          font-size: clamp(1.15rem, 2vw, 1.4rem);
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }
        .section-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.55;
        }

        /* ── Scatter viz card ── */
        .viz-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
        }
        .viz-loading, .viz-error {
          padding: 40px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .spin-icon {
          animation: viz-spin 1s linear infinite;
          font-size: 30px;
          color: var(--primary);
        }
        @keyframes viz-spin { to { transform: rotate(360deg); } }

        /* ── Scatter SVG ── */
        .scatter-container { width: 100%; overflow-x: auto; }
        .scatter-svg {
          width: 100%;
          height: auto;
          min-width: 520px;
          display: block;
        }
        .axis-tick-text  { font-family: 'Inter', sans-serif; font-size: 10px; fill: var(--text-muted); }
        .axis-title-text { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600; fill: var(--text); }
        .historical-point {
          cursor: pointer;
          transition: opacity 0.12s;
        }
        .historical-point:hover { opacity: 1 !important; }
        .applicant-pulse-ring {
          animation: applicant-ring 1.8s ease-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes applicant-ring {
          0%   { r: 10px; opacity: 0.9; }
          100% { r: 22px; opacity: 0; }
        }

        /* ── Legend bar ── */
        .scatter-legend-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .legend-items { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .legend-item  { display: inline-flex; align-items: center; gap: 6px; }
        .dot          { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
        .dot-approved  { background: #16a34a; }
        .dot-rejected  { background: #dc2626; }
        .dot-applicant { background: #2563eb; }
        .highlight-legend { font-weight: 700; color: var(--primary); }
        .scatter-sample-info { font-size: 0.74rem; color: var(--text-light); }

        /* ── Point detail panel ── */
        .point-detail-card {
          margin-top: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px 16px;
          animation: fade-in 0.18s ease;
        }
        @keyframes fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .point-detail-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
        }
        .point-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 6px 16px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .badge-mini {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .badge-mini.approved { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge-mini.rejected { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

        /* ── Feature concepts grid ── */
        .feature-concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .concept-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
        }
        .concept-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .concept-card h4 { font-size: 0.9rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .concept-card p  { font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; }

        /* ── Accuracy notice ── */
        .accuracy-notice-callout {
          background: #f8fafc;
          border-left: 4px solid var(--primary);
          border-radius: 0 6px 6px 0;
          padding: 12px 16px;
          font-size: 0.82rem;
          color: var(--text);
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.5;
        }

        /* ── Math explainer card (Sec 03) ── */
        .math-explainer-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .math-flow {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .flow-step {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex-shrink: 0;
        }
        .step-tag  { font-size: 0.63rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }
        .step-name { font-size: 0.78rem; font-weight: 600; color: var(--text); white-space: nowrap; }
        .flow-arrow { color: var(--text-light); font-weight: 700; flex-shrink: 0; font-size: 1.1rem; }
        .formula-display-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .formula-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          border-top: 3px solid var(--primary);
        }
        .formula-label { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 7px; }
        .formula-math  { font-size: 1.05rem; font-weight: 700; color: var(--primary); font-family: monospace; margin-bottom: 7px; }
        .formula-desc  { font-size: 0.77rem; color: var(--text-muted); line-height: 1.45; }
        .math-summary-text { font-size: 0.85rem; color: var(--text-muted); line-height: 1.55; }
        .inline-link { color: var(--primary); text-decoration: underline; }

        /* ── Sigmoid panel (Sec 04) ── */
        .sigmoid-panel {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sig-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .sig-title-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.07em;
          display: block;
          margin-bottom: 3px;
        }
        .sig-title { font-size: 1.05rem; font-weight: 700; color: var(--text); }
        .sig-formula-badge {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--primary);
          font-family: monospace;
        }
        .sig-svg-wrap { width: 100%; overflow-x: auto; }
        .sig-svg {
          width: 100%;
          height: auto;
          min-width: 460px;
          display: block;
        }
        .sig-footer-explanation {
          margin-top: 4px;
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.55;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        /* ── No prediction state ── */
        .no-prediction-card {
          padding: 48px 24px;
          text-align: center;
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .no-pred-icon { font-size: 48px; color: var(--text-light); }
        .no-prediction-card h3 { font-size: 1.05rem; font-weight: 700; color: var(--text); }
        .no-prediction-card p  { font-size: 0.85rem; color: var(--text-muted); max-width: 400px; line-height: 1.55; }
        .btn-start-prediction {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: #fff;
          padding: 10px 20px;
          border-radius: var(--radius);
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
          margin-top: 8px;
          transition: background 0.15s;
        }
        .btn-start-prediction:hover { background: var(--primary-dark); }

        /* ── Applicant overview grid ── */
        .applicant-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .applicant-summary-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
        }
        .app-card-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .app-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 14px;
          margin-bottom: 14px;
        }
        .app-datum { display: flex; flex-direction: column; gap: 2px; }
        .datum-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .datum-value { font-size: 0.88rem; font-weight: 700; color: var(--text); }
        .app-sync-footer {
          font-size: 0.72rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 5px;
          border-top: 1px solid var(--border);
          padding-top: 10px;
        }
        .applicant-position-note-card {
          background: var(--primary-light);
          border: 1px solid rgba(37,99,235,0.18);
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .note-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .note-head h4 { font-size: 0.95rem; font-weight: 700; color: var(--text); }
        .applicant-position-note-card p {
          font-size: 0.83rem;
          color: var(--text-muted);
          line-height: 1.55;
        }
        .ml-notice-box {
          background: var(--surface);
          border-left: 3px solid var(--primary);
          padding: 10px 12px;
          font-size: 0.78rem;
          color: var(--text);
          border-radius: 0 6px 6px 0;
          line-height: 1.45;
        }
        .btn-outline-sm {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 14px;
          border: 1.5px solid var(--primary);
          color: var(--primary);
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          background: transparent;
          text-decoration: none;
          transition: background 0.13s;
        }
        .btn-outline-sm:hover { background: var(--primary-light); }

        /* ── Pipeline card (Sec 07) ── */
        .pipeline-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
        }
        .pipeline-track {
          display: flex;
          gap: 10px;
          min-width: 860px;
        }
        .pipeline-step {
          flex: 1;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 8px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .pipeline-step.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          background: var(--primary-light);
        }
        .pipeline-step.passed {
          border-color: #bbf7d0;
          background: #f9fffe;
        }
        .pipeline-step.step-approved { border-color: #16a34a; background: #f0fdf4; }
        .pipeline-step.step-rejected { border-color: #dc2626; background: #fef2f2; }
        .step-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--surface-alt);
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          position: relative;
          flex-shrink: 0;
        }
        .pipeline-step.active  .step-circle { background: var(--primary); border-color: var(--primary); color: #fff; }
        .pipeline-step.passed  .step-circle { background: #f0fdf4; border-color: #16a34a; color: #16a34a; }
        .data-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          top: -2px;
          right: -2px;
          box-shadow: 0 0 5px var(--primary);
        }
        .step-title { font-size: 0.73rem; font-weight: 700; color: var(--text); line-height: 1.3; }
        .step-desc  { font-size: 0.68rem; color: var(--text-muted); line-height: 1.35; }
        .step-val   {
          font-size: 0.69rem;
          font-weight: 600;
          color: var(--primary);
          background: rgba(37,99,235,0.08);
          padding: 2px 5px;
          border-radius: 3px;
          width: fit-content;
          word-break: break-word;
          font-family: monospace;
        }
        .pipeline-note {
          margin-top: 12px;
          font-size: 0.76rem;
          color: var(--text-light);
          text-align: center;
        }

        /* ── Prediction result grid ── */
        .prediction-summary-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 14px;
          margin-bottom: 22px;
        }
        .decision-result-card {
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 1px solid var(--border);
        }
        .decision-result-card.approved { background: #f0fdf4; border-top: 4px solid #16a34a; }
        .decision-result-card.rejected { background: #fef2f2; border-top: 4px solid #dc2626; }
        .card-top-label {
          font-size: 0.67rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .decision-verdict-row { display: flex; align-items: center; gap: 8px; }
        .decision-result-card.approved .verdict-icon,
        .decision-result-card.approved .verdict-text { color: #16a34a; }
        .decision-result-card.rejected .verdict-icon,
        .decision-result-card.rejected .verdict-text { color: #dc2626; }
        .verdict-icon { font-size: 28px; }
        .verdict-text { font-size: 1.4rem; font-weight: 900; letter-spacing: -0.02em; }
        .decision-rule-text { font-size: 0.72rem; color: var(--text-muted); }
        .stat-metric-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-label { font-size: 0.64rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text-muted); }
        .metric-val   { font-size: 1.35rem; font-weight: 800; color: var(--primary); font-family: monospace; }
        .metric-sub   { font-size: 0.7rem; color: var(--text-light); }

        /* ── Feature contributions table ── */
        .contrib-section-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
        }
        .contrib-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }
        .contrib-title { font-size: 0.95rem; font-weight: 700; color: var(--text); }
        .contrib-desc  { font-size: 0.76rem; color: var(--text-muted); margin-top: 3px; }
        .intercept-badge {
          font-size: 0.78rem;
          font-weight: 700;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px 10px;
          border-radius: 6px;
          color: var(--text);
          font-family: monospace;
        }
        .contrib-table { display: flex; flex-direction: column; overflow-x: auto; }
        .contrib-th, .contrib-tr {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.2fr 1.2fr;
          gap: 8px;
          align-items: center;
          padding: 7px 10px;
          font-size: 0.78rem;
          min-width: 560px;
        }
        .contrib-th {
          font-size: 0.67rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--surface);
          border-radius: 6px;
          margin-bottom: 2px;
        }
        .contrib-tr { border-bottom: 1px solid var(--border); }
        .contrib-tr:last-child { border-bottom: none; }
        .intercept-row { background: var(--primary-light); border-radius: 4px; }
        .feat-name   { font-weight: 600; color: var(--text); }
        .feat-raw    { color: var(--text-muted); }
        .feat-proc   { color: var(--text); }
        .feat-coef   { color: var(--text-muted); }
        .feat-contrib { font-weight: 700; }
        .feat-contrib.pos { color: #16a34a; }
        .feat-contrib.neg { color: #dc2626; }
        .mono { font-family: 'Courier New', Courier, monospace; }
        .contrib-sum-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 10px 0;
          border-top: 1px solid var(--border);
          margin-top: 6px;
          font-size: 0.82rem;
          color: var(--text-muted);
          flex-wrap: wrap;
          gap: 8px;
        }

        /* ── Disclaimer bar ── */
        .mlviz-disclaimer {
          background: var(--surface-alt);
          border-top: 1px solid var(--border);
          padding: 14px 24px;
          font-size: 0.78rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 7px;
          max-width: 100%;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .applicant-overview-grid  { grid-template-columns: 1fr; }
          .prediction-summary-grid  { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .mlviz-section            { padding: 18px 14px; }
          .prediction-summary-grid  { grid-template-columns: 1fr; }
          .app-data-grid            { grid-template-columns: 1fr; }
          .mlviz-content            { padding: 0 14px 48px; }
        }
      `}</style>
    </main>
  );
}
