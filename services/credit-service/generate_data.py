import pandas as pd
import numpy as np

# Fix the random seed so the same data is generated every time
np.random.seed(42)

N = 2000  # number of synthetic loan applications

#GENERATE FEATURES

monthly_income = np.random.lognormal(mean=13.0, sigma=0.7, size=N).clip(50_000, 800_000)

debt_monthly = monthly_income * np.random.beta(a=2, b=5, size=N)

loan_amount = np.random.lognormal(mean=13.5, sigma=0.6, size=N).clip(50_000, 5_000_000)

years_in_business = np.random.exponential(scale=3, size=N).clip(0.5, 20)

duration_months = np.random.choice([6, 12, 18, 24, 36, 48, 60], size=N)

sector = np.random.choice([0, 1, 2, 3, 4], size=N,
                           p=[0.30, 0.25, 0.20, 0.15, 0.10])

#DERIVE MEANINGFUL RATIOS 

# Debt-to-income ratio: what fraction of income already goes to debt
# High ratio = risky borrower
debt_to_income = debt_monthly / monthly_income

# Loan-to-income ratio: how big is the loan relative to monthly income
loan_to_income = loan_amount / monthly_income

#GENERATE REALISTIC DEFAULT LABELS 
# A borrower is more likely to default if:
#   - debt_to_income is high
#   - loan_to_income is high (loan is much bigger than income)
#   - years_in_business is low (new/unstable business)
#   - income is low

default_probability = (
    0.35 * debt_to_income +           # high debt burden = big risk factor
    0.25 * (loan_to_income / 20) +    # large loan relative to income = risk
    0.20 * (1 / (years_in_business + 1)) +  # newer business = more risk
    0.20 * (1 - monthly_income / 800_000)   # lower income = more risk
)

default_probability += np.random.normal(0, 0.05, size=N)
default_probability = default_probability.clip(0, 1)

defaulted = (default_probability > 0.45).astype(int)

#BUILD THE DATAFRAME 
df = pd.DataFrame({
    'monthly_income':    monthly_income.round(0),
    'debt_monthly':      debt_monthly.round(0),
    'loan_amount':       loan_amount.round(0),
    'years_in_business': years_in_business.round(1),
    'duration_months':   duration_months,
    'sector':            sector,
    'debt_to_income':    debt_to_income.round(4),
    'loan_to_income':    loan_to_income.round(4),
    'defaulted':         defaulted,
})

df.to_csv('training_data.csv', index=False)

print(f"✅ Generated {N} samples")
print(f"   Default rate: {defaulted.mean():.1%}")
print(f"   Sample row:\n{df.head(1).to_string()}")