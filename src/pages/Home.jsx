import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Pipeline Steps Data ── */
const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Applicant Input',
    short: 'Raw applicant information such as income, loan amount, credit history, and property area.',
    tag: 'Raw Data',
    formula: 'x ∈ ℝ¹¹ (Categorical + Numerical)',
    details: 'Collects 11 real-world financial attributes including applicant and co-applicant incomes in ₹/month, loan request amount in ₹, and credit history score.'
  },
  {
    step: '02',
    title: 'Feature Encoding',
    short: 'Categorical values are converted into numerical representations.',
    tag: 'Categorical Mapping',
    formula: 'Gender ∈ {0,1}, Property_Area ∈ {0,1,2}',
    details: 'Binary encoding applied to Gender, Married, Education, and Self_Employed. Multi-class ordinal indexing applied to Dependents and Property_Area.'
  },
  {
    step: '03',
    title: 'StandardScaler',
    short: 'Numerical features are standardized before entering the model.',
    tag: 'Preprocessing',
    formula: 'z = (x - μ) / σ',
    details: 'Features (ApplicantIncome, CoapplicantIncome, LoanAmount, Loan_Amount_Term, Credit_History) are scaled using training set mean μ and standard deviation σ.'
  },
  {
    step: '04',
    title: 'Logistic Regression',
    short: 'The trained classifier calculates the linear decision score.',
    tag: 'Linear Combination',
    formula: 'z = β₀ + Σ βᵢxᵢ',
    details: 'Dot product between trained weights β and preprocessed feature vector x plus intercept bias β₀ produces the unconstrained log-odds score z.'
  },
  {
    step: '05',
    title: 'Probability',
    short: 'The sigmoid function converts the score into a probability.',
    tag: 'Activation',
    formula: 'σ(z) = 1 / (1 + e⁻ᶻ)',
    details: 'Maps linear decision score z ∈ (-∞, +∞) strictly onto the interval (0, 1), representing calibrated confidence P(Approved | x).'
  },
  {
    step: '06',
    title: 'Final Decision',
    short: 'The probability is compared with the 0.50 threshold.',
    tag: 'Classification',
    formula: 'P ≥ 0.50 → Approved, else Rejected',
    details: 'Binary decision threshold θ = 0.50 separates high-risk applicants from low-risk approvals with strict mathematical explainability.'
  }
];

