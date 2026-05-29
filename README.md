# GoldFi - AI-Powered Gold Loan Credit Risk Prediction

![GoldFi Hero](https://raw.githubusercontent.com/amaldev-data/GoldFi/main/UI%20Design/Hero%20.PNG)

## 📌 Overview

**GoldFi** is a state-of-the-art, AI-powered Credit Risk Prediction platform designed specifically for Gold Loan lending. It empowers financial institutions to make smarter, safer, and faster lending decisions by assessing borrower default risk in real-time. 

Unlike traditional black-box machine learning models, GoldFi utilizes a **Hybrid Risk Engine** that combines a predictive Machine Learning model (70%) with a strict Policy-Based Risk Control logic (30%). This ensures high prediction accuracy while strictly enforcing critical lending safeguards through automated risk overrides.

## ✨ Key Features

- **Hybrid Risk Engine**: Blends Machine Learning probabilities with hard-coded financial logic to ensure safe lending practices.
- **Explainable AI (XAI)**: Generates human-readable insights explaining *why* a specific risk score was given (e.g., "High LTV", "Income Deficit", "Poor Credit Score").
- **Real-Time Dashboard**: A premium, responsive, and interactive frontend built with modern UI/UX principles (glassmorphism, micro-animations, dynamic gauges).
- **Critical Risk Overrides**: Automatically flags applications as "High Risk" if strict business rules are violated (e.g., EMI strictly exceeds monthly income, under-collateralized loans).
- **Live Gold Valuation Simulation**: Estimates collateral value instantly based on inputted gold weight and purity.

## 🛠️ Tech Stack

### Frontend
* **HTML5 / CSS3**: Custom vanilla CSS for a highly performant, tailored, and premium aesthetic without the overhead of heavy frameworks.
* **Vanilla JavaScript (ES6)**: Manages DOM manipulation, form validation, dynamic dashboard updates, and asynchronous API calls.

### Backend
* **FastAPI**: High-performance Python web framework for serving the prediction API.
* **Uvicorn**: ASGI web server implementation for FastAPI.
* **Pydantic**: Data validation and settings management using Python type annotations.

### Machine Learning & Data Science
* **Scikit-Learn**: Used for data scaling (`StandardScaler`) and training the core classification model.
* **Pandas & NumPy**: For data manipulation, EDA, and feature engineering.
* **Joblib**: For saving and loading serialized ML models (`ML_model.pkl`) and scalers (`scaler.pkl`).
* **Jupyter Notebooks**: Used for Exploratory Data Analysis (EDA) and model training pipelines.

## 📂 Project Structure

```text
Gold Loan Project/
│
├── Backend/                 # FastAPI server and ML models
│   ├── main.py              # API application and Hybrid Risk Engine logic
│   ├── ML_model.pkl         # Trained Scikit-Learn model
│   ├── scaler.pkl           # Trained feature scaler
│   └── requirements.txt     # Python dependencies for the backend
│
├── Frontend/                # User Interface
│   ├── index.html           # Main application structure
│   ├── style.css            # Styling, animations, and responsive design
│   ├── script.js            # Frontend logic and API integration
│   └── Assets/              # Images, logos, and illustrations
│
├── Notebook/                # Data Science workflows
│   ├── Goldloan_EDA.ipynb   # Exploratory Data Analysis
│   ├── Model_training.ipynb # Model training and evaluation
│   └── gold_loan.csv        # The dataset used for training
│
├── UIUX/                    # Design assets and mockups
│   └── Presentation1/       # UI/UX screenshots and presentations
│
└── Variables.txt            # Data dictionary and risk engine documentation
```

## 🧠 The Hybrid Risk Engine Explained

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

## 🚀 Installation and Setup

### 1. Start the Backend API
You need Python installed (version 3.8+ recommended).

```bash
# Navigate to the backend directory
cd Backend

# (Optional but recommended) Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The API will now be running at `http://localhost:8000`. You can view the automatic Swagger UI documentation at `http://localhost:8000/docs`.

### 2. Launch the Frontend
Because the frontend uses vanilla HTML/CSS/JS, no build step is required. 
Simply open `Frontend/index.html` in any modern web browser.
Alternatively, for the best experience, use a local development server like VS Code Live Server.

## 📡 API Endpoints

### `POST /predict`
Evaluates applicant data and returns the final risk classification.

**Request Body:**
```json
{
  "occupation": "salaried",
  "defaults": 0,
  "activeLoans": 1,
  "cibil": 750,
  "income": 50000.0,
  "exp": 5.0,
  "loanAmount": 100000.0,
  "tenure": 12,
  "interest": 10.5,
  "emi": 8815.0,
  "goldValue": 150000.0
}
```

**Response:**
```json
{
  "ml_probability": 0.12,
  "logical_risk_score": 10.0,
  "hybrid_risk_score": 11.4,
  "risk_category": "Low Risk",
  "approval_recommendation": "Approved",
  "explainable_risk_factors": [
    {
      "icon": "trending_up",
      "name": "CIBIL Score",
      "impact": "Low Risk",
      "desc": "Excellent CIBIL score reduces default risk.",
      "iconClass": "text-green",
      "badgeClass": "badge-green"
    }
  ]
}
```

## 🎨 UI/UX Design

The application emphasizes a **Premium FinTech Aesthetic**, utilizing:
- **Glassmorphism**: Soft, frosted glass effects on cards and tooltips.
- **Dynamic Micro-interactions**: Pulsing loading states, smooth SVG progress dials, and hover animations.
- **Visual Hierarchy**: Carefully chosen color palettes (Gold/Bronze primary, sleek grays) to direct user attention efficiently.

---
*Developed for GoldFi Inc.*
