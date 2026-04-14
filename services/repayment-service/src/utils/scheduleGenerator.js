const generateSchedule = (loanData) => {
  const {
    loanId,
    borrowerId,
    borrowerEmail,
    borrowerName,
    amount,
    duration_months,
  } = loanData;

  const principal     = parseFloat(amount);
  const months        = parseInt(duration_months);
  const monthlyRate   = parseFloat(process.env.INTEREST_RATE_MONTHLY || 0.03);

  // CALCULATE TOTALS 
  const totalInterest    = principal * monthlyRate * months;
  const totalRepayable   = principal + totalInterest;
  const monthlyInstalment = Math.ceil(totalRepayable / months);

  // GENERATE INSTALMENT DATES 
  const instalments = [];
  const startDate = new Date();

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    instalments.push({
      instalment_number: i,
      due_date:   dueDate.toISOString().split('T')[0],
      amount_due: monthlyInstalment,
      status:     'pending',
    });
  }

  return {
    loan_id:            loanId,
    borrower_id:        borrowerId,
    borrower_email:     borrowerEmail,
    borrower_name:      borrowerName,
    principal_amount:   principal,
    interest_rate:      monthlyRate,
    duration_months:    months,
    monthly_instalment: monthlyInstalment,
    total_repayable:    totalRepayable,
    total_interest:     totalInterest,
    instalments,
  };
};

module.exports = { generateSchedule };