"""
LoanPredict AI — Flask Application
===================================
Single-file Flask app. Handles:
  - Page rendering via Jinja2 templates
  - Loan prediction (POST /prediction)
  - JSON APIs: /api/predict, /api/analytics-data, /api/training-data, /health

Run locally:
    pip install -r requirements.txt
    python app.py

Production (Render):
    gunicorn app:app
"""

import io
import os
import textwrap
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from flask import Flask, render_template, request, jsonify, redirect, url_for
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline as SKPipeline
from sklearn.preprocessing import StandardScaler, OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (accuracy_score, precision_score,
                             recall_score, f1_score, confusion_matrix)

# ── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "loanpredict-dev-key-2026")

BASE_DIR   = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "loan_model.pkl"
DATA_FILE  = BASE_DIR / "data" / "loan_data.csv"
THRESHOLD  = 0.50

# ── Feature definitions ────────────────────────────────────────────────────
CATEGORICAL_FEATURES = [
    "Gender", "Married", "Dependents", "Education",
    "Self_Employed", "Property_Area",
]
NUMERICAL_FEATURES = [
    "ApplicantIncome", "CoapplicantIncome",
    "LoanAmount", "Loan_Amount_Term", "Credit_History",
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

ALLOWED_VALUES = {
    "Gender":        ["Male", "Female"],
    "Married":       ["Yes", "No"],
    "Dependents":    ["0", "1", "2", "3+"],
    "Education":     ["Graduate", "Not Graduate"],
    "Self_Employed": ["Yes", "No"],
    "Property_Area": ["Urban", "Semiurban", "Rural"],
}

# Embedded training data (fallback when CSV not found)
TRAINING_CSV = textwrap.dedent("""\
Gender,Married,Dependents,Education,Self_Employed,ApplicantIncome,CoapplicantIncome,LoanAmount,Loan_Amount_Term,Credit_History,Property_Area,Loan_Status
Male,Yes,0,Graduate,No,5849,0.0,128.0,360.0,1.0,Urban,Y
Male,No,1,Graduate,No,4583,1508.0,128.0,360.0,1.0,Rural,N
Male,Yes,0,Graduate,Yes,3000,0.0,66.0,360.0,1.0,Urban,Y
Male,Yes,0,Not Graduate,No,2583,2358.0,120.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,6000,0.0,141.0,360.0,1.0,Urban,Y
Male,Yes,2,Graduate,Yes,5417,4196.0,267.0,360.0,1.0,Urban,Y
Male,Yes,1,Graduate,No,2333,1516.0,95.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,3036,2504.0,158.0,360.0,0.0,Semiurban,N
Male,Yes,2,Graduate,No,4006,1526.0,168.0,360.0,1.0,Urban,Y
Male,Yes,3+,Graduate,No,12841,10968.0,349.0,360.0,1.0,Semiurban,Y
Male,Yes,2,Graduate,No,4153,0.0,100.0,360.0,1.0,Rural,N
Male,Yes,0,Not Graduate,Yes,3718,0.0,70.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,4950,4500.0,270.0,360.0,1.0,Semiurban,Y
Female,No,3+,Graduate,No,2776,0.0,78.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3567,3526.0,189.0,360.0,1.0,Rural,Y
Male,No,1,Graduate,No,4788,1490.0,153.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Not Graduate,No,5140,0.0,98.0,360.0,0.0,Semiurban,N
Male,Yes,1,Not Graduate,No,3167,2333.0,158.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,8000,0.0,170.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,6250,3750.0,220.0,360.0,1.0,Rural,N
Female,No,0,Graduate,No,2650,0.0,75.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,4196,0.0,128.0,360.0,1.0,Semiurban,Y
Male,No,0,Graduate,No,2654,0.0,80.0,180.0,1.0,Rural,Y
Male,Yes,0,Graduate,No,9000,0.0,115.0,360.0,1.0,Semiurban,Y
Male,Yes,1,Graduate,No,4950,4500.0,300.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,3000,0.0,66.0,360.0,1.0,Rural,Y
Male,No,0,Graduate,No,2000,0.0,90.0,360.0,1.0,Rural,Y
Male,Yes,0,Graduate,No,3450,0.0,100.0,360.0,1.0,Urban,Y
Male,Yes,2,Not Graduate,No,3333,0.0,78.0,360.0,1.0,Rural,N
Male,Yes,0,Graduate,No,6500,4583.0,370.0,360.0,0.0,Urban,N
Male,No,0,Graduate,No,2500,0.0,67.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Not Graduate,No,2917,1917.0,80.0,360.0,1.0,Rural,Y
Male,No,0,Graduate,Yes,3333,0.0,65.0,360.0,1.0,Semiurban,Y
Male,No,0,Graduate,No,2917,1917.0,97.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,5000,0.0,100.0,360.0,1.0,Rural,Y
Male,Yes,0,Graduate,No,4833,1204.0,125.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3083,0.0,76.0,360.0,1.0,Rural,Y
Male,No,1,Graduate,No,5417,0.0,96.0,360.0,0.0,Semiurban,N
Male,Yes,0,Graduate,No,3000,2000.0,111.0,360.0,1.0,Rural,Y
Male,Yes,2,Graduate,Yes,5417,0.0,100.0,360.0,1.0,Urban,Y
Male,No,0,Not Graduate,No,2250,0.0,51.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3500,4688.0,220.0,360.0,1.0,Semiurban,Y
Female,No,0,Graduate,No,5083,0.0,150.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,6417,0.0,132.0,360.0,1.0,Rural,Y
Male,Yes,1,Graduate,Yes,2333,1516.0,117.0,360.0,1.0,Rural,Y
Male,No,0,Not Graduate,No,3000,0.0,42.0,360.0,1.0,Semiurban,Y
Female,No,0,Graduate,No,3180,0.0,64.0,360.0,1.0,Rural,Y
Male,Yes,0,Graduate,No,4167,0.0,110.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,11667,0.0,295.0,360.0,1.0,Urban,Y
Male,Yes,3+,Graduate,No,4167,4000.0,265.0,360.0,0.0,Urban,N
Male,Yes,0,Graduate,No,8250,0.0,264.0,360.0,1.0,Rural,N
Male,Yes,0,Graduate,No,3017,0.0,65.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,3000,0.0,50.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,5083,5417.0,397.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,2165,1625.0,117.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,3333,0.0,56.0,360.0,1.0,Rural,Y
Male,No,0,Graduate,No,5000,1800.0,175.0,360.0,0.0,Semiurban,N
Male,Yes,1,Graduate,No,4167,3267.0,220.0,360.0,1.0,Urban,Y
Male,Yes,2,Graduate,No,4167,4000.0,285.0,360.0,0.0,Semiurban,N
Male,Yes,0,Graduate,No,5417,0.0,120.0,360.0,1.0,Semiurban,Y
Male,No,0,Graduate,No,4542,0.0,116.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3000,4000.0,273.0,360.0,1.0,Rural,N
Female,No,0,Graduate,No,1900,0.0,61.0,180.0,1.0,Rural,Y
Male,Yes,1,Graduate,No,4917,1666.0,175.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,4583,0.0,129.0,360.0,1.0,Rural,Y
Male,Yes,2,Graduate,No,5417,4583.0,185.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,3000,3333.0,225.0,360.0,0.0,Semiurban,N
Male,Yes,0,Graduate,No,3333,0.0,75.0,360.0,1.0,Semiurban,Y
Male,Yes,1,Graduate,No,5167,2100.0,198.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,4333,2333.0,210.0,360.0,0.0,Rural,N
Male,No,0,Graduate,No,5500,0.0,126.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,4000,0.0,111.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,3750,0.0,88.0,360.0,0.0,Semiurban,N
Male,Yes,0,Graduate,Yes,4396,0.0,90.0,360.0,1.0,Urban,Y
Male,Yes,1,Graduate,No,3917,2333.0,200.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,2542,1450.0,128.0,360.0,1.0,Rural,Y
Male,No,0,Graduate,No,4500,0.0,108.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,2000,2667.0,160.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,5000,0.0,130.0,360.0,1.0,Urban,Y
Female,No,0,Graduate,No,3476,0.0,80.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3333,0.0,70.0,360.0,1.0,Rural,Y
Male,Yes,0,Graduate,Yes,7000,0.0,128.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,4250,4017.0,250.0,360.0,1.0,Urban,Y
Male,Yes,1,Graduate,No,2917,3333.0,203.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,4058,0.0,132.0,360.0,1.0,Semiurban,Y
Male,Yes,2,Graduate,No,4333,2333.0,186.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3333,2667.0,170.0,360.0,0.0,Rural,N
Male,Yes,0,Graduate,No,4500,0.0,108.0,360.0,0.0,Urban,N
Male,Yes,0,Graduate,No,3500,0.0,80.0,360.0,1.0,Urban,Y
Female,No,0,Graduate,No,3667,0.0,104.0,360.0,1.0,Rural,Y
Male,No,0,Graduate,No,3400,0.0,64.0,360.0,1.0,Rural,Y
Male,No,0,Graduate,No,10000,0.0,300.0,360.0,1.0,Urban,Y
Male,Yes,0,Graduate,No,4500,0.0,100.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,5000,3000.0,233.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3500,0.0,100.0,360.0,1.0,Urban,Y
Male,No,0,Graduate,No,4000,0.0,87.0,360.0,1.0,Rural,Y
Male,Yes,0,Graduate,No,3500,2000.0,180.0,360.0,1.0,Semiurban,Y
Male,Yes,0,Graduate,No,3833,1217.0,184.0,360.0,1.0,Rural,Y
Male,Yes,2,Not Graduate,No,3333,5000.0,300.0,360.0,0.0,Urban,N
""")


# ── Pipeline ───────────────────────────────────────────────────────────────
def build_pipeline():
    cat_pipe = SKPipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(
            categories=[ALLOWED_VALUES[f] for f in CATEGORICAL_FEATURES],
            handle_unknown="use_encoded_value",
            unknown_value=-1,
        )),
    ])
    num_pipe = SKPipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    preprocessor = ColumnTransformer([
        ("cat", cat_pipe, CATEGORICAL_FEATURES),
        ("num", num_pipe, NUMERICAL_FEATURES),
    ])
    return SKPipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(
            random_state=42, max_iter=1000, solver="lbfgs", C=1.0
        )),
    ])


