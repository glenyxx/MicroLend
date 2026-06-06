import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../api/authAPI';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm]       = useState({
    full_name: '', email: '', password: '', role: 'borrower'
  });
  const [loading, setLoading] = useState(false);
  const { loginUser }         = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await register(form);
      loginUser(data.user, data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700
                    to-primary-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-500 rounded-2xl flex items-center
                          justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-primary-900">ML</span>
          </div>
          <h1 className="text-3xl font-bold text-white">MicroLend</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
              <input type="text" required className="input" placeholder="Grace Fon"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" required className="input" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">I am a</label>
              <select className="input" value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="borrower">Borrower (small business owner)</option>
                <option value="officer">Loan Officer</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;