from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import shap
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

#LOAD MODEL ON STARTUP
MODEL_PATH = os.getenv('MODEL_PATH', 'model.pkl')

try:
    pipeline = joblib.load(MODEL_PATH)
    with open('model_metadata.json') as f:
        metadata = json.load(f)
    FEATURES = metadata['features']

    # Build a SHAP explainer using 100 background samples
    # TreeExplainer is the fastest explainer for tree-based models
    # We pre-build it once here so scoring is fast
    background_data = np.zeros((100, len(FEATURES)))
    explainer = shap.TreeExplainer(pipeline.named_steps['model'])

    print("✅ Model and SHAP explainer loaded")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    pipeline = None


def compute_score(data: dict) -> dict:
    """
    Core scoring function.
    Takes a dict of borrower/loan features.
    Returns a score, recommendation, confidence and SHAP explanations.
    """
    #EXTRACT AND DERIVE FEATURES 
    monthly_income    = float(data.get('monthly_income', 0))
    debt_monthly      = float(data.get('debt_monthly', 0))
    loan_amount       = float(data.get('loan_amount', 0))
    years_in_business = float(data.get('years_in_business', 1))
    duration_months   = int(data.get('duration_months', 12))
    sector            = int(data.get('sector', 0))

    # Validate inputs
    if monthly_income <= 0:
        raise ValueError("monthly_income must be greater than 0")
    if loan_amount <= 0:
        raise ValueError("loan_amount must be greater than 0")

    # Compute the derived ratio features (same as training time)
    debt_to_income = debt_monthly / monthly_income
    loan_to_income = loan_amount / monthly_income

    # Build the feature vector in the exact same order as training
    features_vector = np.array([[
        monthly_income,
        debt_monthly,
        loan_amount,
        years_in_business,
        duration_months,
        sector,
        debt_to_income,
        loan_to_income,
    ]])

    #SCALE FEATURES 
    # Apply the same StandardScaler that was fitted during training
    scaler = pipeline.named_steps['scaler']
    features_scaled = scaler.transform(features_vector)

    #PREDICT 
    # predict_probability returns [prob_repaid, prob_default]
    proba = pipeline.predict_proba(features_vector)[0]
    default_probability = float(proba[1])  

    # The credit SCORE is the inverse: high score = low risk = good borrower
    credit_score = round(1 - default_probability, 4)

    # Confidence: how far from 0.5 the model is (0.5 = uncertain, 1.0 = certain)
    confidence = round(abs(credit_score - 0.5) * 2, 4)

    # Recommendation thresholds
    if credit_score >= 0.70:
        recommendation = 'approve'
    elif credit_score >= 0.45:
        recommendation = 'manual_review'
    else:
        recommendation = 'reject'

    #SHAP EXPLANATIONS 
    # SHAP values tell us how much each feature pushed the score
    # up (positive = helps approval) or down (negative = hurts approval)
    shap_values = explainer.shap_values(features_scaled)

    # shap_values shape: (n_samples, n_features)
    # For binary classification, index [1] = impact on default probability
    if isinstance(shap_values, list):
        sv = shap_values[1][0]   
    else:
        sv = shap_values[0]

    # Build human-readable explanations sorted by absolute impact
    raw_factors = []
    for feat_name, shap_val, feat_val in zip(FEATURES, sv, features_vector[0]):
        raw_factors.append({
            'feature':    feat_name,
            'value':      round(float(feat_val), 4),
            'impact':     round(float(shap_val), 4),
            'direction':  'risk_increase' if shap_val > 0 else 'risk_decrease'
        })

    # Sort by absolute impact — most influential first
    risk_factors = sorted(raw_factors, key=lambda x: abs(x['impact']), reverse=True)

    summary_lines = []
    for f in risk_factors[:3]:
        direction_text = "increases risk" if f['direction'] == 'risk_increase' else "reduces risk"
        summary_lines.append(
            f"{f['feature'].replace('_', ' ').title()} of {f['value']:,.2f} {direction_text}"
        )

    return {
        'credit_score':       credit_score,
        'default_probability': round(default_probability, 4),
        'recommendation':     recommendation,
        'confidence':         confidence,
        'risk_factors':       risk_factors[:5],   
        'summary':            summary_lines,
        'model_version':      metadata.get('model_type', 'unknown'),
    }


#ROUTES 

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'credit-service',
        'model_loaded': pipeline is not None
    })


@app.route('/api/credit/score', methods=['POST'])
def score():
    """
    Score a loan application.

    Expected JSON body:
    {
        "monthly_income":    350000,
        "debt_monthly":      40000,
        "loan_amount":       500000,
        "years_in_business": 3.5,
        "duration_months":   12,
        "sector":            0
    }
    """
    if pipeline is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    try:
        result = compute_score(data)
        return jsonify(result), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Scoring error: {e}")
        return jsonify({'error': 'Scoring failed'}), 500


@app.route('/api/credit/batch', methods=['POST'])
def batch_score():
    """
    Score multiple applications at once.
    Useful for the admin dashboard to re-score all pending loans.

    Expected body: { "applications": [ {...}, {...} ] }
    """
    if pipeline is None:
        return jsonify({'error': 'Model not loaded'}), 503

    data = request.get_json()
    applications = data.get('applications', [])

    if not applications:
        return jsonify({'error': 'applications array is required'}), 400

    results = []
    for i, app_data in enumerate(applications):
        try:
            score_result = compute_score(app_data)
            results.append({'index': i, 'success': True, **score_result})
        except Exception as e:
            results.append({'index': i, 'success': False, 'error': str(e)})

    return jsonify({'results': results}), 200


if __name__ == '__main__':
    port = int(os.getenv('PORT', 3003))
    print(f"🚀 Credit Service running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)