def get_training_df():
    if DATA_FILE.exists():
        return pd.read_csv(DATA_FILE)
    return pd.read_csv(io.StringIO(TRAINING_CSV))


def load_or_train_model():
    if MODEL_PATH.exists():
        print("[LoanPredict] Loading saved model …")
        return joblib.load(MODEL_PATH)
    print("[LoanPredict] Training model …")
    df = get_training_df()
    df["Loan_Status"] = (df["Loan_Status"].str.strip().str.upper() == "Y").astype(int)
    pipeline = build_pipeline()
    pipeline.fit(df[ALL_FEATURES], df["Loan_Status"])
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


PIPELINE = load_or_train_model()


# ── Validation & Prediction ────────────────────────────────────────────────
def validate(data):
    errors = []
    for field, allowed in ALLOWED_VALUES.items():
        if data.get(field, "") not in allowed:
            errors.append(f"'{field}' must be one of: {', '.join(allowed)}.")
    for field in ["ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term"]:
        try:
            if float(data.get(field, "")) < 0:
                errors.append(f"'{field}' must be >= 0.")
        except (TypeError, ValueError):
            errors.append(f"'{field}' must be a valid number.")
    try:
        ch = float(data.get("Credit_History", ""))
        if ch not in (0.0, 1.0):
            errors.append("'Credit_History' must be 0 or 1.")
    except (TypeError, ValueError):
        errors.append("'Credit_History' must be 0 or 1.")
    return errors


