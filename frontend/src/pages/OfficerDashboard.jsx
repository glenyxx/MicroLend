import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { getLoans, updateStatus } from '../api/loansAPI';
import { scoreLoan } from '../api/creditAPI';
import toast from 'react-hot-toast';

const OfficerDashboard = () => {
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [scores,  setScores]  = useState({});

  useEffect(() => {
    getLoans({ status: 'applied' })
      .then(res => setLoans(res.data.loans))
      .catch(() => toast.error('Could not load loans'))
      .finally(() => setLoading(false));
  }, []);

  const scoreApplication = async (loan) => {
    try {
      const { data } = await scoreLoan({
        monthly_income:    200000,   // officer enters these manually in a real flow
        debt_monthly:      20000,
        loan_amount:       parseFloat(loan.amount),
        years_in_business: 2,
        duration_months:   loan.duration_months,
        sector:            0,
      });
      setScores(prev => ({ ...prev, [loan.id]: data }));
    } catch {
      toast.error('Scoring failed');
    }
  };

  const moveToReview = async (loanId) => {
    try {
      await updateStatus(loanId, { status: 'reviewing', officer_notes: 'Under review' });
      setLoans(prev => prev.filter(l => l.id !== loanId));
      toast.success('Loan moved to reviewing');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="page-title mb-2">Review Queue</h1>
        <p className="text-slate-500 text-sm mb-8">
          New loan applications awaiting initial review — {loans.length} pending
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"/>
          </div>
        ) : loans.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-400">No applications pending review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map(loan => (
              <div key={loan.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-slate-400 text-sm">#{loan.id}</span>
                      <StatusBadge status={loan.status} />
                      <span className="text-sm text-slate-400">
                        {new Date(loan.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-800">{loan.borrower_name}</h3>
                    <p className="text-sm text-slate-500">{loan.borrower_email}</p>
                    <p className="text-sm text-slate-600 mt-1">{loan.purpose}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="font-mono font-semibold text-slate-800">
                        {parseFloat(loan.amount).toLocaleString()} XAF
                      </span>
                      <span className="text-slate-400">{loan.duration_months} months</span>
                    </div>
                  </div>

                  {/* Score result if fetched */}
                  {scores[loan.id] && (
                    <div className="ml-4 p-3 bg-slate-50 rounded-lg text-center min-w-24">
                      <p className="text-xs text-slate-400 mb-1">AI Score</p>
                      <p className="text-2xl font-bold font-mono text-primary-700">
                        {Math.round(scores[loan.id].credit_score * 100)}
                      </p>
                      <p className={`text-xs capitalize mt-1
                        ${scores[loan.id].recommendation === 'approve'
                          ? 'text-green-600' : scores[loan.id].recommendation === 'reject'
                          ? 'text-red-600' : 'text-amber-600'}`}>
                        {scores[loan.id].recommendation?.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => scoreApplication(loan)}
                    className="btn-secondary text-sm py-2">
                    Get AI Score
                  </button>
                  <button onClick={() => moveToReview(loan.id)}
                    className="btn-primary text-sm py-2">
                    Start Review
                  </button>
                  <Link to={`/loans/${loan.id}`}
                    className="text-sm text-primary-700 hover:underline ml-auto">
                    Full details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OfficerDashboard;