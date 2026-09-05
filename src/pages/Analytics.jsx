import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const API_URL = API_ENDPOINTS.analytics;

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchAnalytics() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(API_URL);
        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }
        const json = await res.json();
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message.toLowerCase().includes('fetch')
              ? 'Unable to connect to the ML backend. Please make sure the Flask server is running (python backend/app.py).'
              : `Failed to load analytics: ${err.message}`
          );
          setLoading(false);
        }
      }
    }
    fetchAnalytics();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="analytics-page">
      {/* ── Page Header ── */}
      <div className="analytics-head">
        <div className="analytics-head-inner">
          <div className="analytics-badge" role="note">
            <span className="material-symbols-outlined analytics-badge-icon">insights</span>
            Dataset &amp; Model Overview
          </div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">
            Comprehensive empirical metrics, confusion matrix, feature coefficients, and dataset
            distribution derived directly from the trained Logistic Regression pipeline.
          </p>
        </div>
      </div>

      <div className="analytics-content">
        {loading && (
          <div className="analytics-loading">
            <div className="analytics-spinner" />
            <p>Loading real model metrics and dataset statistics…</p>
          </div>
        )}

        {error && (
          <div className="analytics-error-card" role="alert">
            <span className="material-symbols-outlined err-icon">error</span>
            <div className="err-body">
              <h3>Connection Error</h3>
              <p>{error}</p>
              <button className="btn-retry" onClick={() => window.location.reload()}>
                <span className="material-symbols-outlined">refresh</span>
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── 4 KPI Cards ── */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon-wrap icon-blue">
                  <span className="material-symbols-outlined">dataset</span>
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">Dataset Records</span>
                  <span className="kpi-value">{data.dataset.total_records}</span>
                  <span className="kpi-sub">{data.dataset.features_count} model input features</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap icon-green">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">Approval Rate</span>
                  <span className="kpi-value">{(data.dataset.approval_rate * 100).toFixed(1)}%</span>
                  <span className="kpi-sub">{data.dataset.approved_count} Approved / {data.dataset.rejected_count} Rejected</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap icon-purple">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">Model Accuracy</span>
                  <span className="kpi-value">{(data.performance.accuracy * 100).toFixed(2)}%</span>
                  <span className="kpi-sub">{data.performance.evaluation_type}</span>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon-wrap icon-amber">
                  <span className="material-symbols-outlined">equalizer</span>
                </div>
                <div className="kpi-meta">
                  <span className="kpi-label">F1-Score</span>
                  <span className="kpi-value">{(data.performance.f1_score * 100).toFixed(2)}%</span>
                  <span className="kpi-sub">Precision {(data.performance.precision * 100).toFixed(1)}% · Recall {(data.performance.recall * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* ── Middle Row: Confusion Matrix + Target Distribution ── */}
            <div className="dashboard-row-2">
              {/* Confusion Matrix Card */}
              <section className="dash-card">
                <div className="dash-card-header">
                  <span className="material-symbols-outlined card-icon">grid_on</span>
                  <div>
                    <h2 className="dash-card-title">Confusion Matrix</h2>
                    <p className="dash-card-desc">Binary classification outcome breakdown on the loan dataset.</p>
                  </div>
                </div>

                <div className="cm-wrapper">
                  <div className="cm-header-row">
                    <span className="cm-corner-label">Actual \ Predicted</span>
                    <span className="cm-col-label">Pred: Rejected (0)</span>
                    <span className="cm-col-label">Pred: Approved (1)</span>
                  </div>

                  <div className="cm-row">
                    <span className="cm-row-label">Actual: Rejected (0)</span>
                    <div className="cm-cell cm-tn">
                      <span className="cm-cell-tag">True Negative (TN)</span>
                      <span className="cm-cell-val">{data.performance.confusion_matrix.tn}</span>
                      <span className="cm-cell-sub">Correctly Rejected</span>
                    </div>
                    <div className="cm-cell cm-fp">
                      <span className="cm-cell-tag">False Positive (FP)</span>
                      <span className="cm-cell-val">{data.performance.confusion_matrix.fp}</span>
                      <span className="cm-cell-sub">Type I Error</span>
                    </div>
                  </div>

                  <div className="cm-row">
                    <span className="cm-row-label">Actual: Approved (1)</span>
                    <div className="cm-cell cm-fn">
                      <span className="cm-cell-tag">False Negative (FN)</span>
                      <span className="cm-cell-val">{data.performance.confusion_matrix.fn}</span>
                      <span className="cm-cell-sub">Type II Error</span>
                    </div>
                    <div className="cm-cell cm-tp">
                      <span className="cm-cell-tag">True Positive (TP)</span>
                      <span className="cm-cell-val">{data.performance.confusion_matrix.tp}</span>
                      <span className="cm-cell-sub">Correctly Approved</span>
                    </div>
                  </div>
                </div>

                <div className="cm-metrics-summary">
                  <div className="cm-metric-pill">
                    <span className="label">Accuracy</span>
                    <span className="val">{(data.performance.accuracy * 100).toFixed(2)}%</span>
                  </div>
                  <div className="cm-metric-pill">
                    <span className="label">Precision</span>
                    <span className="val">{(data.performance.precision * 100).toFixed(2)}%</span>
                  </div>
                  <div className="cm-metric-pill">
                    <span className="label">Recall</span>
                    <span className="val">{(data.performance.recall * 100).toFixed(2)}%</span>
                  </div>
                  <div className="cm-metric-pill">
                    <span className="label">Specificity</span>
                    <span className="val">
                      {(
                        (data.performance.confusion_matrix.tn /
                          (data.performance.confusion_matrix.tn + data.performance.confusion_matrix.fp)) *
                        100
                      ).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </section>

              {/* Target Distribution Card */}
              <section className="dash-card">
                <div className="dash-card-header">
                  <span className="material-symbols-outlined card-icon">pie_chart</span>
                  <div>
                    <h2 className="dash-card-title">Target Variable Distribution</h2>
                    <p className="dash-card-desc">Ground-truth class balance for Loan_Status (Y vs N).</p>
                  </div>
                </div>

                <div className="dist-bars-wrap">
                  <div className="dist-item">
                    <div className="dist-item-top">
                      <span className="dist-name">Approved (Y)</span>
                      <span className="dist-count">
                        {data.dataset.approved_count} applicants ({(data.dataset.approval_rate * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill fill-approved"
                        style={{ width: `${data.dataset.approval_rate * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="dist-item">
                    <div className="dist-item-top">
                      <span className="dist-name">Rejected (N)</span>
                      <span className="dist-count">
                        {data.dataset.rejected_count} applicants ({((1 - data.dataset.approval_rate) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill fill-rejected"
                        style={{ width: `${(1 - data.dataset.approval_rate) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="dist-notes">
                  <span className="material-symbols-outlined note-icon">info</span>
                  <p>
                    Standard banking credit datasets commonly reflect an 80:20 approval skew.
                    The Logistic Regression pipeline compensates via StandardScaler and balanced feature weights.
                  </p>
                </div>
              </section>
            </div>

            {/* ── Feature Coefficients Section ── */}
            <section className="dash-card full-width-card">
              <div className="dash-card-header">
                <span className="material-symbols-outlined card-icon">balance</span>
                <div>
                  <h2 className="dash-card-title">Learned Logistic Regression Coefficients</h2>
                  <p className="dash-card-desc">
                    Weights (β) learned during training. Positive coefficients increase approval probability, while negative coefficients decrease it.
                  </p>
                </div>
              </div>

              <div className="coef-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Feature Name</th>
                      <th>Type</th>
                      <th>Learned Weight (β)</th>
                      <th>Impact Magnitude</th>
                      <th>Decision Influence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.model_summary.coefficients.map((c) => {
                      const isPositive = c.coefficient >= 0;
                      return (
                        <tr key={c.feature}>
                          <td className="feat-name-cell">
                            <code>{c.feature}</code>
                          </td>
                          <td>
                            <span className={`type-pill ${c.type}`}>
                              {c.type}
                            </span>
                          </td>
                          <td className="num-cell">
                            <strong className={isPositive ? 'text-green' : 'text-red'}>
                              {isPositive ? `+${c.coefficient.toFixed(4)}` : c.coefficient.toFixed(4)}
                            </strong>
                          </td>
                          <td className="bar-cell">
                            <div className="coef-bar-track">
                              <div
                                className={`coef-bar-fill ${isPositive ? 'coef-pos' : 'coef-neg'}`}
                                style={{ width: `${Math.min(100, (c.abs_weight / 2.2) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className={`influence-tag ${isPositive ? 'tag-pos' : 'tag-neg'}`}>
                              <span className="material-symbols-outlined">
                                {isPositive ? 'trending_up' : 'trending_down'}
                              </span>
                              {isPositive ? 'Favors Approval' : 'Favors Rejection'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="model-eq-strip">
                <span className="eq-label">Model Intercept (β₀):</span>
                <code>+{data.model_summary.intercept.toFixed(4)}</code>
                <span className="eq-sep">·</span>
                <span className="eq-label">Decision Threshold (θ):</span>
                <code>{data.model_summary.threshold.toFixed(2)}</code>
                <span className="eq-sep">·</span>
                <span className="eq-label">Solver:</span>
                <code>{data.model_summary.solver} (C={data.model_summary.regularization_C})</code>
              </div>
            </section>

            {/* ── Dataset Preview Table ── */}
            <section className="dash-card full-width-card">
              <div className="dash-card-header">
                <span className="material-symbols-outlined card-icon">table_view</span>
                <div>
                  <h2 className="dash-card-title">Dataset Preview (First 10 Records)</h2>
                  <p className="dash-card-desc">
                    Raw applicant sample data stored in <code>backend/data/loan_data.csv</code> used for model training and validation.
                  </p>
                </div>
              </div>

              <div className="dataset-table-wrap">
                <table className="dash-table dataset-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Gender</th>
                      <th>Married</th>
                      <th>Dependents</th>
                      <th>Education</th>
                      <th>Self Employed</th>
                      <th>Applicant Income</th>
                      <th>Coapplicant Income</th>
                      <th>Loan Amount</th>
                      <th>Term</th>
                      <th>Credit Hist.</th>
                      <th>Property Area</th>
                      <th>Loan Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dataset.preview.map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{idx + 1}</strong></td>
                        <td>{row.Gender}</td>
                        <td>{row.Married}</td>
                        <td>{row.Dependents}</td>
                        <td>{row.Education}</td>
                        <td>{row.Self_Employed}</td>
                        <td>₹{Number(row.ApplicantIncome || 0).toLocaleString()}</td>
                        <td>₹{Number(row.CoapplicantIncome || 0).toLocaleString()}</td>
                        <td>₹{Number(row.LoanAmount || 0).toLocaleString()}k</td>
                        <td>{row.Loan_Amount_Term} mo</td>
                        <td>
                          <span className={`status-pill ${String(row.Credit_History) === '1.0' || String(row.Credit_History) === '1' ? 'pill-good' : 'pill-bad'}`}>
                            {String(row.Credit_History) === '1.0' || String(row.Credit_History) === '1' ? '1.0 (Good)' : '0.0 (Poor)'}
                          </span>
                        </td>
                        <td>{row.Property_Area}</td>
                        <td>
                          <span className={`status-pill ${row.Loan_Status === 'Y' ? 'pill-approved' : 'pill-rejected'}`}>
                            {row.Loan_Status === 'Y' ? 'Approved (Y)' : 'Rejected (N)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      <style>{`
        .analytics-page {
          flex: 1;
          background: var(--bg);
          padding-bottom: 64px;
        }

        .analytics-head {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: 36px 24px;
        }
        .analytics-head-inner {
          max-width: var(--max-w);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .analytics-badge {
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
        .analytics-badge-icon { font-size: 16px; }
        .analytics-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
        }
        .analytics-subtitle {
          font-size: 0.95rem;
          color: var(--text-muted);
          max-width: 780px;
          line-height: 1.6;
        }

        .analytics-content {
          max-width: var(--max-w);
          margin: 32px auto 0;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── KPI Grid ── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .kpi-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }
        .kpi-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-blue { background: #eff6ff; color: #2563eb; }
        .icon-green { background: #f0fdf4; color: #16a34a; }
        .icon-purple { background: #faf5ff; color: #9333ea; }
        .icon-amber { background: #fffbeb; color: #d97706; }
        .kpi-meta { display: flex; flex-direction: column; }
        .kpi-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .kpi-value { font-size: 1.65rem; font-weight: 800; color: var(--text); line-height: 1.2; margin: 2px 0; }
        .kpi-sub { font-size: 0.76rem; color: var(--text-light); }

        /* ── Row 2 ── */
        .dashboard-row-2 {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 24px;
        }
        .dash-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dash-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .card-icon {
          font-size: 24px;
          color: var(--primary);
          margin-top: 2px;
        }
        .dash-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
        }
        .dash-card-desc {
          font-size: 0.84rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* ── Confusion Matrix ── */
        .cm-wrapper {
          display: grid;
          grid-template-columns: 140px 1fr 1fr;
          gap: 10px;
          margin-top: 4px;
        }
        .cm-header-row {
          display: contents;
        }
        .cm-corner-label {
          font-size: 0.74rem;
          color: var(--text-light);
          font-weight: 600;
          display: flex;
          align-items: center;
        }
        .cm-col-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
          padding: 6px;
          background: var(--surface-alt);
          border-radius: 6px;
        }
        .cm-row {
          display: contents;
        }
        .cm-row-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 8px 4px;
        }
        .cm-cell {
          padding: 16px 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1px solid var(--border);
        }
        .cm-tn { background: #f0fdf4; border-color: #bbf7d0; }
        .cm-tp { background: #ecfdf5; border-color: #a7f3d0; }
        .cm-fp { background: #fef2f2; border-color: #fecaca; }
        .cm-fn { background: #fff1f2; border-color: #fecdd3; }
        .cm-cell-tag { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .cm-cell-val { font-size: 1.6rem; font-weight: 800; color: var(--text); margin: 4px 0; }
        .cm-cell-sub { font-size: 0.74rem; color: var(--text-muted); }

        .cm-metrics-summary {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .cm-metric-pill {
          background: var(--surface-alt);
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          gap: 8px;
          font-size: 0.8rem;
        }
        .cm-metric-pill .label { color: var(--text-muted); font-weight: 500; }
        .cm-metric-pill .val { color: var(--primary); font-weight: 700; }

        /* ── Target Distribution ── */
        .dist-bars-wrap {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .dist-item-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.86rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .dist-bar-track {
          width: 100%;
          height: 14px;
          background: var(--surface-alt);
          border-radius: 999px;
          overflow: hidden;
        }
        .dist-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s ease;
        }
        .fill-approved { background: #16a34a; }
        .fill-rejected { background: #dc2626; }
        .dist-notes {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--surface-alt);
          padding: 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .dist-notes .note-icon { font-size: 20px; color: var(--primary); flex-shrink: 0; }

        /* ── Full Width Cards & Tables ── */
        .full-width-card {
          grid-column: 1 / -1;
        }
        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
          text-align: left;
        }
        .dash-table th {
          background: var(--surface-alt);
          padding: 10px 14px;
          font-weight: 700;
          font-size: 0.76rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid var(--border);
        }
        .dash-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          color: var(--text);
        }
        .dash-table tr:last-child td { border-bottom: none; }
        .coef-table-wrap, .dataset-table-wrap {
          overflow-x: auto;
        }
        .feat-name-cell code {
          background: var(--surface-alt);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.84rem;
          font-family: monospace;
          color: var(--primary);
        }
        .type-pill {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .type-pill.categorical { background: #fdf4ff; color: #a21caf; }
        .type-pill.numerical { background: #eff6ff; color: #1d4ed8; }
        .num-cell { font-family: monospace; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .bar-cell { width: 180px; }
        .coef-bar-track {
          width: 100%;
          height: 8px;
          background: var(--surface-alt);
          border-radius: 999px;
          overflow: hidden;
        }
        .coef-bar-fill { height: 100%; border-radius: 999px; }
        .coef-pos { background: #16a34a; }
        .coef-neg { background: #dc2626; }
        .influence-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .influence-tag .material-symbols-outlined { font-size: 14px; }
        .tag-pos { background: #f0fdf4; color: #15803d; }
        .tag-neg { background: #fef2f2; color: #b91c1c; }

        .model-eq-strip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--surface-alt);
          border-radius: 8px;
          font-size: 0.84rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        .eq-label { font-weight: 600; }
        .eq-sep { color: var(--text-light); }
        .model-eq-strip code {
          background: #fff;
          padding: 2px 6px;
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: monospace;
        }

        /* ── Dataset preview table ── */
        .status-pill {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.74rem;
          font-weight: 700;
        }
        .pill-good { background: #f0fdf4; color: #16a34a; }
        .pill-bad  { background: #fef2f2; color: #dc2626; }
        .pill-approved { background: #ecfdf5; color: #047857; }
        .pill-rejected { background: #fef2f2; color: #b91c1c; }

        /* ── Loading / Error states ── */
        .analytics-loading {
          padding: 80px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-muted);
        }
        .analytics-spinner {
          width: 38px;
          height: 38px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .analytics-error-card {
          background: #fff;
          border: 1px solid #fca5a5;
          border-radius: var(--radius);
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          box-shadow: var(--shadow-sm);
        }
        .err-icon { font-size: 32px; color: #dc2626; }
        .err-body h3 { font-size: 1.1rem; color: #991b1b; margin-bottom: 6px; }
        .err-body p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 14px; }
        .btn-retry {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .dashboard-row-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr; }
          .cm-wrapper { grid-template-columns: 1fr; }
          .cm-col-label, .cm-corner-label { display: none; }
        }
      `}</style>
    </main>
  );
}
