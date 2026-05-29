// Force scroll to top on page refresh
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    // Initial loading screen for 2 seconds
    const initialOverlay = document.getElementById('loading-overlay');
    const initialProgressBar = document.getElementById('loading-bar-fill');
    if (initialOverlay) {
        if (initialProgressBar) {
            initialProgressBar.style.width = '0%';
            initialProgressBar.style.transition = 'width 2s ease-in-out';
            setTimeout(() => {
                initialProgressBar.style.width = '100%';
            }, 10);
        }
        setTimeout(() => {
            initialOverlay.classList.add('hidden');
            // reset progress bar after hiding
            if (initialProgressBar) {
                setTimeout(() => {
                    initialProgressBar.style.transition = 'width 0s';
                    initialProgressBar.style.width = '0%';
                }, 500);
            }
        }, 2000);
    }

    const form = document.getElementById('risk-prediction-form');
    const resetBtn = document.getElementById('btn-reset');
    
    // Derived Feature Elements
    const dfOccRisk = document.getElementById('df-occ-risk');
    const dfIncomeEmi = document.getElementById('df-income-emi');
    const dfLtv = document.getElementById('df-ltv');
    const dfDebtBurden = document.getElementById('df-debt-burden');

    // Dashboard Summary Elements
    const fsOcc = document.getElementById('fs-occ');
    const fsDef = document.getElementById('fs-def');
    const fsCibil = document.getElementById('fs-cibil');
    const fsAct = document.getElementById('fs-act');
    const fsInc = document.getElementById('fs-inc');
    const fsEmp = document.getElementById('fs-emp');
    const fsLoan = document.getElementById('fs-loan');
    const fsTen = document.getElementById('fs-ten');
    const fsTotRep = document.getElementById('fs-tot-rep');
    
    // Risk Factors Container
    const factorsContainer = document.getElementById('factors-container');
    
    // Prediction Result Elements
    const riskAlert = document.getElementById('risk-alert');
    const needle = document.querySelector('.gauge-needle');
    const gaugeValue = document.querySelector('.gauge-value');
    const probNoDef = document.getElementById('prob-no-def');
    const probDef = document.getElementById('prob-def');
    const barNoDef = document.querySelector('.bg-green');
    const barDef = document.querySelector('.bg-red');
    const metaStatus = document.getElementById('meta-status');
    const metaConf = document.getElementById('meta-conf');
    const metaId = document.getElementById('meta-id');
    const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    // Build Custom Select UI
    document.querySelectorAll('select').forEach(select => {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        
        const displayValue = document.createElement('span');
        displayValue.className = 'custom-select-value';
        displayValue.textContent = select.options[select.selectedIndex].text;
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.textContent = 'expand_more';
        
        trigger.appendChild(displayValue);
        trigger.appendChild(icon);
        
        const optionsList = document.createElement('ul');
        optionsList.className = 'custom-select-options';
        
        Array.from(select.options).forEach(option => {
            if (option.disabled) return; // Skip placeholder if it's disabled
            const li = document.createElement('li');
            li.textContent = option.text;
            li.dataset.value = option.value;
            if (option.selected) li.classList.add('selected');
            
            li.addEventListener('click', () => {
                select.value = option.value;
                displayValue.textContent = option.text;
                select.dispatchEvent(new Event('change'));
                
                optionsList.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
                wrapper.classList.remove('open');
            });
            optionsList.appendChild(li);
        });
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsList);
        select.classList.add('visually-hidden');
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-wrapper').forEach(w => {
                if (w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        });
        
        select.addEventListener('change', () => {
            displayValue.textContent = select.options[select.selectedIndex].text;
            optionsList.querySelectorAll('li').forEach(li => {
                if(li.dataset.value === select.value) li.classList.add('selected');
                else li.classList.remove('selected');
            });
        });
    });

    document.addEventListener('click', (e) => {
        // Close custom selects
        document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
        
        // Handle tooltip interaction (mobile support & click outside)
        const isTooltipClick = e.target.closest('.info-tooltip-container');
        document.querySelectorAll('.info-tooltip-container').forEach(t => {
            if (t !== isTooltipClick) t.classList.remove('active');
        });
        if (isTooltipClick) {
            isTooltipClick.classList.toggle('active');
        }
    });

    const calculateEMI = (principal, ratePct, months) => {
        const r = (ratePct / 12) / 100;
        if (r === 0) return principal / months;
        return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    };
    
    const generateId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

    // Gold Collateral Logic
    const inpGoldWeight = document.getElementById('inp-gold-weight');
    const inpGoldPurity = document.getElementById('inp-gold-purity');
    const inpGoldPrice = document.getElementById('inp-gold-price');
    const inpGoldValue = document.getElementById('inp-gold-value');
    const goldStatusBadge = document.getElementById('gold-status-badge');
    const goldTimestamp = document.getElementById('gold-timestamp');

    let isApiLive = false;
    let live24KPrice = 0;

    const fallbackPrices = {
        '24': 15236,
        '22': 14510,
        '20': 13200,
        '18': 11985
    };

    const purityMultipliers = {
        '24': 1.0,
        '22': 0.916,
        '20': 0.833,
        '18': 0.750
    };

    const calculateGoldValue = () => {
        const weight = parseFloat(inpGoldWeight.value) || 0;
        let marketPrice = parseFloat(inpGoldPrice.value.replace(/[^0-9.]/g, '')) || 0;
        
        if (weight > 0 && marketPrice > 0) {
            const goldValue = weight * marketPrice;
            inpGoldValue.dataset.rawGoldValue = goldValue;
            inpGoldValue.value = formatCurrency(goldValue);
        } else {
            inpGoldValue.dataset.rawGoldValue = 0;
            inpGoldValue.value = '';
        }
    };

    const updateGoldMarketPrice = () => {
        const purity = inpGoldPurity.value;
        let pricePerGram = 0;
        
        if (isApiLive && live24KPrice > 0) {
            pricePerGram = live24KPrice * purityMultipliers[purity];
        } else {
            pricePerGram = fallbackPrices[purity] || 15236;
        }

        if (isApiLive) {
            inpGoldPrice.value = `₹${Math.round(pricePerGram)}`;
        } else {
            inpGoldPrice.value = Math.round(pricePerGram);
        }
        
        calculateGoldValue();
    };

    const fetchLiveGoldPrice = async () => {
        try {
            goldStatusBadge.className = 'badge-gray shimmer-bg';
            goldStatusBadge.innerHTML = '<span class="pulse-dot"></span> Fetching Live Rate...';
            inpGoldPrice.value = 'Fetching...';
            if(goldTimestamp) goldTimestamp.style.display = 'none';

            // Attempting to fetch from a public API
            // Because most open APIs return USD per oz or fail due to CORS,
            // we will simulate the fetch attempt and securely fallback to accurate manual values
            // while providing an actual network request mechanism for production readiness.
            const response = await fetch('https://api.metals.live/v1/spot/gold');
            if (!response.ok) throw new Error('API failed');
            
            const data = await response.json();
            const usdPerOz = parseFloat(data[0].gold);
            const usdInrRate = 83.5; // Conversion rate
            
            if (usdPerOz > 0) {
                live24KPrice = (usdPerOz / 31.1035) * usdInrRate;
                isApiLive = true;
                
                goldStatusBadge.className = 'badge-live';
                goldStatusBadge.innerHTML = '<span class="pulse-dot"></span> Live Market Rate';
                if(goldTimestamp) {
                    goldTimestamp.textContent = 'Updated just now';
                    goldTimestamp.style.display = 'flex';
                }
                
                inpGoldPrice.readOnly = true;
                inpGoldPrice.classList.remove('editable-premium');
                inpGoldPrice.classList.add('readonly-premium', 'bg-gray');
                
                updateGoldMarketPrice();
                return;
            }
            throw new Error('Invalid data');
        } catch (error) {
            console.warn('Gold API fetch failed or blocked. Switching to manual mode:', error);
            isApiLive = false;
            
            inpGoldPrice.readOnly = false;
            inpGoldPrice.classList.remove('readonly-premium', 'bg-gray');
            inpGoldPrice.classList.add('editable-premium');
            
            goldStatusBadge.className = 'badge-orange';
            goldStatusBadge.innerHTML = '<span class="material-symbols-outlined" style="font-size: 11px; margin-right: 2px;">edit</span> Manual Market Price Mode Enabled';
            if(goldTimestamp) goldTimestamp.style.display = 'none';
            
            updateGoldMarketPrice();
        }
    };

    inpGoldWeight.addEventListener('input', calculateGoldValue);
    inpGoldPurity.addEventListener('change', updateGoldMarketPrice);
    inpGoldPrice.addEventListener('input', calculateGoldValue);

    // Fetch on load
    fetchLiveGoldPrice();

    // Live EMI Calculation
    const inpLoanAmount = document.getElementById('inp-loan-amount');
    const inpTenure = document.getElementById('inp-tenure');
    const inpInterest = document.getElementById('inp-interest');
    const inpEmi = document.getElementById('inp-emi');

    const updateLiveEMI = () => {
        const p = parseFloat(inpLoanAmount.value);
        const n = parseInt(inpTenure.value);
        const rPct = parseFloat(inpInterest.value);

        if (!isNaN(p) && !isNaN(n) && !isNaN(rPct) && p > 0 && n > 0 && rPct >= 0) {
            const emi = calculateEMI(p, rPct, n);
            inpEmi.dataset.rawEmi = emi;
            inpEmi.value = formatCurrency(emi);
        } else {
            inpEmi.dataset.rawEmi = 0;
            inpEmi.value = '';
        }
    };

    [inpLoanAmount, inpTenure, inpInterest].forEach(input => {
        input.addEventListener('input', updateLiveEMI);
    });

    const simulatePrediction = async (data) => {
        // Show full-screen loading overlay
        const overlay = document.getElementById('loading-overlay');
        const progressBar = document.getElementById('loading-bar-fill');
        
        if (overlay) {
            overlay.classList.remove('hidden');
            if (progressBar) {
                progressBar.style.width = '0%';
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 2;
                    progressBar.style.width = progress + '%';
                    if (progress >= 95) clearInterval(interval);
                }, 30);
            }
        }

        try {
            const response = await fetch('https://goldfi-swb8.onrender.com/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('API Error: ' + response.statusText);
            }

            const backendData = await response.json();
            
            if (progressBar) progressBar.style.width = '100%';
            
            setTimeout(() => {
                processPrediction(data, backendData);
                if (overlay) overlay.classList.add('hidden');
                document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
            }, 500); // short delay to show 100%

        } catch (error) {
            console.error('Prediction failed:', error);
            if (overlay) overlay.classList.add('hidden');
            alert('Failed to connect to the prediction server. Ensure the backend is running.');
        }
    };

    const processPrediction = (data, backendData) => {
        // Calculations
        const monthlyEMI = data.emi;
        const activeLoans = data.activeLoans;
        const monthlyIncome = data.income;

        const incomeToEmiRatio = monthlyEMI > 0 ? (monthlyIncome / monthlyEMI).toFixed(2) : '0.00';
        const ltv = data.goldValue > 0 ? ((data.loanAmount / data.goldValue) * 100).toFixed(2) : '0.00';
        
        // Exact equation for Total Debt Burden Ratio (including proposed new loan)
        const totalDebtBurden = monthlyIncome > 0 ? (((monthlyEMI * (activeLoans + 1)) / monthlyIncome) * 100).toFixed(2) : (monthlyEMI > 0 ? '999.00' : '0.00');
        
        // Occupation Risk mapping
        const occRiskMap = {
            'salaried': { score: 20, level: 'Low Risk', class: 'badge-green' },
            'professional': { score: 10, level: 'Very Low Risk', class: 'badge-green' },
            'business': { score: 40, level: 'Medium Risk', class: 'badge-orange' },
            'other': { score: 70, level: 'High Risk', class: 'badge-red' }
        };
        const occRisk = occRiskMap[data.occupation] || occRiskMap['other'];

        // Update Derived Features
        updateDerivedFeature(dfOccRisk, occRisk.level, occRisk.class);
        
        let ratioClass = parseFloat(incomeToEmiRatio) > 2.0 ? 'badge-green' : (parseFloat(incomeToEmiRatio) > 1.0 ? 'badge-orange' : 'badge-red');
        updateDerivedFeature(dfIncomeEmi, incomeToEmiRatio + ' %', ratioClass);
        
        let ltvClass = parseFloat(ltv) > 80 ? 'badge-red' : (parseFloat(ltv) > 65 ? 'badge-orange' : 'badge-green');
        updateDerivedFeature(dfLtv, ltv + ' %', ltvClass);
        
        let dbClass = parseFloat(totalDebtBurden) < 40 ? 'badge-green' : (parseFloat(totalDebtBurden) < 60 ? 'badge-orange' : 'badge-red');
        updateDerivedFeature(dfDebtBurden, totalDebtBurden + ' %', dbClass);

        // Customer Profile Tier Logic
        let tierName = '';
        let tierColor = '';
        if (data.income >= 300000) {
            tierName = 'Diamond';
            tierColor = '#B9F2FF';
        } else if (data.income >= 100000) {
            tierName = 'Platinum';
            tierColor = '#A9C9D6';
        } else if (data.income >= 50000) {
            tierName = 'Gold';
            tierColor = '#FFD700';
        } else if (data.income >= 20000) {
            tierName = 'Silver';
            tierColor = '#C0C0C0';
        } else {
            tierName = 'Bronze';
            tierColor = '#CD7F32';
        }
        
        const cpCard = document.querySelector('.customer-profile');
        const cpTier = document.getElementById('cp-tier');
        const cpIcon = document.getElementById('cp-icon');
        const cpTitle = cpCard ? cpCard.querySelector('.card-title') : null;
        
        if (cpCard && cpTier && cpIcon) {
            cpTier.textContent = tierName;
            
            // Change background to tier color
            cpCard.style.backgroundColor = tierColor;
            cpCard.style.borderColor = tierColor; // Blend border
            
            // Determine text color for contrast (Bronze is dark enough to need white text)
            const textColor = tierName === 'Bronze' ? '#FFFFFF' : '#111111';
            const textSecondary = tierName === 'Bronze' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(17, 17, 17, 0.7)';
            
            cpCard.style.color = textColor;
            cpTier.style.color = textColor;
            cpIcon.style.color = textColor;
            if (cpTitle) cpTitle.style.color = textColor;
            
            // Update the 'Income Tier' label specifically since it has inline color var(--text-secondary)
            const cpLabel = cpCard.querySelector('span[style*="font-size: 0.7rem"]');
            if (cpLabel) {
                cpLabel.style.color = textSecondary;
            }
        }

        // Update Summary
        fsOcc.textContent = data.occupation.charAt(0).toUpperCase() + data.occupation.slice(1);
        
        let pastDefaultStr = data.defaults.toString();
        if (pastDefaultStr === '0') pastDefaultStr = 'No Default';
        else if (pastDefaultStr === '1') pastDefaultStr = 'One Default';
        else pastDefaultStr = 'Multiple Default';
        fsDef.textContent = pastDefaultStr;

        const cibilScore = parseInt(data.cibil);
        let cibilClass = '';
        if (cibilScore < 550) cibilClass = 'badge-red';
        else if (cibilScore < 650) cibilClass = 'badge-orange';
        else if (cibilScore < 700) cibilClass = 'badge-yellow';
        else if (cibilScore < 750) cibilClass = 'badge-light-green';
        else cibilClass = 'badge-green';
        fsCibil.textContent = data.cibil;
        fsCibil.className = 's-right fw-500 ' + cibilClass;

        let activeLoansStr = data.activeLoans.toString();
        if (activeLoansStr === '0') activeLoansStr = 'No';
        fsAct.textContent = activeLoansStr;
        
        fsInc.textContent = formatCurrency(data.income);
        fsEmp.textContent = data.exp + ' Yrs';
        fsLoan.textContent = formatCurrency(data.loanAmount);
        fsTen.textContent = data.tenure + ' Mos';
        
        const totalRepayment = monthlyEMI * data.tenure;
        fsTotRep.textContent = formatCurrency(totalRepayment);

        // Evaluate Risk Factors from Backend
        let factorsHtml = '';
        
        backendData.explainable_risk_factors.forEach(factor => {
            factorsHtml += createFactorItem(factor.icon, factor.name, factor.impact, factor.desc, factor.iconClass, factor.badgeClass);
        });

        factorsContainer.innerHTML = factorsHtml;

        // Final Model Prediction from backend
        let riskScore = backendData.hybrid_risk_score;
        riskScore = Math.min(Math.max(riskScore, 0), 100);
        const noDefScore = 100 - riskScore;
        
        // Update Prediction UI (Delayed to animate after scroll)
        setTimeout(() => {
            gaugeValue.textContent = riskScore.toFixed(0) + '%';
            // Needle rotation: -90deg is 0%, 90deg is 100%
            const rotation = -90 + (180 * (riskScore / 100));
            needle.style.transform = `rotate(${rotation}deg)`;
            
            probNoDef.textContent = noDefScore.toFixed(1) + '%';
            probDef.textContent = riskScore.toFixed(1) + '%';
            barNoDef.style.width = noDefScore + '%';
            barDef.style.width = riskScore + '%';
        }, 600);
        
        let statusText, statusClass, statusIcon;
        if (backendData.risk_category === "Low Risk") {
            statusText = 'LOW RISK';
            statusClass = 'badge-green';
            statusIcon = '<span class="material-symbols-outlined">gpp_good</span>';
        } else if (backendData.risk_category === "Medium Risk") {
            statusText = 'MEDIUM RISK';
            statusClass = 'badge-orange';
            statusIcon = '<span class="material-symbols-outlined">warning</span>';
        } else {
            statusText = 'HIGH RISK';
            statusClass = 'badge-red';
            statusIcon = '<span class="material-symbols-outlined">error</span>';
        }

        riskAlert.className = `risk-alert ${statusClass}`;
        riskAlert.innerHTML = `${statusIcon} ${statusText} - AI Prediction`;
        
        metaStatus.textContent = backendData.approval_recommendation;
        metaConf.textContent = 'Hybrid';
        metaId.textContent = generateId();
        
        const predictionCard = document.querySelector('.prediction-result');
        if (predictionCard) {
            if (riskScore < 50) {
                predictionCard.style.backgroundColor = 'var(--success-light)';
                predictionCard.style.borderColor = 'var(--success-light)';
            } else {
                predictionCard.style.backgroundColor = 'var(--danger-light)';
                predictionCard.style.borderColor = 'var(--danger-light)';
            }
        }
    };

    const updateDerivedFeature = (el, value, badgeClass) => {
        el.querySelector('.derived-value').textContent = value;
        const badge = el.querySelector('.derived-status');
        badge.className = `derived-status ${badgeClass}`;
        badge.textContent = 'Calculated';
    };

    const createFactorItem = (icon, name, impactText, desc, iconClass, badgeClass) => {
        return `
            <div class="factor-item">
                <span class="material-symbols-outlined ${iconClass}">${icon}</span>
                <div>
                    <div class="factor-name">${name}</div>
                    <div class="factor-desc">${desc}</div>
                </div>
                <div class="${badgeClass}">${impactText}</div>
            </div>
        `;
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const data = {
            occupation: document.getElementById('inp-occupation').value,
            defaults: parseInt(document.getElementById('inp-past-defaults').value),
            activeLoans: parseInt(document.getElementById('inp-active-loans').value),
            cibil: parseInt(document.getElementById('inp-cibil').value),
            income: parseFloat(document.getElementById('inp-income').value),
            exp: parseFloat(document.getElementById('inp-exp').value),
            loanAmount: parseFloat(inpLoanAmount.value),
            tenure: parseInt(inpTenure.value),
            interest: parseFloat(inpInterest.value),
            emi: parseFloat(inpEmi.dataset.rawEmi) || 0,
            goldValue: parseFloat(inpGoldValue.dataset.rawGoldValue) || 0
        };
        
        simulatePrediction(data);
    });
    
    resetBtn.addEventListener('click', () => {
        form.reset();
        
        // Update Custom Selects after reset
        setTimeout(() => {
            document.querySelectorAll('select').forEach(select => {
                select.dispatchEvent(new Event('change'));
            });
        }, 10);

        factorsContainer.innerHTML = `
            <div class="empty-state">
                <span class="material-symbols-outlined empty-icon">insights</span>
                <p>Submit a prediction to see risk factors.</p>
            </div>
        `;
        
        // Reset gauges and bars
        gaugeValue.textContent = '--%';
        needle.style.transform = `rotate(-90deg)`;
        probNoDef.textContent = '--%';
        probDef.textContent = '--%';
        barNoDef.style.width = '0%';
        barDef.style.width = '0%';
        riskAlert.className = 'risk-alert badge-gray';
        riskAlert.innerHTML = 'Awaiting Input';
        
        // Reset Derived
        [dfOccRisk, dfIncomeEmi, dfLtv, dfDebtBurden].forEach(el => {
            el.querySelector('.derived-value').textContent = '--';
            el.querySelector('.derived-status').className = 'derived-status badge-gray';
            el.querySelector('.derived-status').textContent = 'Pending';
        });
        
        // Reset Summary
        [fsOcc, fsDef, fsCibil, fsAct, fsInc, fsEmp, fsLoan, fsTen, fsTotRep].forEach(el => el.textContent = '--');
        
        // Reset Gold fields
        inpGoldWeight.value = '';
        inpGoldPurity.value = '22';
        inpGoldValue.value = '';
        updateGoldMarketPrice();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