def run_prediction(data):
    raw_loan = float(data["LoanAmount"])
    loan_amount = raw_loan / 1000.0 if raw_loan >= 1000.0 else raw_loan

    row = pd.DataFrame([{
        "Gender":            data["Gender"],
        "Married":           data["Married"],
        "Dependents":        data["Dependents"],
        "Education":         data["Education"],
        "Self_Employed":     data["Self_Employed"],
        "ApplicantIncome":   float(data["ApplicantIncome"]),
        "CoapplicantIncome": float(data["CoapplicantIncome"]),
        "LoanAmount":        loan_amount,
        "Loan_Amount_Term":  float(data["Loan_Amount_Term"]),
        "Credit_History":    float(data["Credit_History"]),
        "Property_Area":     data["Property_Area"],
    }])

    preprocessor = PIPELINE.named_steps["preprocessor"]
    classifier   = PIPELINE.named_steps["classifier"]

    X_proc    = preprocessor.transform(row)
    coef      = classifier.coef_[0]
    intercept = float(classifier.intercept_[0])

    processed_vals = X_proc[0].tolist()
    coef_vals      = coef.tolist()
    contributions  = [round(float(p) * float(c), 6)
                      for p, c in zip(processed_vals, coef_vals)]

    linear_score = float(classifier.decision_function(X_proc)[0])
    probability  = float(PIPELINE.predict_proba(row)[0][1])
    approved     = probability >= THRESHOLD

    return {
        "prediction":         "Approved" if approved else "Rejected",
        "probability":        round(probability, 6),
        "linear_score":       round(linear_score, 4),
        "linear_score_exact": round(linear_score, 6),
        "threshold":          THRESHOLD,
        "model":              "Logistic Regression (scikit-learn)",
        "approved":           approved,
        "feature_names":      ALL_FEATURES,
        "processed_values":   [round(v, 6) for v in processed_vals],
        "coefficients":       [round(v, 6) for v in coef_vals],
        "intercept":          round(intercept, 6),
        "contributions":      contributions,
        "raw_loan_amount":    raw_loan,
        "model_loan_amount":  loan_amount,
        "applicant": {
            "Gender":            data["Gender"],
            "Married":           data["Married"],
            "Dependents":        data["Dependents"],
            "Education":         data["Education"],
            "Self_Employed":     data["Self_Employed"],
            "Property_Area":     data["Property_Area"],
            "ApplicantIncome":   float(data["ApplicantIncome"]),
            "CoapplicantIncome": float(data["CoapplicantIncome"]),
            "LoanAmount":        raw_loan,
            "Loan_Amount_Term":  float(data["Loan_Amount_Term"]),
            "Credit_History":    float(data["Credit_History"]),
        },
    }


