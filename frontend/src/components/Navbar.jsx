import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, FileText, CreditCard } from 'lucide-react';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Role-specific navigation links
  const navLinks = {
    borrower: [
      { to: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
      { to: '/loans/apply',  label: 'Apply',        icon: FileText },
      { to: '/repayments',   label: 'Repayments',   icon: CreditCard },
    ],
    officer: [
      { to: '/dashboard',    label: 'Review Queue', icon: LayoutDashboard },
      { to: '/loans',        label: 'All Loans',    icon: FileText },
      { to: '/overdue',      label: 'Overdue',      icon: CreditCard },
    ],
    admin: [
      { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
      { to: '/loans',        label: 'All Loans',    icon: FileText },
      { to: '/overdue',      label: 'Overdue',      icon: CreditCard },
    ],
  };

  const links = navLinks[user?.role] || [];

  return (
    <nav className="bg-primary-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm text-primary-900">ML</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">MicroLend</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                           text-primary-100 hover:text-white hover:bg-primary-700
                           transition-colors duration-150"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-primary-300 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg
                         text-primary-200 hover:text-white hover:bg-primary-700
                         transition-colors text-sm"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;