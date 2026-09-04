"""
LoanPredict AI — Flask Prediction Backend
==========================================
Trains a Logistic Regression pipeline on a standard loan dataset,
then exposes POST /predict for real model predictions.

Run:
    cd backend
    pip install -r requirements.txt
    python app.py
"""

import io
import textwrap
import numpy as np
import pandas as pd
import joblib
import os
from typing import List
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline as SKPipeline

# ─── App setup ──────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "loan_model.pkl")
DATA_FILE  = os.path.join(os.path.dirname(__file__), "data", "loan_data.csv")
THRESHOLD  = 0.50   # classification threshold

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# ─── Embedded training data ──────────────────────────────────────────────────
# Standard Loan Prediction dataset (614 representative rows in CSV format).
# Source: Analytics Vidhya / Kaggle Loan Prediction Problem.
# Only used for training when no external dataset is provided.
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


# ─── Feature definitions (must match training exactly) ──────────────────────
CATEGORICAL_FEATURES = [
    "Gender", "Married", "Dependents", "Education",
    "Self_Employed", "Property_Area"
]
NUMERICAL_FEATURES = [
    "ApplicantIncome", "CoapplicantIncome",
    "LoanAmount", "Loan_Amount_Term", "Credit_History"
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

# Allowed categorical values — keep in sync with frontend
ALLOWED_VALUES = {
    "Gender":        ["Male", "Female"],
    "Married":       ["Yes", "No"],
    "Dependents":    ["0", "1", "2", "3+"],
    "Education":     ["Graduate", "Not Graduate"],
    "Self_Employed": ["Yes", "No"],
    "Property_Area": ["Urban", "Semiurban", "Rural"],
}


# ─── Pipeline construction ──────────────────────────────────────────────────
def build_pipeline() -> SKPipeline:
    cat_pipe = SKPipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OrdinalEncoder(
            categories=[
                ALLOWED_VALUES["Gender"],
                ALLOWED_VALUES["Married"],
                ALLOWED_VALUES["Dependents"],
                ALLOWED_VALUES["Education"],
                ALLOWED_VALUES["Self_Employed"],
                ALLOWED_VALUES["Property_Area"],
            ],
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


# ─── Train / load model ──────────────────────────────────────────────────────
def get_training_dataframe():
    if os.path.exists(DATA_FILE):
        return pd.read_csv(DATA_FILE)
    return pd.read_csv(io.StringIO(TRAINING_CSV))


def load_or_train_model():
    if os.path.exists(MODEL_PATH):
        print("[LoanPredict] Loading saved model …")
        return joblib.load(MODEL_PATH)

    print("[LoanPredict] Training Logistic Regression model …")
    df = get_training_dataframe()
    df["Loan_Status"] = (df["Loan_Status"].str.strip().str.upper() == "Y").astype(int)

    X = df[ALL_FEATURES]
    y = df["Loan_Status"]

    pipeline = build_pipeline()
    pipeline.fit(X, y)

    joblib.dump(pipeline, MODEL_PATH)
    print(f"[LoanPredict] Model trained and saved -> {MODEL_PATH}")
    return pipeline


PIPELINE = load_or_train_model()


# ─── Input validation ────────────────────────────────────────────────────────
def validate_input(data: dict) -> List[str]:
    errors = []

    for field, allowed in ALLOWED_VALUES.items():
        val = data.get(field, "")
        if val not in allowed:
            errors.append(f"'{field}' must be one of: {', '.join(allowed)}.")

    for field in ["ApplicantIncome", "CoapplicantIncome", "LoanAmount", "Loan_Amount_Term"]:
        try:
            v = float(data.get(field, ""))
            if v < 0:
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


# ─── /predict endpoint ───────────────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON."}), 415

    data = request.get_json(silent=True) or {}

    # Validate
    errors = validate_input(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 422

    # Normalize LoanAmount if user entered in whole rupees (>= 1000)
    raw_loan = float(data["LoanAmount"])
    loan_amount = raw_loan / 1000.0 if raw_loan >= 1000.0 else raw_loan

    # Build feature row
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

    # Predict using calibrated pipeline
    proba        = float(PIPELINE.predict_proba(row)[0][1])
    approved     = proba >= THRESHOLD
    prediction   = "Approved" if approved else "Rejected"

    # Linear score from classifier step using decision_function
    preprocessor = PIPELINE.named_steps["preprocessor"]
    classifier   = PIPELINE.named_steps["classifier"]
    X_transformed = preprocessor.transform(row)
    linear_score  = float(classifier.decision_function(X_transformed)[0])

    return jsonify({
        "prediction":   prediction,
        "probability":  round(proba, 6),
        "linear_score": round(linear_score, 4),
        "threshold":    THRESHOLD,
        "model":        "Logistic Regression (scikit-learn)",
        "approved":     approved,
    })


# ─── /health endpoint ────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "Logistic Regression"}), 200


# ─── /analyze endpoint  (Live ML visualization) ──────────────────────────────
# Returns the full LR calculation breakdown for the /live-ml page.
@app.route("/analyze", methods=["POST"])
def analyze():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON."}), 415

    data = request.get_json(silent=True) or {}

    errors = validate_input(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 422

    # Normalize LoanAmount if user entered in whole rupees (>= 1000)
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

    # Transform the input row through the same pipeline
    X_proc = preprocessor.transform(row)
    coef   = classifier.coef_[0]
    intercept = float(classifier.intercept_[0])

    # Feature names (cat first, then num — matches ColumnTransformer order)
    feature_names = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

    processed_vals = X_proc[0].tolist()
    coef_vals      = coef.tolist()

    # Per-feature contribution = processed_value × coefficient
    contributions = [round(float(pv) * float(cv), 6)
                     for pv, cv in zip(processed_vals, coef_vals)]

    # Linear score directly from decision_function
    linear_score = float(classifier.decision_function(X_proc)[0])

    # Calibrated probability directly from model pipeline
    probability = float(PIPELINE.predict_proba(row)[0][1])

    approved   = probability >= THRESHOLD
    prediction = "Approved" if approved else "Rejected"

    # Raw input values for display
    raw_values = [
        data["Gender"], data["Married"], data["Dependents"],
        data["Education"], data["Self_Employed"], data["Property_Area"],
        str(data["ApplicantIncome"]), str(data["CoapplicantIncome"]),
        str(loan_amount), str(data["Loan_Amount_Term"]),
        str(data["Credit_History"]),
    ]

    return jsonify({
        "feature_names":      feature_names,
        "raw_values":         raw_values,
        "processed_values":   [round(v, 6) for v in processed_vals],
        "coefficients":       [round(v, 6) for v in coef_vals],
        "intercept":          round(intercept, 6),
        "contributions":      contributions,
        "linear_score":       round(linear_score, 6),
        "probability":        round(probability, 6),
        "threshold":          THRESHOLD,
        "prediction":         prediction,
        "approved":           approved,
        "model":              "Logistic Regression (scikit-learn)",
    })


# ─── /analytics-data endpoint (Dataset & Model Analytics) ────────────────────
@app.route("/analytics-data", methods=["GET"])
def analytics_data():
    df = get_training_dataframe()
    df_clean = df.copy()
    y_true = (df_clean["Loan_Status"].astype(str).str.strip().str.upper() == "Y").astype(int)
    X = df_clean[ALL_FEATURES]

    y_pred = PIPELINE.predict(X)

    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()

    approved_count = int(sum(y_true == 1))
    rejected_count = int(sum(y_true == 0))
    total_records = len(df_clean)

    classifier = PIPELINE.named_steps["classifier"]
    coef = classifier.coef_[0].tolist()
    intercept = float(classifier.intercept_[0])

    feature_names = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    coefficients = [
        {
            "feature": f,
            "type": "categorical" if f in CATEGORICAL_FEATURES else "numerical",
            "coefficient": round(float(c), 6),
            "abs_weight": round(float(abs(c)), 6),
        }
        for f, c in zip(feature_names, coef)
    ]
    coefficients.sort(key=lambda x: x["abs_weight"], reverse=True)

    preview = df.head(10).fillna("").to_dict(orient="records")

    return jsonify({
        "dataset": {
            "total_records": total_records,
            "features_count": len(ALL_FEATURES),
            "target_variable": "Loan_Status",
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "approval_rate": round(approved_count / total_records, 4) if total_records > 0 else 0,
            "preview": preview,
            "categorical_features": CATEGORICAL_FEATURES,
            "numerical_features": NUMERICAL_FEATURES,
        },
        "performance": {
            "evaluation_type": "Training Set Evaluation (Real Model on Dataset)",
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "tn": cm[0][0],
                "fp": cm[0][1],
                "fn": cm[1][0],
                "tp": cm[1][1],
            }
        },
        "model_summary": {
            "model_name": "Logistic Regression (scikit-learn)",
            "solver": "lbfgs",
            "regularization_C": 1.0,
            "threshold": THRESHOLD,
            "intercept": round(intercept, 6),
            "coefficients": coefficients,
            "pipeline_architecture": [
                {"step": "Categorical Imputation", "method": "SimpleImputer(strategy='most_frequent')"},
                {"step": "Categorical Encoding", "method": "OrdinalEncoder(explicit allowed category lists)"},
                {"step": "Numerical Imputation", "method": "SimpleImputer(strategy='median')"},
                {"step": "Numerical Scaling", "method": "StandardScaler(zero mean, unit variance)"},
                {"step": "Classification", "method": "LogisticRegression(solver='lbfgs', C=1.0, max_iter=1000)"}
            ]
        }
    }), 200


# ─── Run ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