/* ── Interactive Sigmoid SVG Visualizer ── */
function SigmoidInteractiveVisualizer() {
  const [sliderZ, setSliderZ] = useState(0.96);

  // Sigmoid formula: σ(z) = 1 / (1 + exp(-z))
  const prob = 1 / (1 + Math.exp(-sliderZ));
  const isApproved = prob >= 0.5;

  // SVG coordinate mapping
  const zToX = (z) => 40 + ((z + 5) / 10) * 420;
  const pToY = (p) => 220 - p * 190;

  // Generate smooth sigmoid path
  const points = [];
  for (let zVal = -5; zVal <= 5; zVal += 0.2) {
    const pVal = 1 / (1 + Math.exp(-zVal));
    points.push(`${zToX(zVal).toFixed(1)},${pToY(pVal).toFixed(1)}`);
  }
  const sigmoidPathD = `M ${points.join(' L ')}`;

  const currentX = zToX(sliderZ);
  const currentY = pToY(prob);

  return (
    <div className="sigmoid-viz-container">
      <div className="sigmoid-top-bar">
        <div className="sigmoid-indicator">
          <span className="sig-badge">Interactive Equation</span>
          <span className="sig-formula-text">σ(z) = 1 / (1 + e<sup>−z</sup>)</span>
        </div>
        <div className="sigmoid-controls">
          <label htmlFor="z-slider" className="slider-label">
            Simulate Linear Score <span className="mono bold">(z = {sliderZ >= 0 ? '+' : ''}{sliderZ.toFixed(2)})</span>:
          </label>
          <input
            id="z-slider"
            type="range"
            min="-4"
            max="4"
            step="0.1"
            value={sliderZ}
            onChange={(e) => setSliderZ(parseFloat(e.target.value))}
            className="z-range-slider"
            aria-label="Adjust linear score z"
          />
        </div>
      </div>

      <div className="sigmoid-svg-wrap">
        <svg viewBox="0 0 500 250" className="sigmoid-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="sigGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="curveAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(37,99,235,0.18)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.0)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="40" y1="220" x2="470" y2="220" stroke="var(--border)" strokeWidth="1.5" />
          <line x1="40" y1="125" x2="470" y2="125" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="40" y1="30" x2="470" y2="30" stroke="var(--border)" strokeDasharray="2 2" strokeWidth="1" />
          <line x1="250" y1="20" x2="250" y2="230" stroke="var(--border)" strokeWidth="1.5" />

          {/* Axis Labels */}
          <text x="15" y="34" className="svg-axis-text">1.0</text>
          <text x="10" y="129" className="svg-axis-text">0.50</text>
          <text x="15" y="224" className="svg-axis-text">0.0</text>
          <text x="470" y="235" className="svg-axis-text bold">+z</text>
          <text x="32" y="235" className="svg-axis-text bold">-z</text>
          <text x="245" y="244" className="svg-axis-text">z = 0</text>

          {/* Threshold marker line */}
          <line x1="40" y1="125" x2="470" y2="125" stroke="#2563eb" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="5 5" />
          <rect x="290" y="112" width="165" height="24" rx="4" fill="var(--surface)" stroke="var(--border)" />
          <text x="298" y="128" fill="var(--primary)" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
            Decision Threshold θ = 0.50
          </text>

          {/* Area under curve */}
          <path d={`${sigmoidPathD} L 460,220 L 40,220 Z`} fill="url(#curveAreaGrad)" />

          {/* Sigmoid Curve */}
          <path d={sigmoidPathD} fill="none" stroke="url(#sigGradient)" strokeWidth="3.5" strokeLinecap="round" />

          {/* Threshold 0.50 center dot */}
          <circle cx="250" cy="125" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />

          {/* Current animated interactive point */}
          <line x1={currentX} y1={currentY} x2={currentX} y2="220" stroke={isApproved ? '#16a34a' : '#dc2626'} strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={currentX} cy={currentY} r="7" fill={isApproved ? '#16a34a' : '#dc2626'} stroke="#ffffff" strokeWidth="2.5" className="svg-pulse-point" />
        </svg>
      </div>

      <div className="sigmoid-footer-stats">
        <div className="sig-stat-box">
          <span className="sig-stat-lbl">Linear Score (z)</span>
          <span className="sig-stat-val mono">{sliderZ >= 0 ? '+' : ''}{sliderZ.toFixed(2)}</span>
        </div>
        <div className="sig-stat-arrow">→</div>
        <div className="sig-stat-box">
          <span className="sig-stat-lbl">Calibrated Probability σ(z)</span>
          <span className="sig-stat-val mono" style={{ color: isApproved ? '#16a34a' : '#dc2626' }}>
            {(prob * 100).toFixed(2)}%
          </span>
        </div>
        <div className="sig-stat-arrow">→</div>
        <div className={`sig-verdict-tag ${isApproved ? 'verdict-pass' : 'verdict-fail'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {isApproved ? 'check_circle' : 'cancel'}
          </span>
          {isApproved ? 'APPROVED (P ≥ 0.50)' : 'REJECTED (P < 0.50)'}
        </div>
      </div>
    </div>
  );
}
/* ─── Main Home Component ─── */
export default function Home() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  return (
    <main className="home-page">
      {/* Dynamic Background Pattern */}
      <div className="home-bg-canvas" aria-hidden="true">
        <div className="bg-grid-pattern" />
        <div className="bg-glow-orb orb-1" />
        <div className="bg-glow-orb orb-2" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="hero-section" aria-labelledby="hero-main-title">
        <div className="hero-container">

          {/* Left Column: Headline & Action Buttons */}
          <div className="hero-left-col">
            <div className="hero-badge" role="note">
              <span className="hero-badge-pulse" aria-hidden="true" />
              <span>MACHINE LEARNING PROJECT</span>
            </div>

            <h1 id="hero-main-title" className="hero-headline">
              Loan Approval <br />
              <span className="hero-title-accent">Prediction</span>
              <span className="hero-subline">Using Logistic Regression</span>
            </h1>

            <p className="hero-tagline">
              Predict loan approval probability and see exactly how Logistic Regression
              transforms applicant data into a transparent, mathematically verifiable final decision.
            </p>

            <div className="hero-actions">
              <button
                id="btn-hero-predict"
                className="btn-primary-hero"
                onClick={() => navigate('/prediction')}
                aria-label="Start a loan approval prediction"
              >
                <span>Start Prediction</span>
                <span className="material-symbols-outlined btn-arrow">arrow_forward</span>
              </button>

              <button
                id="btn-hero-liveml"
                className="btn-secondary-hero"
                onClick={() => navigate('/live-ml')}
                aria-label="Explore the Live ML pipeline breakdown"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>play_circle</span>
                <span>Explore Live ML</span>
              </button>
            </div>

            <div className="hero-academic-bar">
              <span className="material-symbols-outlined academic-icon">school</span>
              <span>Semester Mini Project 2026–2027 · Academic ML Architecture</span>
            </div>
          </div>

          {/* Right Column: Live Model Interactive Pipeline Preview */}
          <div className="hero-right-col">
            <div className="model-pipeline-card">
              
              {/* Card Header Status */}
              <div className="card-top-status">
                <div className="brand-spec">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>
                    model_training
                  </span>
                  <div>
                    <div className="spec-title">LOGISTIC REGRESSION</div>
                    <div className="spec-sub">scikit-learn Engine · liblinear</div>
                  </div>
                </div>
                <div className="ready-indicator">
                  <span className="live-dot" />
                  <span>READY</span>
                </div>
              </div>

              {/* Animated Pipeline Flow Diagram */}
              <div className="pipeline-flow-board">
                <div className="particle-track" aria-hidden="true">
                  <div className="data-particle" />
                </div>

                <div className="flow-node">
                  <span className="node-badge">01</span>
                  <div className="node-info">
                    <span className="node-title">Applicant Data</span>
                    <span className="node-meta">11 Features (Income, Loan, Credit)</span>
                  </div>
                </div>

                <div className="flow-connector">
                  <span className="material-symbols-outlined conn-arrow">keyboard_double_arrow_down</span>
                </div>

                <div className="flow-node">
                  <span className="node-badge">02</span>
                  <div className="node-info">
                    <span className="node-title">Encoding & Preprocessing</span>
                    <span className="node-meta">StandardScaler: z = (x - μ) / σ</span>
                  </div>
                </div>

                <div className="flow-connector">
                  <span className="material-symbols-outlined conn-arrow">keyboard_double_arrow_down</span>
                </div>

                <div className="flow-node highlight-node">
                  <span className="node-badge node-badge-accent">03</span>
                  <div className="node-info">
                    <span className="node-title">Linear Decision Score</span>
                    <span className="node-formula">z = β₀ + Σ βᵢxᵢ</span>
                  </div>
                </div>

                <div className="flow-connector">
                  <span className="material-symbols-outlined conn-arrow">keyboard_double_arrow_down</span>
                </div>

                <div className="flow-node">
                  <span className="node-badge">04</span>
                  <div className="node-info">
                    <span className="node-title">Sigmoid Activation</span>
                    <span className="node-formula">σ(z) = 1 / (1 + e⁻ᶻ)</span>
                  </div>
                </div>

                <div className="flow-connector">
                  <span className="material-symbols-outlined conn-arrow">keyboard_double_arrow_down</span>
                </div>

                <div className="flow-node terminal-node">
                  <span className="node-badge node-badge-green">05</span>
                  <div className="node-info">
                    <span className="node-title">Final Verdict</span>
                    <span className="node-meta">Decision Rule: P ≥ 0.50 Threshold</span>
                  </div>
                </div>
              </div>

              {/* Model Specifications Grid */}
              <div className="card-specs-grid">
                <div className="spec-col">
                  <span className="spec-lbl">INPUT FEATURES</span>
                  <span className="spec-data bold">11</span>
                </div>
                <div className="spec-col">
                  <span className="spec-lbl">SOLVER</span>
                  <span className="spec-data bold">L-BFGS</span>
                </div>
                <div className="spec-col">
                  <span className="spec-lbl">THRESHOLD</span>
                  <span className="spec-data bold mono">0.50</span>
                </div>
                <div className="spec-col">
                  <span className="spec-lbl">STATUS</span>
                  <span className="spec-data text-success bold">ONLINE</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — INTERACTIVE ML PIPELINE: "How LoanPredict AI Thinks"
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-padding pipeline-section" aria-labelledby="sec-pipeline-heading">
        <div className="section-header-wrap">
          <span className="section-kicker">STEP-BY-STEP EXPLAINABILITY</span>
          <h2 id="sec-pipeline-heading" className="section-title">How LoanPredict AI Thinks</h2>
          <p className="section-subtext">
            Follow the journey from applicant data to the final loan decision. Select or hover any step to see its mathematical mechanics.
          </p>
        </div>

        <div className="pipeline-interactive-wrap">
          {/* Step Selector Pills / Cards */}
          <div className="pipeline-grid" role="tablist">
            {PIPELINE_STEPS.map((item, index) => {
              const isSelected = activeStep === index;
              return (
                <button
                  key={item.step}
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={0}
                  className={`pipeline-step-card ${isSelected ? 'active-step' : ''}`}
                  onClick={() => setActiveStep(index)}
                  onMouseEnter={() => setActiveStep(index)}
                  onFocus={() => setActiveStep(index)}
                >
                  <div className="step-card-top">
                    <span className="step-pill">{item.step}</span>
                    <span className="step-tag-mini">{item.tag}</span>
                  </div>
                  <h3 className="step-card-title">{item.title}</h3>
                  <p className="step-card-short">{item.short}</p>
                  <div className="step-card-footer">
                    <code className="step-code-preview">{item.formula}</code>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Deep-Dive Inspector */}
          <div className="active-step-inspector" aria-live="polite">
            <div className="inspector-left">
              <span className="insp-tag">ACTIVE MECHANIC · STEP {PIPELINE_STEPS[activeStep].step}</span>
              <h4 className="insp-title">{PIPELINE_STEPS[activeStep].title}</h4>
              <p className="insp-desc">{PIPELINE_STEPS[activeStep].details}</p>
            </div>
            <div className="inspector-right">
              <span className="insp-math-label">Mathematical Formula:</span>
              <div className="insp-formula-box mono">
                {PIPELINE_STEPS[activeStep].formula}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — INTERACTIVE FORMULA & SIGMOID VISUALIZATION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-padding math-section" aria-labelledby="sec-math-heading">
        <div className="section-header-wrap">
          <span className="section-kicker">MATHEMATICAL ARCHITECTURE</span>
          <h2 id="sec-math-heading" className="section-title">Inside the Logistic Regression Model</h2>
          <p className="section-subtext">
            Logistic Regression combines linear log-odds modeling with nonlinear sigmoid activation to bound predictions strictly between 0 and 1.
          </p>
        </div>

        {/* Formula Pipeline Pathway */}
        <div className="math-flow-banner">
          <div className="math-flow-step">
            <span className="mflow-num">1</span>
            <span className="mflow-title">Features (x)</span>
            <span className="mflow-sub">11 applicant inputs</span>
          </div>
          <span className="mflow-arrow">→</span>
          <div className="math-flow-step">
            <span className="mflow-num">2</span>
            <span className="mflow-title">Learned Weights (β)</span>
            <span className="mflow-sub">Trained coefficients</span>
          </div>
          <span className="mflow-arrow">→</span>
          <div className="math-flow-step highlight-mflow">
            <span className="mflow-num">3</span>
            <span className="mflow-title">Linear Score (z)</span>
            <span className="mflow-formula">z = β₀ + Σβᵢxᵢ</span>
          </div>
          <span className="mflow-arrow">→</span>
          <div className="math-flow-step highlight-mflow">
            <span className="mflow-num">4</span>
            <span className="mflow-title">Sigmoid σ(z)</span>
            <span className="mflow-formula">1 / (1 + e⁻ᶻ)</span>
          </div>
          <span className="mflow-arrow">→</span>
          <div className="math-flow-step">
            <span className="mflow-num">5</span>
            <span className="mflow-title">Decision</span>
            <span className="mflow-sub">P ≥ 0.50 Threshold</span>
          </div>
        </div>

        {/* Interactive Sigmoid Graph Component */}
        <SigmoidInteractiveVisualizer />
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — PROJECT HIGHLIGHTS
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-padding highlights-section" aria-labelledby="sec-highlights-heading">
        <div className="section-header-wrap">
          <span className="section-kicker">CORE ATTRIBUTES</span>
          <h2 id="sec-highlights-heading" className="section-title">Engineered for Transparency</h2>
          <p className="section-subtext">
            Designed to bridge the gap between black-box predictions and interpretable machine learning.
          </p>
        </div>

        <div className="highlights-grid">
          <div className="highlight-card">
            <div className="hcard-icon-wrap">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <h3 className="hcard-title">Real Machine Learning</h3>
            <p className="hcard-body">
              Powered by a genuine scikit-learn Logistic Regression classifier trained on real historical loan application data.
            </p>
          </div>

          <div className="highlight-card">
            <div className="hcard-icon-wrap">
              <span className="material-symbols-outlined">visibility</span>
            </div>
            <h3 className="hcard-title">100% Explainable</h3>
            <p className="hcard-body">
              Inspect preprocessing, feature coefficients, weighted contributions, linear log-odds, and decision boundary comparisons.
            </p>
          </div>

          <div className="highlight-card">
            <div className="hcard-icon-wrap">
              <span className="material-symbols-outlined">sync_alt</span>
            </div>
            <h3 className="hcard-title">Strictly Consistent</h3>
            <p className="hcard-body">
              The Prediction page and Live ML breakdown share the identical model instance, weights, and preprocessing pipeline.
            </p>
          </div>

          <div className="highlight-card">
            <div className="hcard-icon-wrap">
              <span className="material-symbols-outlined">school</span>
            </div>
            <h3 className="hcard-title">Academic Insight</h3>
            <p className="hcard-body">
              Crafted as an academic showcase demonstrating how statistical classification is implemented in real-world software engineering.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — LIVE ML PREVIEW (DEMONSTRATION)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-padding liveml-preview-section" aria-labelledby="sec-preview-heading">
        <div className="preview-container">
          <div className="preview-left">
            <span className="section-kicker">LIVE INSPECTOR EXPERIENCE</span>
            <h2 id="sec-preview-heading" className="preview-title">
              Don't Just Get the Answer.<br />
              <span className="hero-title-accent">See How the Model Thinks.</span>
            </h2>
            <p className="preview-desc">
              Every loan prediction generates a complete 10-step mathematical audit trail.
              Follow your application through raw normalization, StandardScaler z-scoring,
              feature contribution breakdown, and sigmoid activation.
            </p>

            <button
              id="btn-preview-liveml"
              className="btn-primary-hero preview-cta"
              onClick={() => navigate('/live-ml')}
              aria-label="Navigate to Live ML page"
            >
              <span>Explore Live ML</span>
              <span className="material-symbols-outlined btn-arrow">arrow_forward</span>
            </button>
          </div>

          <div className="preview-right">
            <div className="demonstration-card">
              <div className="demo-header">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                  analytics
                </span>
                <span className="demo-header-title">Architectural Demonstration</span>
                <span className="demo-badge">EDUCATIONAL PREVIEW</span>
              </div>

              <div className="demo-pipeline-list">
                <div className="demo-stage">
                  <div className="demo-stage-tag">INPUT</div>
                  <div className="demo-stage-content">
                    <span className="demo-stage-title">Applicant Data</span>
                    <span className="demo-stage-sub">e.g., ₹50,000 income · ₹5,00,000 loan · Good Credit</span>
                  </div>
                </div>

                <div className="demo-divider-arrow">↓</div>

                <div className="demo-stage">
                  <div className="demo-stage-tag">PREPROCESSING</div>
                  <div className="demo-stage-content">
                    <span className="demo-stage-title">StandardScaler Normalization</span>
                    <span className="demo-stage-sub">divide by 1,000 to model units (500.0) → z-scaling</span>
                  </div>
                </div>

                <div className="demo-divider-arrow">↓</div>

                <div className="demo-stage">
                  <div className="demo-stage-tag">LOGISTIC REGRESSION</div>
                  <div className="demo-stage-content">
                    <span className="demo-stage-title">Linear Combination</span>
                    <span className="demo-stage-sub">z = β₀ + Σ(βᵢ × xᵢ) feature weights</span>
                  </div>
                </div>

                <div className="demo-divider-arrow">↓</div>

                <div className="demo-stage">
                  <div className="demo-stage-tag">PROBABILITY</div>
                  <div className="demo-stage-content">
                    <span className="demo-stage-title">Sigmoid Activation</span>
                    <span className="demo-stage-sub">σ(z) = 1 / (1 + e⁻ᶻ) bounded probability</span>
                  </div>
                </div>

                <div className="demo-divider-arrow">↓</div>

                <div className="demo-stage terminal-stage">
                  <div className="demo-stage-tag demo-tag-green">DECISION</div>
                  <div className="demo-stage-content">
                    <span className="demo-stage-title">Threshold Evaluation</span>
                    <span className="demo-stage-sub">Compare with 0.50 → Approved or Rejected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — FINAL CTA
          ══════════════════════════════════════════════════════════════════ */}
      <section className="section-padding final-cta-section" aria-labelledby="sec-final-cta-heading">
        <div className="final-cta-card">
          <div className="final-cta-badge">EXPERIENCE IT YOURSELF</div>
          <h2 id="sec-final-cta-heading" className="final-cta-title">Ready to test the model?</h2>
          <p className="final-cta-sub">
            Enter applicant information and see how Logistic Regression evaluates the application in real-time.
          </p>
          <button
            id="btn-final-predict"
            className="btn-primary-hero btn-large-cta"
            onClick={() => navigate('/prediction')}
            aria-label="Start a loan approval prediction now"
          >
            <span>Start Prediction</span>
            <span className="material-symbols-outlined btn-arrow">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* ─── Modern Component Styling ─── */}
      <style>{`
        /* ── Page Root & Ambient Background ── */
        .home-page {
          flex: 1;
          position: relative;
          background: var(--bg);
          overflow-x: hidden;
        }

        .home-bg-canvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .bg-grid-pattern {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(rgba(37,99,235,0.065) 1px, transparent 1px),
            linear-gradient(to right, rgba(226,230,243,0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(226,230,243,0.3) 1px, transparent 1px);
          background-size: 28px 28px, 112px 112px, 112px 112px;
          opacity: 0.85;
        }

        .bg-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 70%);
          top: -100px;
          right: -100px;
        }
        .orb-2 {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0) 70%);
          bottom: 15%;
          left: -150px;
        }

        /* ── Reusable Layout Classes ── */
        .section-padding {
          position: relative;
          z-index: 1;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 72px 24px;
        }

        .section-header-wrap {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 48px;
        }

        .section-kicker {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--primary);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .section-title {
          font-size: clamp(1.8rem, 2.8vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.025em;
          color: var(--text);
          line-height: 1.25;
          margin-bottom: 12px;
        }

        .section-subtext {
          font-size: 0.98rem;
          color: var(--text-muted);
          line-height: 1.65;
        }

        /* ── SECTION 1: HERO ── */
        .hero-section {
          position: relative;
          z-index: 1;
          max-width: var(--max-w);
          margin: 0 auto;
          padding: 60px 24px 70px;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 52px;
          align-items: center;
        }

        .hero-left-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 6px 14px;
          background: var(--primary-light);
          border: 1px solid rgba(37,99,235,0.22);
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--primary);
          width: fit-content;
        }

        .hero-badge-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 0 0 rgba(37,99,235,0.7);
          animation: badge-pulse-ring 2s infinite cubic-bezier(0.66, 0, 0, 1);
        }

        @keyframes badge-pulse-ring {
          to {
            box-shadow: 0 0 0 8px rgba(37,99,235,0);
          }
        }

        .hero-headline {
          font-size: clamp(2.3rem, 4.2vw, 3.4rem);
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -0.035em;
          color: var(--text);
        }

        .hero-title-accent {
          color: var(--primary);
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subline {
          display: block;
          font-size: clamp(1.2rem, 2.2vw, 1.8rem);
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: -0.02em;
          margin-top: 6px;
        }

        .hero-tagline {
          font-size: 1.05rem;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 530px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .btn-primary-hero {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--primary);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 0.94rem;
          font-weight: 700;
          border-radius: var(--radius);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37,99,235,0.28);
          transition: all 0.18s ease;
        }

        .btn-primary-hero:hover {
          background: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.36);
        }
        .btn-primary-hero:hover .btn-arrow {
          transform: translateX(3px);
        }
        .btn-primary-hero:active {
          transform: translateY(0);
        }

        .btn-arrow {
          font-size: 18px;
          transition: transform 0.15s ease;
        }

        .btn-secondary-hero {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          background: var(--surface);
          color: var(--primary);
          font-family: 'Inter', sans-serif;
          font-size: 0.94rem;
          font-weight: 600;
          border-radius: var(--radius);
          border: 1.5px solid var(--border);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all 0.18s ease;
        }

        .btn-secondary-hero:hover {
          background: var(--primary-light);
          border-color: rgba(37,99,235,0.35);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.12);
        }
        .btn-secondary-hero:active {
          transform: translateY(0);
        }

        .hero-academic-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-light);
          margin-top: 4px;
        }
        .academic-icon {
          font-size: 17px;
          color: var(--primary);
        }

        /* ── HERO RIGHT: Live Model Pipeline Card ── */
        .model-pipeline-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 12px 36px rgba(37,99,235,0.08), 0 2px 8px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-top-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .brand-spec {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .spec-title {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--text);
        }
        .spec-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .ready-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #16a34a;
          animation: pulse-dot 1.8s infinite ease-in-out;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        /* Pipeline Visual Nodes & Animated Particle Track */
        .pipeline-flow-board {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 4px;
        }

        .particle-track {
          position: absolute;
          left: 20px;
          top: 14px;
          bottom: 14px;
          width: 2px;
          background: rgba(37,99,235,0.14);
          pointer-events: none;
        }

        .data-particle {
          position: absolute;
          left: -4px;
          top: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 10px rgba(37,99,235,0.8);
          animation: particle-flow 4.2s infinite ease-in-out;
        }

        @keyframes particle-flow {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 98%; opacity: 0; }
        }

        .flow-node {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }
        .flow-node:hover {
          border-color: rgba(37,99,235,0.3);
          transform: translateX(3px);
          background: #ffffff;
        }

        .highlight-node {
          border-color: rgba(37,99,235,0.35);
          background: #fbfdff;
        }

        .node-badge {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #e2e8f0;
          color: var(--text-muted);
          font-size: 0.68rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .node-badge-accent {
          background: var(--primary-light);
          color: var(--primary);
        }
        .node-badge-green {
          background: #f0fdf4;
          color: #16a34a;
        }

        .node-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .node-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text);
        }
        .node-meta {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .node-formula {
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: var(--primary);
        }

        .flow-connector {
          display: flex;
          justify-content: flex-start;
          padding-left: 14px;
          color: rgba(37,99,235,0.45);
          height: 12px;
        }
        .conn-arrow {
          font-size: 14px;
          line-height: 12px;
        }

        .card-specs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }
        .spec-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: var(--surface-alt);
          border-radius: 6px;
          padding: 8px 4px;
        }
        .spec-lbl {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-light);
        }
        .spec-data {
          font-size: 0.85rem;
          color: var(--text);
        }
        .text-success { color: #16a34a; }

        /* ── SECTION 2: INTERACTIVE PIPELINE ── */
        .pipeline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 24px;
        }

        .pipeline-step-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: left;
          cursor: pointer;
          transition: all 0.22s ease;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pipeline-step-card:hover, .pipeline-step-card:focus {
          border-color: rgba(37,99,235,0.4);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.09);
          outline: none;
        }

        .pipeline-step-card.active-step {
          border-color: var(--primary);
          background: #fbfdff;
          box-shadow: 0 8px 24px rgba(37,99,235,0.12);
        }

        .step-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .step-pill {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--primary);
          background: var(--primary-light);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .step-tag-mini {
          font-size: 0.68rem;
          color: var(--text-light);
          font-weight: 600;
          text-transform: uppercase;
        }

        .step-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }
        .step-card-short {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.5;
          flex: 1;
        }
        .step-card-footer {
          padding-top: 8px;
          border-top: 1px dashed var(--border);
        }
        .step-code-preview {
          font-size: 0.74rem;
          font-family: 'Courier New', monospace;
          color: var(--primary);
        }

        .active-step-inspector {
          background: var(--surface);
          border: 1px solid var(--border);
          border-left: 4px solid var(--primary);
          border-radius: 10px;
          padding: 22px 26px;
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          align-items: center;
          box-shadow: var(--shadow-sm);
        }
        .insp-tag {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--primary);
        }
        .insp-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text);
          margin: 4px 0 6px;
        }
        .insp-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .insp-math-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-light);
          display: block;
          margin-bottom: 6px;
        }
        .insp-formula-box {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--primary);
        }

        /* ── SECTION 3: FORMULA & SIGMOID VISUALIZER ── */
        .math-flow-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px 24px;
          margin-bottom: 32px;
          box-shadow: var(--shadow-sm);
          flex-wrap: wrap;
          gap: 14px;
        }

        .math-flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .mflow-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--surface-alt);
          border: 1px solid var(--border);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .mflow-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
        }
        .mflow-sub {
          font-size: 0.72rem;
          color: var(--text-light);
        }
        .mflow-formula {
          font-size: 0.76rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: var(--primary);
        }
        .highlight-mflow .mflow-num {
          background: var(--primary-light);
          color: var(--primary);
          border-color: rgba(37,99,235,0.3);
        }
        .mflow-arrow {
          font-size: 1.2rem;
          color: var(--text-light);
          font-weight: 300;
        }

        .sigmoid-viz-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 8px 32px rgba(37,99,235,0.06);
        }

        .sigmoid-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .sigmoid-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sig-badge {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 4px;
          background: var(--primary-light);
          color: var(--primary);
        }
        .sig-formula-text {
          font-family: 'Courier New', monospace;
          font-size: 0.96rem;
          font-weight: 700;
          color: var(--text);
        }

        .sigmoid-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .slider-label {
          font-size: 0.84rem;
          color: var(--text-muted);
        }
        .z-range-slider {
          accent-color: var(--primary);
          cursor: pointer;
          width: 150px;
        }

        .sigmoid-svg-wrap {
          margin: 20px 0;
        }
        .sigmoid-svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .svg-axis-text {
          font-size: 11px;
          fill: var(--text-muted);
          font-family: 'Inter', sans-serif;
        }
        .svg-pulse-point {
          animation: pulse-ring 1.8s infinite ease-in-out;
        }
        @keyframes pulse-ring {
          0%, 100% { r: 7px; }
          50% { r: 9px; }
        }

        .sigmoid-footer-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
          padding-top: 18px;
          border-top: 1px solid var(--border);
        }
        .sig-stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sig-stat-lbl {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-light);
        }
        .sig-stat-val {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text);
        }
        .sig-stat-arrow {
          font-size: 1.2rem;
          color: var(--text-light);
        }
        .sig-verdict-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .verdict-pass {
          background: #f0fdf4;
          color: #16a34a;
          border: 1.5px solid #bbf7d0;
        }
        .verdict-fail {
          background: #fef2f2;
          color: #dc2626;
          border: 1.5px solid #fecaca;
        }

        /* ── SECTION 4: HIGHLIGHTS ── */
        .highlights-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .highlight-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .highlight-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 28px rgba(37,99,235,0.08);
          border-color: rgba(37,99,235,0.3);
        }

        .hcard-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hcard-icon-wrap .material-symbols-outlined {
          font-size: 24px;
        }

        .hcard-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text);
        }
        .hcard-body {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.6;
        }

        /* ── SECTION 5: LIVE ML PREVIEW ── */
        .liveml-preview-section {
          padding-top: 40px;
          padding-bottom: 72px;
        }

        .preview-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 44px 40px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
          box-shadow: 0 8px 32px rgba(37,99,235,0.06);
        }

        .preview-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .preview-title {
          font-size: clamp(1.8rem, 2.8vw, 2.2rem);
          font-weight: 900;
          line-height: 1.22;
          color: var(--text);
          letter-spacing: -0.025em;
        }
        .preview-desc {
          font-size: 0.98rem;
          color: var(--text-muted);
          line-height: 1.7;
        }
        .preview-cta {
          margin-top: 8px;
          width: fit-content;
        }

        .demonstration-card {
          background: var(--surface-alt);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .demo-header-title {
          font-size: 0.84rem;
          font-weight: 800;
          color: var(--text);
          flex: 1;
        }
        .demo-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          background: #e2e8f0;
          color: var(--text-muted);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .demo-pipeline-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .demo-stage {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .demo-stage-tag {
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          background: var(--primary-light);
          color: var(--primary);
          padding: 3px 7px;
          border-radius: 4px;
          width: 95px;
          text-align: center;
          flex-shrink: 0;
        }
        .demo-tag-green {
          background: #f0fdf4;
          color: #16a34a;
        }
        .demo-stage-content {
          display: flex;
          flex-direction: column;
        }
        .demo-stage-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text);
        }
        .demo-stage-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .demo-divider-arrow {
          text-align: center;
          font-size: 11px;
          color: var(--text-light);
          line-height: 10px;
        }

        /* ── SECTION 6: FINAL CTA ── */
        .final-cta-section {
          padding-top: 20px;
          padding-bottom: 90px;
        }

        .final-cta-card {
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
          color: #ffffff;
          border-radius: 20px;
          padding: 60px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          box-shadow: 0 16px 40px rgba(37,99,235,0.22);
        }

        .final-cta-badge {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.25);
          padding: 4px 12px;
          border-radius: 999px;
        }

        .final-cta-title {
          font-size: clamp(2rem, 3.4vw, 2.7rem);
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .final-cta-sub {
          font-size: 1.05rem;
          color: rgba(255,255,255,0.85);
          max-width: 580px;
          line-height: 1.65;
        }

        .btn-large-cta {
          background: #ffffff;
          color: var(--primary);
          font-size: 1rem;
          padding: 14px 32px;
          border-radius: 10px;
          margin-top: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .btn-large-cta:hover {
          background: #f8fafc;
          color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.22);
        }

        /* ── Typography & Math Utils ── */
        .bold { font-weight: 700; }
        .mono { font-family: 'Courier New', Courier, monospace; }

        /* ── Responsive Adaptations ── */
        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .pipeline-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .highlights-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .preview-container {
            grid-template-columns: 1fr;
            gap: 36px;
          }
        }

        @media (max-width: 768px) {
          .section-padding {
            padding: 48px 16px;
          }
          .hero-section {
            padding: 40px 16px 52px;
          }
          .pipeline-grid {
            grid-template-columns: 1fr;
          }
          .active-step-inspector {
            grid-template-columns: 1fr;
          }
          .math-flow-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .mflow-arrow {
            transform: rotate(90deg);
            align-self: center;
          }
          .highlights-grid {
            grid-template-columns: 1fr;
          }
          .preview-container {
            padding: 28px 20px;
          }
          .final-cta-card {
            padding: 44px 20px;
          }
          .hero-actions {
            flex-direction: column;
            width: 100%;
          }
          .btn-primary-hero, .btn-secondary-hero {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .data-particle, .hero-badge-pulse, .live-dot, .svg-pulse-point {
            animation: none !important;
          }
          .pipeline-step-card, .btn-primary-hero, .btn-secondary-hero, .highlight-card {
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}
