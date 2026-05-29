import pandas as pd
from sklearn.preprocessing import StandardScaler
import joblib

print("Loading dataset...")
df = pd.read_csv('../Dataset/gold_loan.csv')

print("Mapping occupation...")
occupation_risk_map = {
    'Professional': 1,
    'Salaried':     2,
    'Small Business': 3,
    'Farmer':       4,
    'Daily Wage':   5
}
df['occupation_encoded'] = df['occupation'].map(occupation_risk_map)

print("Selecting features...")
# The notebook used these exact columns for X:
feature_cols = [
    'occupation_encoded', 'past_defaults', 'active_loans', 'total_debt_burden', 'interest_rate_pct',
    'ltv_ratio', 'emi_inr', 'cibil_score', 'monthly_income',
    'emp_years', 'income_to_emi', 'loan_amount_inr', 'tenure_months'
]

X = df[feature_cols]

print("Fitting scaler...")
scaler = StandardScaler()
scaler.fit(X)

print("Saving scaler to scaler.pkl...")
joblib.dump(scaler, 'scaler.pkl')

print("Done. feature_names_in_:", getattr(scaler, 'feature_names_in_', None))
