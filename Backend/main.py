from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI(title="GoldFi Risk Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ML_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'scaler.pkl')

ml_model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

class PredictionRequest(BaseModel):
    occupation: str
    defaults: int
    activeLoans: int
    cibil: int
    income: float
    exp: float
    loanAmount: float
    tenure: int
    interest: float
    emi: float
    goldValue: float

@app.post("/predict")
async def predict_risk(data: PredictionRequest):
    # Calculate derived financial features exactly like frontend/notebook
    monthlyEMI = data.emi
    monthlyIncome = data.income
    
    income_to_emi_ratio = (monthlyIncome / monthlyEMI) if monthlyEMI > 0 else 0.0
    ltv = ((data.loanAmount / data.goldValue) * 100) if data.goldValue > 0 else 0.0
    
    # Logic Engine expects percentage
    total_debt_burden_logic = (((monthlyEMI * (data.activeLoans + 1)) / monthlyIncome) * 100) if monthlyIncome > 0 else (999.0 if monthlyEMI > 0 else 0.0)
    
    # ML Model expects raw ratio trained as: (emi * max(active_loans, 1)) / income
    active_multiplier = max(data.activeLoans, 1)
    total_debt_burden_ml = ((monthlyEMI * active_multiplier) / monthlyIncome) if monthlyIncome > 0 else (9.99 if monthlyEMI > 0 else 0.0)
    
    # Map occupation
    occ_lower = data.occupation.lower()
    if 'business' in occ_lower or 'self-employed' in occ_lower:
        occ_encoded = 3
    elif 'professional' in occ_lower:
        occ_encoded = 1
    elif 'salaried' in occ_lower:
        occ_encoded = 2
    elif 'farmer' in occ_lower:
        occ_encoded = 4
    elif 'wage' in occ_lower:
        occ_encoded = 5
    else:
        occ_encoded = 5
    
    # Prepare features for ML Model
    # Expected order by scaler:
    # ['occupation_encoded', 'past_defaults', 'active_loans', 'total_debt_burden',
    #  'interest_rate_pct', 'ltv_ratio', 'emi_inr', 'cibil_score', 'monthly_income',
    #  'emp_years', 'income_to_emi', 'loan_amount_inr', 'tenure_months']
    
    features = pd.DataFrame([{
        'occupation_encoded': occ_encoded,
        'past_defaults': data.defaults,
        'active_loans': data.activeLoans,
        'total_debt_burden': total_debt_burden_ml,
        'interest_rate_pct': data.interest,
        'ltv_ratio': ltv,
        'emi_inr': data.emi,
        'cibil_score': data.cibil,
        'monthly_income': data.income,
        'emp_years': data.exp,
        'income_to_emi': income_to_emi_ratio,
        'loan_amount_inr': data.loanAmount,
        'tenure_months': data.tenure
    }])
    
    # Scale features
    features_scaled = scaler.transform(features)
    
    # ML Prediction
    ml_probability = ml_model.predict_proba(features_scaled)[0, 1]
    
    # Logical Risk Engine
    logical_risk_score = 0
    explainable_factors = []
    
    # CIBIL Factor
    if data.cibil < 650:
        logical_risk_score += 35
        explainable_factors.append({
            "icon": "trending_down", "name": "CIBIL Score", "impact": "High Risk",
            "desc": "Low CIBIL score significantly increases default risk.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
    elif data.cibil < 750:
        logical_risk_score += 15
        explainable_factors.append({
            "icon": "horizontal_rule", "name": "CIBIL Score", "impact": "Medium Risk",
            "desc": "Average CIBIL score has moderate effect on risk.",
            "iconClass": "text-orange", "badgeClass": "badge-orange"
        })
    else:
        logical_risk_score += 5
        explainable_factors.append({
            "icon": "trending_up", "name": "CIBIL Score", "impact": "Low Risk",
            "desc": "Excellent CIBIL score reduces default risk.",
            "iconClass": "text-green", "badgeClass": "badge-green"
        })
        
    # Past Defaults Factor
    if data.defaults > 0:
        logical_risk_score += 25
        explainable_factors.append({
            "icon": "warning", "name": "Past Defaults", "impact": "High Risk",
            "desc": "History of defaults strongly indicates future risk.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
    else:
        logical_risk_score += 0
        explainable_factors.append({
            "icon": "check_circle", "name": "Past Defaults", "impact": "Low Risk",
            "desc": "Clean history with no prior defaults.",
            "iconClass": "text-green", "badgeClass": "badge-green"
        })
        
    # Debt Burden Factor
    if total_debt_burden_logic > 60:
        logical_risk_score += 20
        explainable_factors.append({
            "icon": "account_balance_wallet", "name": "Debt Burden", "impact": "High Risk",
            "desc": "High existing debt increases financial strain.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
    elif total_debt_burden_logic > 40:
        logical_risk_score += 10
        explainable_factors.append({
            "icon": "account_balance_wallet", "name": "Debt Burden", "impact": "Medium Risk",
            "desc": "Moderate debt burden is manageable.",
            "iconClass": "text-orange", "badgeClass": "badge-orange"
        })
    else:
        logical_risk_score += 5
        explainable_factors.append({
            "icon": "account_balance_wallet", "name": "Debt Burden", "impact": "Low Risk",
            "desc": "Low debt burden supports repayment capacity.",
            "iconClass": "text-green", "badgeClass": "badge-green"
        })
        
    # LTV Factor
    if ltv > 85:
        logical_risk_score += 15
        explainable_factors.append({
            "icon": "pie_chart", "name": "Loan to Value", "impact": "High Risk",
            "desc": "Loan amount is very close to collateral value.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
    elif ltv > 65:
        logical_risk_score += 8
        explainable_factors.append({
            "icon": "pie_chart", "name": "Loan to Value", "impact": "Medium Risk",
            "desc": "Standard Loan to Value ratio.",
            "iconClass": "text-orange", "badgeClass": "badge-orange"
        })
    else:
        logical_risk_score += 2
        explainable_factors.append({
            "icon": "pie_chart", "name": "Loan to Value", "impact": "Low Risk",
            "desc": "Safe Loan to Value ratio with high collateral buffer.",
            "iconClass": "text-green", "badgeClass": "badge-green"
        })

    # ML Score on a 0-100 scale
    ml_score = ml_probability * 100
    
    # Hybrid Final Risk Score (70% ML, 30% Logic)
    hybrid_score = (ml_score * 0.7) + (logical_risk_score * 0.3)
    
    # --- Critical Risk Overrides ---
    # 1. Income Deficit Override
    if monthlyIncome < monthlyEMI:
        hybrid_score = max(hybrid_score, 85.0)
        explainable_factors.insert(0, {
            "icon": "money_off", "name": "Income Deficit", "impact": "Critical Risk",
            "desc": "Monthly EMI strictly exceeds monthly income. Repayment is mathematically unfeasible.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
        
    # 2. Collateral Deficit Override
    if data.goldValue < data.loanAmount:
        hybrid_score = max(hybrid_score, 85.0)
        explainable_factors.insert(0, {
            "icon": "warning", "name": "Under-collateralized", "impact": "Critical Risk",
            "desc": "Loan amount exceeds the value of the gold collateral. Extremely high risk of loss.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
        
    # 3. Severe Bad Credit History Override
    if data.cibil < 649:
        hybrid_score = max(hybrid_score, 85.0)
        explainable_factors.insert(0, {
            "icon": "gavel", "name": "Poor Credit Score", "impact": "Critical Risk",
            "desc": "CIBIL score below 600 represents an unacceptable credit risk, guaranteeing a high risk classification.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
        
    # 4. Excessive Debt Burden Override
    if total_debt_burden_logic > 50:
        hybrid_score = max(hybrid_score, 85.0)
        explainable_factors.insert(0, {
            "icon": "account_balance_wallet", "name": "Excessive Debt Burden", "impact": "Critical Risk",
            "desc": "Total Debt Burden Ratio exceeding 50% indicates severe financial strain and high default risk.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })

    # 5. Multiple Past Defaults Override
    if data.defaults >= 2:
        hybrid_score = max(hybrid_score, 85.0)
        explainable_factors.insert(0, {
            "icon": "history_toggle_off", "name": "Multiple Past Defaults", "impact": "Critical Risk",
            "desc": "A history of multiple past defaults is a strict policy violation, leading to an automatic rejection.",
            "iconClass": "text-red", "badgeClass": "badge-red"
        })
        
    # Ensure it's between 0 and 100
    hybrid_score = min(max(hybrid_score, 0), 100)
    
    # Final Classification
    if hybrid_score < 35:
        risk_category = "Low Risk"
        approval_recommendation = "Approved"
    elif hybrid_score < 70:
        risk_category = "Medium Risk"
        approval_recommendation = "Review Required"
    else:
        risk_category = "High Risk"
        approval_recommendation = "Rejected"
        
    return {
        "ml_probability": float(ml_probability),
        "logical_risk_score": float(logical_risk_score),
        "hybrid_risk_score": float(hybrid_score),
        "risk_category": risk_category,
        "approval_recommendation": approval_recommendation,
        "explainable_risk_factors": explainable_factors
    }

