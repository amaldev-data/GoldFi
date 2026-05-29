# GoldFi - AI-Powered Gold Loan Credit Risk Prediction

![GoldFi Hero](https://raw.githubusercontent.com/amaldev-data/GoldFi/main/UI%20Design/Hero%20.PNG)

##  Overview

**GoldFi**, AI-powered Credit Risk Prediction platform designed specifically for Gold Loan lending. It empowers financial institutions like Banks and NBFC's to make smarter, safer, and faster lending decisions by assessing borrower default risk in real-time. 

Unlike traditional black-box machine learning models, GoldFi utilizes a **Hybrid Risk Engine** that combines a predictive Machine Learning model (70%) with a strict Policy-Based Risk Control logic (30%). This ensures high prediction accuracy while strictly enforcing critical lending safeguards through automated risk overrides.

##  Key Features

- **Hybrid Risk Engine**: Blends Machine Learning probabilities with hard-coded financial logic to ensure safe lending practices.
- **Explainable AI (XAI)**: Generates human-readable insights explaining *why* a specific risk score was given (e.g., "High LTV", "Income Deficit", "Poor Credit Score").
- **Real-Time Dashboard**: A premium, responsive, and interactive frontend built with modern UI/UX principles (glassmorphism, micro-animations, dynamic gauges).
- **Critical Risk Overrides**: Automatically flags applications as "High Risk" if strict business rules are violated (e.g., EMI strictly exceeds monthly income, under-collateralized loans).
- **Live Gold Valuation Simulation**: Estimates collateral value instantly based on inputted gold weight and purity.

##  Tech Stack

### Frontend
* **HTML5 / CSS3**: Custom vanilla CSS for a highly performant, tailored, and premium aesthetic without the overhead of heavy frameworks.
* **Vanilla JavaScript (ES6)**: Manages DOM manipulation, form validation, dynamic dashboard updates, and asynchronous API calls.

### Backend
* **FastAPI**: High-performance Python web framework for serving the prediction API.
* **Uvicorn**: ASGI web server implementation for FastAPI.
* **Pydantic**: Data validation and settings management using Python type annotations.

### Machine Learning & Data Science
* **Scikit-Learn**: Used for data preprocessing, feature scaling (StandardScaler), model training, and evaluation. The final production model is **Logistic Regression**, selected based on its superior performance with a ROC-AUC score of **95.18%**.
* **XGBoost**: Evaluated as an alternative ensemble model, achieving a ROC-AUC score of 95.09%. While performance was comparable, Logistic Regression was chosen due to its slightly higher predictive accuracy, interpretability, and deployment simplicity.
* **Pandas & NumPy**: Used for data cleaning, transformation, exploratory data analysis (EDA), and feature engineering.
* **Joblib**: Used to serialize and persist trained machine learning assets, including the production model (ML_model.pkl) and feature scaler (scaler.pkl).
* **Jupyter Notebooks**: Used for exploratory data analysis, feature selection, model experimentation, performance evaluation, and training pipeline development.

## 📂 Project Structure

```text
GoldFi/
│
├── index.html              # Main application interface
├── style.css               # Styling and responsive design
├── script.js               # Frontend logic and API integration
├── Assets/                 # Images, logos, and illustrations
│
├── Backend/                # FastAPI backend and ML assets
│   ├── main.py
│   ├── ML_model.pkl
│   ├── scaler.pkl
│   └── requirements.txt
│
├── Dataset/                # Dataset and raw data files
├── Notebook/               # EDA and model training notebooks
├── UI Design/              # UI/UX design assets and mockups
│
├── README.md
├── Variables.txt
└── runtime.txt
```
##  The Hybrid Risk Engine Explained

The core of GoldFi is its Hybrid Risk Engine, which calculates the final risk score using the following formula:

**Final Risk Score = (ML Probability × 0.70) + (Logical Risk Score × 0.30)**

### 1. Machine Learning Component (70%)
The ML model predicts the probability of default based on historical data. Key features include:
* `occupation_encoded`
* `past_defaults`
* `active_loans`
* `total_debt_burden`
* `interest_rate_pct`
* `ltv_ratio`
* `emi_inr`
* `cibil_score`
* `monthly_income`
* `emp_years`
* `income_to_emi`
* `loan_amount_inr`
* `tenure_months`

### 2. Logical Risk Engine (30%)
Evaluates traditional banking metrics and adds point penalties for:
* **Poor CIBIL Scores** (< 650 adds +35 risk points)
* **Past Defaults** (> 0 adds +25 risk points)
* **High Debt Burden** (> 60% adds +20 risk points)
* **High Loan-to-Value (LTV)** (> 85% adds +15 risk points)

### 3. Critical Risk Overrides (Safety Net)
Regardless of the 70/30 split, if a borrower triggers any of the following, their score is immediately forced to **85.0+ (High Risk / Rejected)**:
* **Income Deficit**: Monthly EMI is strictly greater than monthly income.
* **Under-collateralized**: Requested loan amount is higher than the calculated gold value.
* **Severe Bad Credit**: CIBIL score is below 600.


##  UI/UX Design

The application emphasizes a **Premium FinTech Aesthetic**, utilizing:
- **Glassmorphism**: Soft, frosted glass effects on cards and tooltips.
- **Dynamic Micro-interactions**: Pulsing loading states, smooth SVG progress dials, and hover animations.
- **Visual Hierarchy**: Carefully chosen color palettes (Gold/Bronze primary, sleek grays) to direct user attention efficiently.

##  Deployment

GoldFi is deployed using a modern cloud-based architecture:

* **Frontend:** GitHub Pages (HTML, CSS, JavaScript)
* **Backend:** Render (FastAPI)
* **Machine Learning:** Scikit-Learn Logistic Regression
* **Version Control:** GitHub

### Live Links

**Frontend:**
https://amaldev-data.github.io/GoldFi/

**Backend API:**
https://goldfi-swb8.onrender.com/predict

**API Documentation:**
https://goldfi-swb8.onrender.com/docs

### Deployment Architecture

```text
GitHub Pages (Frontend)
          │
          ▼
Render FastAPI Backend
          │
          ▼
Hybrid Risk Engine
(Logistic Regression + Risk Rules)
```


---
*Developed by Amaldev K M*
