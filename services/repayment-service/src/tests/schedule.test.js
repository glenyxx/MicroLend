const { generateSchedule } = require('../utils/scheduleGenerator');

// Unit tests for the schedule generator — pure math, no DB needed
describe('generateSchedule()', () => {

  const baseLoan = {
    loanId:        1,
    borrowerId:    10,
    borrowerEmail: 'test@example.com',
    borrowerName:  'Test Borrower',
    amount:        600000,
    duration_months: 12,
  };

  it('should generate the correct number of instalments', () => {
    const schedule = generateSchedule(baseLoan);
    expect(schedule.instalments).toHaveLength(12);
  });

  it('should calculate total_repayable correctly with 3% monthly interest', () => {
    process.env.INTEREST_RATE_MONTHLY = '0.03';
    const schedule = generateSchedule(baseLoan);
    // total_interest = 600000 × 0.03 × 12 = 216000
    // total_repayable = 600000 + 216000 = 816000
    expect(schedule.total_interest).toBeCloseTo(216000, 0);
    expect(schedule.total_repayable).toBeCloseTo(816000, 0);
  });

  it('should set every instalment status to pending', () => {
    const schedule = generateSchedule(baseLoan);
    schedule.instalments.forEach(inst => {
      expect(inst.status).toBe('pending');
    });
  });

  it('should set due dates in the future in ascending order', () => {
    const schedule = generateSchedule(baseLoan);
    const today = new Date();
    schedule.instalments.forEach((inst, idx) => {
      const due = new Date(inst.due_date);
      expect(due > today).toBe(true);
      if (idx > 0) {
        const prev = new Date(schedule.instalments[idx - 1].due_date);
        expect(due > prev).toBe(true);
      }
    });
  });

  it('should number instalments sequentially from 1', () => {
    const schedule = generateSchedule(baseLoan);
    schedule.instalments.forEach((inst, idx) => {
      expect(inst.instalment_number).toBe(idx + 1);
    });
  });

  it('should handle a 1-month loan correctly', () => {
    const schedule = generateSchedule({ ...baseLoan, duration_months: 1 });
    expect(schedule.instalments).toHaveLength(1);
    expect(schedule.monthly_instalment).toBeGreaterThan(baseLoan.amount);
  });
});