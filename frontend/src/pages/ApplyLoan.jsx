import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applyLoan } from '../api/loansAPI';
import { scoreLoan } from '../api/creditAPI';
import ScoreCard from '../components/ScoreCard';
import toast from 'react-hot-toast';

const SECTORS = ['Retail','Agriculture','Services','Manufacturing','Transport'];

const ApplyLoan = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: '', purpose: '', duration_months: '12',
    monthly_income: '', debt_monthly: '', years_in_business: '', sector: '0',
  });
  const [score,      setScore]      = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [scoring,    setScoring]    = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Get a preview score BEFORE submitting the application
  const previewScore = async () => {
    if (!form.monthly_income || !form.amount) {
      toast.error('Enter income and amount first for a score preview');
      return;
    }
    setScoring(true);
    try {
      const { data } = await scoreLoan({
        monthly_income:    parseFloat(form.monthly_income),
        debt_monthly:      parseFloat(form.debt_monthly) || 0,
        loan_amount:       parseFloat(form.amount),
        years_in_business: parseFloat(form.years_in_business) || 1,
        duration_months:   parseInt(form.duration_months),
        sector:            parseInt(form.sector),
      });
      setScore(data);
    } catch {
      toast.error('Could not get score preview');
    } finally {
      setScoring(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applyLoan({
        amount:          parseFloat(form.amount),
        purpose:         form.purpose,
        duration_months: parseInt(form.duration_months),
      });
      toast.success('Loan application submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="page-title mb-2">Apply for a Loan</h1>
        <p className="text-slate-500 text-sm mb-8">
          Fill in your business details to get an instant credit score preview
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Loan details */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Loan Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Loan purpose
                </label>
                <input type="text" required className="input"
                  placeholder="e.g. Purchase inventory for grocery store"
                  value={form.purpose} onChange={e => f('purpose', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount (XAF)
                </label>
                <input type="number" required min="50000" max="5000000" className="input"
                  placeholder="500000"
                  value={form.amount} onChange={e => f('amount', e.target.value)} />
                <p className="text-xs text-slate-400 mt-1">Between 50,000 and 5,000,000 XAF</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration
                </label>
                <select className="input" value={form.duration_months}
                  onChange={e => f('duration_months', e.target.value)}>
                  {[6,12,18,24,36,48,60].map(m => (
                    <option key={m} value={m}>{m} months</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Business profile (used for AI scoring preview) */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-1">Business Profile</h2>
            <p className="text-xs text-slate-400 mb-4">
              Used to generate your instant credit score preview — not stored
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monthly income (XAF)
                </label>
                <input type="number" className="input" placeholder="350000"
                  value={form.monthly_income} onChange={e => f('monthly_income', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Existing monthly debt (XAF)
                </label>
                <input type="number" className="input" placeholder="0"
                  value={form.debt_monthly} onChange={e => f('debt_monthly', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Years in business
                </label>
                <input type="number" step="0.5" className="input" placeholder="2"
                  value={form.years_in_business}
                  onChange={e => f('years_in_business', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Business sector
                </label>
                <select className="input" value={form.sector}
                  onChange={e => f('sector', e.target.value)}>
                  {SECTORS.map((s, i) => (
                    <option key={i} value={i}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" onClick={previewScore} disabled={scoring}
              className="btn-secondary mt-4 text-sm">
              {scoring ? 'Calculating...' : '🔍 Preview my credit score'}
            </button>
          </div>

          {/* Score preview */}
          {score && (
            <ScoreCard
              score={score.credit_score}
              recommendation={score.recommendation}
              confidence={score.confidence}
              factors={score.risk_factors}
            />
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting application...' : 'Submit Loan Application'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ApplyLoan;