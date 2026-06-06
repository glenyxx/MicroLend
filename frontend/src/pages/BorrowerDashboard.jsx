import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLoans } from '../api/loansAPI';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const BorrowerDashboard = () => {
  const { user }          = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoans()
      .then(res => setLoans(res.data.loans))
      .catch(() => toast.error('Could not load loans'))
      .finally(() => setLoading(false));
  }, []);

  // Summary statistics
  const stats = {
    total:    loans.length,
    active:   loans.filter(l => ['applied','reviewing','approved'].includes(l.status)).length,
    approved: loans.filter(l => l.status === 'approved' || l.status === 'disbursed').length,
    rejected: loans.filter(l => l.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Welcome, {user?.full_name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your loan applications and repayments
            </p>
          </div>
          <Link to="/loans/apply" className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} />
            Apply for Loan
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: stats.total,    icon: TrendingUp,   color: 'text-blue-600' },
            { label: 'Active',             value: stats.active,   icon: Clock,        color: 'text-amber-600' },
            { label: 'Approved',           value: stats.approved, icon: CheckCircle,  color: 'text-green-600' },
            { label: 'Rejected',           value: stats.rejected, icon: TrendingUp,   color: 'text-red-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-slate-800">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Loans table */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">My Loan Applications</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"/>
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No loan applications yet</p>
              <Link to="/loans/apply" className="btn-primary inline-flex items-center gap-2">
                <PlusCircle size={16} /> Apply for your first loan
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['ID','Purpose','Amount (XAF)','Duration','Status','Applied','Action']
                      .map(h => (
                        <th key={h} className="text-left py-3 px-2 text-xs font-medium
                                               text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loans.map(loan => (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-400">#{loan.id}</td>
                      <td className="py-3 px-2 text-slate-700 max-w-xs truncate">
                        {loan.purpose}
                      </td>
                      <td className="py-3 px-2 font-mono font-medium">
                        {parseFloat(loan.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {loan.duration_months}mo
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="py-3 px-2 text-slate-400">
                        {new Date(loan.applied_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <Link to={`/loans/${loan.id}`}
                          className="text-primary-700 hover:underline text-xs font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BorrowerDashboard;