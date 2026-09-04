import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'loanPredictMLAnalysis';
const TRAINING_DATA_URL = 'http://localhost:5000/training-data';

/* ── Helper to load stored prediction analysis ── */
function loadStoredAnalysis() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.prediction && parsed.probability != null && parsed.feature_names) {
        return parsed;
      }
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT: Historical Dataset Scatter Visualization (Native SVG)
   ══════════════════════════════════════════════════════════════════ */
function TrainingScatterPlot({ dataset, applicantPoint, onSelectPoint, selectedPoint }) {
  // Graph Dimensions
  const svgWidth = 700;
  const svgHeight = 380;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 55;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Domain limits
  // X: ApplicantIncome (₹) -> 0 to 20,000 (typical range, cap max for clean scaling)
  // Y: LoanAmount (model units / thousands) -> 0 to 450
  const minX = 0;
  const maxX = 18000;
  const minY = 0;
  const maxY = 420;

  const scaleX = (val) => padLeft + (Math.min(maxX, Math.max(minX, val)) / maxX) * chartW;
  const scaleY = (val) => padTop + chartH - (Math.min(maxY, Math.max(minY, val)) / maxY) * chartH;

  // X ticks: 0, 3k, 6k, 9k, 12k, 15k, 18k
  const xTicks = [0, 3000, 6000, 9000, 12000, 15000, 18000];
  // Y ticks: 0, 70, 140, 210, 280, 350, 420
  const yTicks = [0, 70, 140, 210, 280, 350, 420];

  return (
    <div className="scatter-container">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="scatter-svg" preserveAspectRatio="xMidYMid meet">
        {/* Background grid */}
        {xTicks.map((tick) => (
          <line
            key={`x-${tick}`}
            x1={scaleX(tick)}
            y1={padTop}
            x2={scaleX(tick)}
            y2={padTop + chartH}
            stroke="var(--border)"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
        ))}

        {yTicks.map((tick) => (
          <line
            key={`y-${tick}`}
            x1={padLeft}
            y1={scaleY(tick)}
            x2={padLeft + chartW}
            y2={scaleY(tick)}
            stroke="var(--border)"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#94a3b8" strokeWidth="1.5" />

        {/* Tick labels */}
        {xTicks.map((tick) => (
          <text
            key={`xtick-${tick}`}
            x={scaleX(tick)}
            y={padTop + chartH + 18}
            className="axis-tick-text"
            textAnchor="middle"
          >
            ₹{(tick / 1000).toFixed(0)}k
          </text>
        ))}

        {yTicks.map((tick) => (
          <text
            key={`ytick-${tick}`}
            x={padLeft - 10}
            y={scaleY(tick) + 4}
            className="axis-tick-text"
            textAnchor="end"
          >
            {tick}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={padLeft + chartW / 2}
          y={svgHeight - 10}
          className="axis-title-text"
          textAnchor="middle"
        >
          Applicant Monthly Income (₹)
        </text>

        <text
          x={-(padTop + chartH / 2)}
          y={16}
          transform="rotate(-90)"
          className="axis-title-text"
          textAnchor="middle"
        >
          Loan Amount (Model Units = ₹ Thousands)
        </text>

        {/* Historical Data points */}
        {dataset.map((pt, idx) => {
          const cx = scaleX(pt.ApplicantIncome);
          const cy = scaleY(pt.LoanAmount);
          const isSelected = selectedPoint === pt;
          const color = pt.approved ? '#16a34a' : '#dc2626';

          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={isSelected ? 6 : 3.8}
              fill={color}
              opacity={isSelected ? 1 : 0.65}
              stroke={isSelected ? '#ffffff' : 'none'}
              strokeWidth={isSelected ? 2 : 0}
              className="historical-point"
              onClick={() => onSelectPoint(pt)}
              role="button"
              tabIndex={0}
              aria-label={`Historical application: Income ₹${pt.ApplicantIncome}, Loan ${pt.LoanAmount}, ${pt.Loan_Status}`}
            />
          );
        })}

        {/* NEW APPLICANT POINT (Highlighted) */}
        {applicantPoint && (
          <g className="applicant-point-group">
            {/* Pulsing indicator ring */}
            <circle
              cx={scaleX(applicantPoint.ApplicantIncome)}
              cy={scaleY(applicantPoint.LoanAmount)}
              r="14"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              className="applicant-pulse-ring"
            />
            {/* Core applicant dot */}
            <circle
              cx={scaleX(applicantPoint.ApplicantIncome)}
              cy={scaleY(applicantPoint.LoanAmount)}
              r="7"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            {/* Label callout */}
            <rect
              x={scaleX(applicantPoint.ApplicantIncome) + 12}
              y={scaleY(applicantPoint.LoanAmount) - 28}
              width="142"
              height="26"
              rx="4"
              fill="#0f172a"
              opacity="0.92"
            />
            <text
              x={scaleX(applicantPoint.ApplicantIncome) + 20}
              y={scaleY(applicantPoint.LoanAmount) - 11}
              fill="#ffffff"
              fontSize="11"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              ★ YOUR APPLICATION
            </text>
          </g>
        )}
      </svg>

      {/* Legend & Stats banner */}
      <div className="scatter-legend-bar">
        <div className="legend-items">
          <span className="legend-item">
            <span className="dot dot-approved" /> Historical Approved ({dataset.filter(d=>d.approved).length})
          </span>
          <span className="legend-item">
            <span className="dot dot-rejected" /> Historical Rejected ({dataset.filter(d=>!d.approved).length})
          </span>
          {applicantPoint && (
            <span className="legend-item highlight-legend">
              <span className="dot dot-applicant" /> Your Application (₹{applicantPoint.ApplicantIncome.toLocaleString('en-IN')}, {applicantPoint.LoanAmount.toFixed(1)}k)
            </span>
          )}
        </div>
        <div className="scatter-sample-info">
          Total dataset rows plotted: <strong>{dataset.length}</strong> (source: <code>loan_data.csv</code>)
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT: Dedicated Mathematical Sigmoid Visualizer (Section 4)
   ══════════════════════════════════════════════════════════════════ */
function SigmoidCurveSection({ applicantScore, applicantProb, isApproved }) {
  const z = applicantScore != null ? applicantScore : 0.0;
  const p = applicantProb != null ? applicantProb : 0.5;

  const svgW = 600;
  const svgH = 260;
  const zToX = (val) => 40 + ((val + 6) / 12) * 520;
  const pToY = (prob) => 220 - prob * 180;

  const points = [];
  for (let zVal = -6; zVal <= 6; zVal += 0.25) {
    const probVal = 1 / (1 + Math.exp(-zVal));
    points.push(`${zToX(zVal).toFixed(1)},${pToY(probVal).toFixed(1)}`);
  }
  const pathD = `M ${points.join(' L ')}`;

  const currentX = zToX(Math.min(6, Math.max(-6, z)));
  const currentY = pToY(Math.min(1, Math.max(0, p)));

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
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="sig-svg" preserveAspectRatio="xMidYMid meet">
          {/* Threshold horizontal line at 0.50 */}
          <line x1="40" y1={pToY(0.5)} x2="560" y2={pToY(0.5)} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x="565" y={pToY(0.5) + 4} fill="#2563eb" fontSize="11" fontWeight="700">θ = 0.50</text>

          {/* Center axis at z = 0 */}
          <line x1={zToX(0)} y1="30" x2={zToX(0)} y2="230" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="40" y1="220" x2="560" y2="220" stroke="var(--border)" strokeWidth="1.5" />

          {/* Labels */}
          <text x="20" y={pToY(1.0) + 4} className="axis-tick-text">1.0</text>
          <text x="14" y={pToY(0.5) + 4} className="axis-tick-text">0.50</text>
          <text x="20" y={pToY(0.0) + 4} className="axis-tick-text">0.0</text>

          <text x={zToX(-5)} y="238" className="axis-tick-text">-5</text>
          <text x={zToX(0)} y="238" className="axis-tick-text" textAnchor="middle">z = 0</text>
          <text x={zToX(5)} y="238" className="axis-tick-text">+5</text>

          {/* Smooth Sigmoid curve */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />

          {/* Center threshold point */}
          <circle cx={zToX(0)} cy={pToY(0.5)} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />

          {/* Highlight applicant point if available */}
          {applicantScore != null && (
            <g>
              <line x1={currentX} y1={currentY} x2={currentX} y2="220" stroke={isApproved ? '#16a34a' : '#dc2626'} strokeDasharray="3 3" strokeWidth="1.5" />
              <circle cx={currentX} cy={currentY} r="7" fill={isApproved ? '#16a34a' : '#dc2626'} stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      <div className="sig-footer-explanation">
        <p>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>info</span>
          <strong>Mathematical Sigmoid Function:</strong> Converts the unbounded real-valued linear score <code>z ∈ (-∞, +∞)</code> into a calibrated probability strictly bounded between <code>0.0</code> and <code>1.0</code>.
          {applicantScore != null ? (
            <span> Your score <strong>z = {applicantScore >= 0 ? '+' : ''}{applicantScore.toFixed(4)}</strong> evaluates to <strong>{(applicantProb * 100).toFixed(2)}%</strong> probability.</span>
          ) : (
            <span> When a prediction is made, your applicant score will be projected onto this curve.</span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT: ML Visualization (repurposing LiveAnalysis)
   ══════════════════════════════════════════════════════════════════ */
export default function LiveAnalysis() {
  // State
  const [analysis, setAnalysis] = useState(() => loadStoredAnalysis());
  const [trainingData, setTrainingData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activePipelineStage, setActivePipelineStage] = useState(0);

  // Synchronize sessionStorage
  useEffect(() => {
    const handleStorage = () => {
      setAnalysis(loadStoredAnalysis());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePipelineStage((prev) => (prev + 1) % 9);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Fetch real dataset from backend
  useEffect(() => {
    let isMounted = true;
    fetch(TRAINING_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch dataset from backend');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data && Array.isArray(data.data)) {
            setTrainingData(data.data);
          } else {
            setDataError('No valid data received from training data endpoint.');
          }
          setLoadingData(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setDataError(err.message || 'Error connecting to dataset API');
          setLoadingData(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Format financial values
  const formatINR = (val) => {
    if (val == null) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  const PIPELINE_STEPS = [
    { title: '01. Historical Data', desc: 'Dataset with approved & rejected cases', value: '101 rows in loan_data.csv' },
    { title: '02. Preprocessing', desc: 'Missing value imputation & label encoding', value: 'Standard Scaler + One-Hot' },
    { title: '03. Feature Vector', desc: '11 standardized numerical features', value: analysis ? `${analysis.feature_names?.length || 11} features` : '11 features' },
    { title: '04. Logistic Regression', desc: 'Dot product with learned weights β', value: 'z = β₀ + Σ(βᵢ · xᵢ)' },
    { title: '05. Decision Score', desc: 'Unbounded linear log-odds scalar', value: analysis ? `z = ${analysis.linear_score >= 0 ? '+' : ''}${analysis.linear_score.toFixed(4)}` : 'z score' },
    { title: '06. Sigmoid Activation', desc: 'Nonlinear probability mapping', value: 'P = 1 / (1 + e⁻ᶻ)' },
    { title: '07. Probability', desc: 'Confidence score bounded in [0, 1]', value: analysis ? `${(analysis.probability * 100).toFixed(2)}%` : 'P(y=1|x)' },
    { title: '08. Threshold Evaluation', desc: 'Binary decision boundary rule', value: 'θ = 0.50' },
    { title: '09. Final Decision', desc: 'Executive loan grant verdict', value: analysis ? analysis.prediction.toUpperCase() : 'Verdict' }
  ];

  const applicantPoint = useMemo(() => {
    if (!analysis) return null;
    const rawInc = Number(analysis.applicant?.ApplicantIncome ?? analysis.raw_values?.[6] ?? 0);
    const modelLoan = Number(analysis.model_loan_amount ?? (analysis.raw_loan_amount ? analysis.raw_loan_amount / 1000 : 128));
    return {
      ApplicantIncome: rawInc,
      LoanAmount: modelLoan,
      approved: Boolean(analysis.approved)
    };
  }, [analysis]);

  const hasPrediction = Boolean(analysis && analysis.prediction);
  return (
    <main className="mlviz-page">
      {/* ── Top Page Hero ── */}
      <div className="mlviz-hero">
        <div className="mlviz-hero-inner">
          <div className="hero-top-row">
            <div className="mlviz-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>insights</span>
              HOW THE MODEL THINKS
            </div>
            <div className="mlviz-status-tag">
              <span className="status-dot" />
              LOGISTIC REGRESSION · MODEL READY
            </div>
          </div>
          <h1 className="mlviz-title">From Historical Loan Data to Your Prediction</h1>
          <p className="mlviz-subtitle">
            Explore how LoanPredict AI learns patterns from genuine historical applications, transforms raw financial features,
            and produces a mathematically explainable decision using Logistic Regression.
          </p>
        </div>
      </div>

      <div className="mlviz-content">
        {/* ── SECTION 1: Training Data ── */}
        <section className="mlviz-section">
          <div className="section-head">
            <span className="section-num">01 — TRAINING DATA</span>
            <h2 className="section-title">Where the Model Learns</h2>
            <p className="section-desc">
              Before making predictions, Logistic Regression learns from historical loan applications.
              The scatter plot below renders <strong>real, unmodified rows</strong> from <code>backend/data/loan_data.csv</code>.
            </p>
          </div>

          <div className="viz-card">
            {loadingData ? (
              <div className="viz-loading">
                <span className="material-symbols-outlined spin-icon">progress_activity</span>
                <span>Loading real dataset points from backend/data/loan_data.csv...</span>
              </div>
            ) : dataError ? (
              <div className="viz-error">
                <span className="material-symbols-outlined">error</span>
                <span>{dataError}</span>
              </div>
            ) : (
              <>
                <TrainingScatterPlot
                  dataset={trainingData}
                  applicantPoint={applicantPoint}
                  selectedPoint={selectedPoint}
                  onSelectPoint={(pt) => setSelectedPoint(pt)}
                />
                {selectedPoint && (
                  <div className="point-detail-card">
                    <div className="point-detail-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                      Selected Historical Record Detail
                    </div>
                    <div className="point-detail-grid">
                      <div><strong>Income:</strong> ₹{selectedPoint.ApplicantIncome?.toLocaleString('en-IN')}</div>
                      <div><strong>Co-Applicant Income:</strong> ₹{selectedPoint.CoapplicantIncome?.toLocaleString('en-IN')}</div>
                      <div><strong>Loan Amount:</strong> ₹{(selectedPoint.LoanAmount * 1000)?.toLocaleString('en-IN')} ({selectedPoint.LoanAmount}k)</div>
                      <div><strong>Credit History:</strong> {selectedPoint.Credit_History === 1 ? '1.0 (Meets guidelines)' : '0.0 (Defaults)'}</div>
                      <div><strong>Property Area:</strong> {selectedPoint.Property_Area}</div>
                      <div>
                        <strong>Historical Status:</strong>{' '}
                        <span className={`badge-mini ${selectedPoint.approved ? 'approved' : 'rejected'}`}>
                          {selectedPoint.Loan_Status === 'Y' ? 'APPROVED' : 'REJECTED'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── SECTION 2: Data Patterns ── */}
        <section className="mlviz-section">
          <div className="section-head">
            <span className="section-num">02 — DATA PATTERNS</span>
            <h2 className="section-title">What the Data Shows</h2>
            <p className="section-desc">
              Logistic Regression analyzes correlations between applicant attributes and approval probability.
              While individual pairs show general tendencies, decisions rely on the complete multi-dimensional feature space.
            </p>
          </div>

          <div className="feature-concepts-grid">
            <div className="concept-card">
              <div className="concept-icon-box"><span className="material-symbols-outlined">payments</span></div>
              <h4>Applicant Income</h4>
              <p>Primary indicator of direct repayment capacity. Higher income broadens debt servicing capacity.</p>
            </div>
            <div className="concept-card">
              <div className="concept-icon-box"><span className="material-symbols-outlined">group</span></div>
              <h4>Co-applicant Income</h4>
              <p>Secondary household income buffer that lowers risk when substantial.</p>
            </div>
            <div className="concept-card">
              <div className="concept-icon-box"><span className="material-symbols-outlined">account_balance</span></div>
              <h4>Loan Amount</h4>
              <p>Requested principal in thousands. Higher loan amounts require corresponding income backing.</p>
            </div>
            <div className="concept-card">
              <div className="concept-icon-box"><span className="material-symbols-outlined">calendar_month</span></div>
              <h4>Loan Term</h4>
              <p>Tenure duration (typically 360 months). Affects monthly amortization liability.</p>
            </div>
            <div className="concept-card">
              <div className="concept-icon-box"><span className="material-symbols-outlined">verified</span></div>
              <h4>Credit History</h4>
              <p>Strongest statistical predictor in the model. A credit history of 1 significantly elevates log-odds.</p>
            </div>
            <div className="concept-card">
              <div className="concept-icon-box"><span className="material-symbols-outlined">location_city</span></div>
              <h4>Property Area</h4>
              <p>Semiurban, Urban, or Rural zoning with distinct regional risk multipliers.</p>
            </div>
          </div>

          <div className="accuracy-notice-callout">
            <span className="material-symbols-outlined">lightbulb</span>
            <div>
              <strong>Multi-dimensional Reality:</strong> The model does not make its decision from the 2D graph alone.
              It uses the complete 11-feature vector and the trained preprocessing pipeline to determine the separation hyperplane.
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Logistic Regression Learning ── */}
        <section className="mlviz-section">
          <div className="section-head">
            <span className="section-num">03 — MODEL LEARNING</span>
            <h2 className="section-title">How Logistic Regression Learns</h2>
            <p className="section-desc">
              During training, maximum likelihood estimation finds optimal weights β that separate classes.
            </p>
          </div>

          <div className="math-explainer-card">
            <div className="math-flow">
              <div className="flow-step">
                <span className="step-tag">Step 1</span>
                <span className="step-name">Historical Data</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="step-tag">Step 2</span>
                <span className="step-name">Feature Processing</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="step-tag">Step 3</span>
                <span className="step-name">Weighted Features</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="step-tag">Step 4</span>
                <span className="step-name">Linear Decision Score (z)</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="step-tag">Step 5</span>
                <span className="step-name">Sigmoid Probability P(y=1)</span>
              </div>
            </div>

            <div className="formula-display-grid">
              <div className="formula-box">
                <div className="formula-label">1. LINEAR COMBINATION (LOG-ODDS)</div>
                <div className="formula-math mono">z = β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ</div>
                <div className="formula-desc">Computes the linear decision score across the scaled feature vector.</div>
              </div>
              <div className="formula-box">
                <div className="formula-label">2. SIGMOID LOGISTIC FUNCTION</div>
                <div className="formula-math mono">P(y=1|x) = 1 / (1 + e⁻ᶻ)</div>
                <div className="formula-desc">Converts unbounded linear score z into bounded probability [0, 1].</div>
              </div>
            </div>

            <p className="math-summary-text">
              The model combines the processed features using learned coefficients and converts the resulting score into a probability.
            </p>
          </div>
        </section>

        {/* ── SECTION 4: Sigmoid Visualization ── */}
        <section className="mlviz-section">
          <div className="section-head">
            <span className="section-num">04 — PROBABILITY</span>
            <h2 className="section-title">The Sigmoid Activation Function</h2>
            <p className="section-desc">
              The sigmoid function converts the linear decision score into a probability between 0 and 1.
              Unlike the historical scatter plot, this graph visualizes the pure mathematical activation curve.
            </p>
          </div>

          <SigmoidCurveSection
            applicantScore={analysis?.linear_score}
            applicantProb={analysis?.probability}
            isApproved={analysis?.approved}
          />
        </section>

        {/* ── SECTION 5 & 6: New Applicant Summary & Graph Marker ── */}
        <section className="mlviz-section" id="new-applicant-section">
          <div className="section-head">
            <span className="section-num">05 &amp; 06 — NEW APPLICANT</span>
            <h2 className="section-title">New Applicant Enters the Model</h2>
            <p className="section-desc">
              Your application from the Prediction page enters the exact same preprocessing and Logistic Regression pipeline.
            </p>
          </div>

          {!hasPrediction ? (
            <div className="no-prediction-card">
              <span className="material-symbols-outlined no-pred-icon">person_search</span>
              <h3>No applicant prediction loaded</h3>
              <p>Go to Prediction to evaluate an applicant and project their actual values onto the model visualizer.</p>
              <Link to="/prediction" className="btn-start-prediction">
                Start Prediction <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              </Link>
            </div>
          ) : (
            <div className="applicant-overview-grid">
              <div className="applicant-summary-card">
                <div className="app-card-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>badge</span>
                  New applicant from Prediction page
                </div>
                <div className="app-data-grid">
                  <div className="app-datum">
                    <span className="datum-label">Applicant Income</span>
                    <span className="datum-value">{formatINR(analysis.applicant?.ApplicantIncome ?? analysis.raw_values?.[6])}</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Co-applicant Income</span>
                    <span className="datum-value">{formatINR(analysis.applicant?.CoapplicantIncome ?? analysis.raw_values?.[7])}</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Loan Amount</span>
                    <span className="datum-value">
                      {analysis.raw_loan_amount ? formatINR(analysis.raw_loan_amount) : `₹${(analysis.model_loan_amount * 1000).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Loan Term</span>
                    <span className="datum-value">{analysis.applicant?.Loan_Amount_Term || analysis.raw_values?.[9] || 360} months</span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Credit History</span>
                    <span className="datum-value">
                      {Number(analysis.applicant?.Credit_History ?? analysis.raw_values?.[10]) === 1 ? 'Good (1.0)' : 'Defaults / Poor (0.0)'}
                    </span>
                  </div>
                  <div className="app-datum">
                    <span className="datum-label">Property Area</span>
                    <span className="datum-value">{analysis.applicant?.Property_Area || analysis.raw_values?.[11] || 'Semiurban'}</span>
                  </div>
                </div>
                <div className="app-sync-footer">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#16a34a' }}>check_circle</span>
                  Synchronized from <code>sessionStorage (loanPredictMLAnalysis)</code>
                </div>
              </div>

              <div className="applicant-position-note-card">
                <div className="note-head">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>pin_drop</span>
                  <h4>Projected on Historical Data</h4>
                </div>
                <p>
                  Look at Section 01 above: a pulsing blue marker labeled <strong>★ YOUR APPLICATION</strong> has been dynamically placed
                  at your applicant's coordinates (Income: ₹{applicantPoint.ApplicantIncome.toLocaleString('en-IN')}, Loan: {applicantPoint.LoanAmount.toFixed(1)}k).
                </p>
                <div className="ml-notice-box">
                  This point represents your application on the selected two-feature visualization.
                  The actual Logistic Regression prediction uses the complete feature vector, not only these two dimensions.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 7: Real ML Process Pipeline ── */}
        <section className="mlviz-section">
          <div className="section-head">
            <span className="section-num">07 — REAL ML PROCESS PIPELINE</span>
            <h2 className="section-title">Step-by-Step Data Journey</h2>
            <p className="section-desc">
              Watch a data particle traverse each mathematical stage of the LoanPredict AI pipeline.
            </p>
          </div>

          <div className="pipeline-card">
            <div className="pipeline-track">
              {PIPELINE_STEPS.map((step, idx) => {
                const isActive = activePipelineStage === idx;
                const isPassed = activePipelineStage > idx;
                return (
                  <div key={idx} className={`pipeline-step ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}>
                    <div className="step-circle">
                      {isPassed ? (
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>
                      ) : (
                        idx + 1
                      )}
                      {isActive && <span className="data-particle" />}
                    </div>
                    <div className="step-info">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                      <div className="step-val mono">{step.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 8 & 9: Real Prediction Result & Decision Rule ── */}
        {hasPrediction && (
          <section className="mlviz-section">
            <div className="section-head">
              <span className="section-num">08 &amp; 09 — REAL PREDICTION &amp; DECISION</span>
              <h2 className="section-title">Final Model Prediction</h2>
              <p className="section-desc">
                Derived directly from the verified Logistic Regression inference engine.
              </p>
            </div>

            <div className="prediction-summary-grid">
              <div className={`decision-result-card ${analysis.approved ? 'approved' : 'rejected'}`}>
                <div className="card-top-label">MODEL DECISION</div>
                <div className="decision-verdict-row">
                  <span className="material-symbols-outlined verdict-icon">
                    {analysis.approved ? 'check_circle' : 'cancel'}
                  </span>
                  <span className="verdict-text">{analysis.prediction.toUpperCase()}</span>
                </div>
                <div className="decision-rule-text">
                  Probability ({analysis.probability.toFixed(4)}) {analysis.probability >= analysis.threshold ? '≥' : '<'} Threshold ({analysis.threshold.toFixed(2)})
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

            {/* Feature Contributions Breakdown */}
            {analysis.feature_contributions && analysis.feature_contributions.length > 0 && (
              <div className="contrib-section-card">
                <div className="contrib-head">
                  <div>
                    <h3 className="contrib-title">Feature Contributions to Score z</h3>
                    <p className="contrib-desc">Each feature value multiplied by its trained model coefficient.</p>
                  </div>
                  <div className="intercept-badge mono">
                    Intercept (β₀) = {analysis.intercept >= 0 ? '+' : ''}{analysis.intercept?.toFixed(4)}
                  </div>
                </div>

                <div className="contrib-table">
                  <div className="contrib-th">
                    <span>Feature Name</span>
                    <span>Raw Input</span>
                    <span>Processed</span>
                    <span>Coefficient (β)</span>
                    <span>Contribution</span>
                  </div>
                  {analysis.feature_contributions.map((c, idx) => (
                    <div key={idx} className="contrib-tr">
                      <span className="feat-name">{c.feature}</span>
                      <span className="feat-raw">{String(c.raw_value)}</span>
                      <span className="feat-proc mono">{c.processed_value.toFixed(4)}</span>
                      <span className="feat-coef mono">{c.coefficient >= 0 ? '+' : ''}{c.coefficient.toFixed(4)}</span>
                      <span className={`feat-contrib mono ${c.contribution >= 0 ? 'pos' : 'neg'}`}>
                        {c.contribution >= 0 ? '+' : ''}{c.contribution.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Scoped CSS ── */}
      <style>{`
        .mlviz-page {
          flex: 1;
          background: var(--bg);
          padding-bottom: 60px;
        }

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
          background: #eff6ff;
          color: var(--primary);
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.75rem;
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
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #16a34a;
          box-shadow: 0 0 0 2px rgba(22,163,74,0.2);
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

        .mlviz-content {
          max-width: var(--max-w);
          margin: 32px auto 0;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .mlviz-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-sm);
          padding: 28px;
        }

        .section-head {
          margin-bottom: 22px;
        }

        .section-num {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--primary);
          margin-bottom: 4px;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }

        .section-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* Scatter card */
        .viz-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
        }

        .viz-loading, .viz-error {
          padding: 48px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .spin-icon {
          animation: spin 1s linear infinite;
          font-size: 32px;
          color: var(--primary);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .scatter-container {
          width: 100%;
          overflow-x: auto;
        }

        .scatter-svg {
          width: 100%;
          height: auto;
          min-width: 540px;
          display: block;
        }

        .axis-tick-text {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          fill: var(--text-muted);
        }

        .axis-title-text {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          fill: var(--text);
        }

        .historical-point {
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }

        .historical-point:hover {
          opacity: 1;
          transform: scale(1.3);
        }

        .applicant-pulse-ring {
          animation: pulseRing 1.8s infinite ease-out;
          transform-origin: center;
        }

        @keyframes pulseRing {
          0% { r: 8px; opacity: 1; }
          100% { r: 24px; opacity: 0; }
        }

        .scatter-legend-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .legend-items {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-approved { background: #16a34a; }
        .dot-rejected { background: #dc2626; }
        .dot-applicant { background: #2563eb; }

        .highlight-legend {
          font-weight: 700;
          color: var(--primary);
        }

        .point-detail-card {
          margin-top: 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px;
        }

        .point-detail-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .point-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px 16px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .badge-mini {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
        }

        .badge-mini.approved {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .badge-mini.rejected {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        /* Feature concepts */
        .feature-concepts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
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

        .concept-card h4 {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 4px;
        }

        .concept-card p {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .accuracy-notice-callout {
          background: #f8fafc;
          border-left: 4px solid var(--primary);
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 0.82rem;
          color: var(--text);
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        /* Math section */
        .math-explainer-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
        }

        .math-flow {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }

        .flow-step {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          white-space: nowrap;
        }

        .step-tag {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
        }

        .step-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text);
        }

        .flow-arrow {
          color: var(--text-light);
          font-weight: 700;
        }

        .formula-display-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 14px;
        }

        .formula-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
        }

        .formula-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .formula-math {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 6px;
        }

        .formula-desc {
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        .math-summary-text {
          font-size: 0.85rem;
          color: var(--text);
          font-weight: 500;
        }

        /* Sigmoid Panel */
        .sigmoid-panel {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
        }

        .sig-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }

        .sig-title-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.07em;
        }

        .sig-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
        }

        .sig-formula-badge {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--primary);
        }

        .sig-svg-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .sig-svg {
          width: 100%;
          height: auto;
          min-width: 480px;
          display: block;
        }

        .sig-footer-explanation {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* Empty state */
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

        .no-pred-icon {
          font-size: 48px;
          color: var(--text-light);
        }

        .no-prediction-card h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
        }

        .no-prediction-card p {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 420px;
        }

        .btn-start-prediction {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: #fff;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
          margin-top: 8px;
          transition: background 0.15s;
        }

        .btn-start-prediction:hover {
          background: var(--primary-dark);
        }

        /* Applicant Section */
        .applicant-overview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .applicant-summary-card, .applicant-position-note-card {
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
          gap: 6px;
          margin-bottom: 14px;
        }

        .app-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 16px;
          margin-bottom: 14px;
        }

        .app-datum {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .datum-label {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .datum-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
        }

        .app-sync-footer {
          font-size: 0.72rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 5px;
          border-top: 1px solid var(--border);
          padding-top: 10px;
        }

        .note-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .note-head h4 {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text);
        }

        .applicant-position-note-card p {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 12px;
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

        /* Pipeline Card */
        .pipeline-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
        }

        .pipeline-track {
          display: flex;
          gap: 14px;
          min-width: 820px;
        }

        .pipeline-step {
          flex: 1;
          background: var(--surface);
          border: 1.5px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .pipeline-step.active {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .pipeline-step.passed {
          border-color: #bbf7d0;
        }

        .step-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--surface-alt);
          border: 1.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          position: relative;
        }

        .pipeline-step.active .step-circle {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }

        .pipeline-step.passed .step-circle {
          background: #f0fdf4;
          border-color: #16a34a;
          color: #16a34a;
        }

        .data-particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
          top: -2px;
          right: -2px;
          box-shadow: 0 0 6px var(--primary);
        }

        .step-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text);
        }

        .step-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .step-val {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--primary);
          background: var(--surface-alt);
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }

        /* Prediction summary */
        .prediction-summary-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .decision-result-card {
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 1px solid var(--border);
        }

        .decision-result-card.approved {
          background: #f0fdf4;
          border-top: 4px solid #16a34a;
        }

        .decision-result-card.rejected {
          background: #fef2f2;
          border-top: 4px solid #dc2626;
        }

        .card-top-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .decision-verdict-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .decision-result-card.approved .verdict-icon,
        .decision-result-card.approved .verdict-text {
          color: #16a34a;
        }

        .decision-result-card.rejected .verdict-icon,
        .decision-result-card.rejected .verdict-text {
          color: #dc2626;
        }

        .verdict-icon {
          font-size: 28px;
        }

        .verdict-text {
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .decision-rule-text {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .stat-metric-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .metric-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--primary);
        }

        .metric-sub {
          font-size: 0.72rem;
          color: var(--text-light);
        }

        /* Contribution Table */
        .contrib-section-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 18px;
        }

        .contrib-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .contrib-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text);
        }

        .contrib-desc {
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        .intercept-badge {
          font-size: 0.78rem;
          font-weight: 700;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 4px 10px;
          border-radius: 6px;
          color: var(--text);
        }

        .contrib-table {
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-x: auto;
        }

        .contrib-th, .contrib-tr {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.2fr 1.2fr;
          gap: 12px;
          align-items: center;
          padding: 8px 12px;
          font-size: 0.78rem;
          min-width: 580px;
        }

        .contrib-th {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--surface);
          border-radius: 6px;
          margin-bottom: 4px;
        }

        .contrib-tr {
          border-bottom: 1px solid var(--border);
        }

        .contrib-tr:last-child {
          border-bottom: none;
        }

        .feat-name {
          font-weight: 600;
          color: var(--text);
        }

        .feat-raw {
          color: var(--text-muted);
        }

        .feat-proc {
          color: var(--text);
        }

        .feat-coef {
          color: var(--text-muted);
        }

        .feat-contrib {
          font-weight: 700;
        }

        .feat-contrib.pos {
          color: #16a34a;
        }

        .feat-contrib.neg {
          color: #dc2626;
        }

        .mono {
          font-family: 'Courier New', Courier, monospace;
        }

        @media (max-width: 900px) {
          .applicant-overview-grid {
            grid-template-columns: 1fr;
          }
          .prediction-summary-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .mlviz-section {
            padding: 18px 14px;
          }
          .prediction-summary-grid {
            grid-template-columns: 1fr;
          }
          .app-data-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
