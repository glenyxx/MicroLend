import pandas as pd
import numpy as np
import joblib
import json
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    confusion_matrix
)
from sklearn.pipeline import Pipeline

print("📊 Loading training data...")
df = pd.read_csv('training_data.csv')

#FEATURES AND TARGET 
FEATURES = [
    'monthly_income',
    'debt_monthly',
    'loan_amount',
    'years_in_business',
    'duration_months',
    'sector',
    'debt_to_income',
    'loan_to_income',
]

X = df[FEATURES]
y = df['defaulted']   # 1 = defaulted (bad), 0 = repaid (good)

#TRAIN / TEST SPLIT 
# 80% of data used for training, 20% held back for evaluation
# stratify=y ensures both splits have the same default rate
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"   Training samples : {len(X_train)}")
print(f"   Test samples     : {len(X_test)}")

#BUILD A PIPELINE 
# Pipeline chains preprocessing + model into one object
# StandardScaler normalises features so large income values don't
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model',  GradientBoostingClassifier(
        n_estimators=150,    
        learning_rate=0.08,  
        max_depth=4,         
        random_state=42
    ))
])

#TRAIN 
print("\n🤖 Training GradientBoostingClassifier...")
pipeline.fit(X_train, y_train)

#EVALUATE 
y_pred      = pipeline.predict(X_test)
y_pred_prob = pipeline.predict_proba(X_test)[:, 1]  
auc_score   = roc_auc_score(y_test, y_pred_prob)

print("\n📈 Evaluation Results:")
print(f"   AUC-ROC Score : {auc_score:.4f}  (1.0 = perfect, 0.5 = random)")
print("\n   Classification Report:")
print(classification_report(y_test, y_pred,
      target_names=['Repaid (good)', 'Defaulted (bad)']))

print("   Confusion Matrix (rows=actual, cols=predicted):")
cm = confusion_matrix(y_test, y_pred)
print(f"   [[TN={cm[0,0]}  FP={cm[0,1]}]")
print(f"    [FN={cm[1,0]}  TP={cm[1,1]}]]")

#SAVE MODEL AND METADATA 
joblib.dump(pipeline, 'model.pkl')
print("\n✅ Model saved to model.pkl")

# Save feature names so the Flask API knows the correct column order
metadata = {
    'features': FEATURES,
    'model_type': 'GradientBoostingClassifier',
    'auc_score': round(auc_score, 4),
    'sectors': {
        '0': 'retail',
        '1': 'agriculture',
        '2': 'services',
        '3': 'manufacturing',
        '4': 'transport'
    }
}
with open('model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("✅ Metadata saved to model_metadata.json")
print("\nFeature importances (higher = more influential):")
feature_importances = pipeline.named_steps['model'].feature_importances_
for feat, imp in sorted(zip(FEATURES, feature_importances),
                         key=lambda x: x[1], reverse=True):
    bar = '█' * int(imp * 50)
    print(f"   {feat:<22} {bar} {imp:.4f}")