# ── Page routes ────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/prediction", methods=["GET", "POST"])
def prediction():
    result = None
    form_data = {}
    errors = []

    if request.method == "POST":
        form_data = request.form.to_dict()
        errors = validate(form_data)
        if not errors:
            try:
                result = run_prediction(form_data)
            except Exception as e:
                errors = [f"Prediction error: {str(e)}"]

    return render_template("prediction.html",
                           result=result,
                           form_data=form_data,
                           errors=errors)


@app.route("/live-ml")
def live_ml():
    return render_template("live_ml.html")


@app.route("/live-analysis")
def live_analysis():
    return render_template("ml_visualization.html")


@app.route("/analytics")
def analytics():
    return render_template("analytics.html")


@app.route("/model-info")
def model_info():
    # Pull live coefficients from the loaded model
    classifier = PIPELINE.named_steps["classifier"]
    coef = classifier.coef_[0].tolist()
    intercept = float(classifier.intercept_[0])
    coefficients = sorted(
        [{"feature": f, "coefficient": round(float(c), 4),
          "type": "categorical" if f in CATEGORICAL_FEATURES else "numerical"}
         for f, c in zip(ALL_FEATURES, coef)],
        key=lambda x: abs(x["coefficient"]), reverse=True
    )
    return render_template("model_info.html",
                           coefficients=coefficients,
                           intercept=round(intercept, 4))


@app.route("/model")
def model_redirect():
    return redirect(url_for("model_info"))


@app.route("/about")
def about():
    return render_template("about.html")


# ── JSON API routes (used by viz.js for ML Visualization page) ─────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": "Logistic Regression"})


@app.route("/api/predict", methods=["POST"])
def api_predict():
    data = request.get_json(silent=True) or {}
    errors = validate(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 422
    try:
        return jsonify(run_prediction(data))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Keep old /predict endpoint for backward compatibility
@app.route("/predict", methods=["POST"])
def predict_compat():
    data = request.get_json(silent=True) or {}
    errors = validate(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 422
    try:
        return jsonify(run_prediction(data))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analytics-data")
@app.route("/analytics-data")
def api_analytics():
    df = get_training_df()
    y_true = (df["Loan_Status"].astype(str).str.strip().str.upper() == "Y").astype(int)
    y_pred = PIPELINE.predict(df[ALL_FEATURES])

    cm = confusion_matrix(y_true, y_pred).tolist()
    total = len(df)
    approved = int(y_true.sum())
    rejected = total - approved

    classifier = PIPELINE.named_steps["classifier"]
    coef = classifier.coef_[0].tolist()
    intercept = float(classifier.intercept_[0])

    coefficients = sorted(
        [{"feature": f,
          "type": "categorical" if f in CATEGORICAL_FEATURES else "numerical",
          "coefficient": round(float(c), 6),
          "abs_weight": round(abs(float(c)), 6)}
         for f, c in zip(ALL_FEATURES, coef)],
        key=lambda x: x["abs_weight"], reverse=True
    )

    preview = df.head(10).fillna("").to_dict(orient="records")

    return jsonify({
        "dataset": {
            "total_records": total,
            "features_count": len(ALL_FEATURES),
            "approved_count": approved,
            "rejected_count": rejected,
            "approval_rate": round(approved / total, 4) if total else 0,
            "preview": preview,
        },
        "performance": {
            "evaluation_type": "Training Set Evaluation",
            "accuracy":  round(float(accuracy_score(y_true, y_pred)), 4),
            "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
            "recall":    round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
            "f1_score":  round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
            "confusion_matrix": {
                "tn": cm[0][0], "fp": cm[0][1],
                "fn": cm[1][0], "tp": cm[1][1],
            },
        },
        "model_summary": {
            "model_name": "Logistic Regression (scikit-learn)",
            "solver": "lbfgs",
            "regularization_C": 1.0,
            "threshold": THRESHOLD,
            "intercept": round(intercept, 6),
            "coefficients": coefficients,
            "pipeline_architecture": [
                {"step": "Categorical Imputation",   "method": "SimpleImputer(most_frequent)"},
                {"step": "Categorical Encoding",     "method": "OrdinalEncoder"},
                {"step": "Numerical Imputation",     "method": "SimpleImputer(median)"},
                {"step": "Numerical Scaling",        "method": "StandardScaler"},
                {"step": "Classification",           "method": "LogisticRegression(lbfgs, C=1.0)"},
            ],
        },
    })


@app.route("/api/training-data")
@app.route("/training-data")
def api_training_data():
    df = get_training_df()
    points = []
    for _, row in df.iterrows():
        status = str(row.get("Loan_Status", "")).strip().upper()
        is_approved = status in ("Y", "1")
        try:
            points.append({
                "ApplicantIncome":   float(row.get("ApplicantIncome", 0)),
                "CoapplicantIncome": float(row.get("CoapplicantIncome", 0) or 0),
                "LoanAmount":        float(row.get("LoanAmount", 0) or 0),
                "Credit_History":    float(row.get("Credit_History", 1) or 1),
                "Property_Area":     str(row.get("Property_Area", "Urban")),
                "Loan_Status":       "Approved" if is_approved else "Rejected",
                "approved":          is_approved,
            })
        except (ValueError, TypeError):
            continue
    return jsonify({
        "total_records":    len(df),
        "displayed_records": len(points),
        "data":             points,
    })


# ── Run ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
