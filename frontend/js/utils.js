/**
 * MicroLend UI Utility Toolkit
 */
const Utils = {
  /**
   * Currency formatter utility
   */
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  },

  /**
   * Date formatter utility
   */
  formatDate: (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * StatusBadge Component Renderer
   */
  renderStatusBadge: (status) => {
    const defaultStatus = 'pending';
    const cleanedStatus = (status || defaultStatus).toLowerCase();
    
    const colors = {
      applied:   'bg-blue-50   text-blue-700   border-blue-200',
      reviewing: 'bg-amber-50  text-amber-700  border-amber-200',
      approved:  'bg-green-50  text-green-700  border-green-200',
      rejected:  'bg-red-50    text-red-700    border-red-200',
      disbursed: 'bg-purple-50 text-purple-700 border-purple-200',
      pending:   'bg-slate-50  text-slate-600  border-slate-200',
      paid:      'bg-green-50  text-green-700  border-green-200',
      overdue:   'bg-red-50    text-red-700    border-red-200',
      active:    'bg-blue-50   text-blue-700   border-blue-200',
      completed: 'bg-green-50  text-green-700  border-green-200'
    };

    const colorClasses = colors[cleanedStatus] || colors[defaultStatus];
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorClasses}">${cleanedStatus}</span>`;
  },

  /**
   * ScoreCard SVG Dial Renderer
   */
  renderScoreCard: (targetContainerId, scoreData) => {
    const container = document.getElementById(targetContainerId);
    if (!container || !scoreData) return;

    const { score, recommendation, confidence, factors } = scoreData;
    const pct = Math.round(score * 100);
    
    let color = '#ef4444';
    let label = 'High Risk';
    if (pct >= 70) {
      color = '#10b981';
      label = 'Low Risk';
    } else if (pct >= 45) {
      color = '#f59e0b';
      label = 'Medium Risk';
    }

    // SVG parameters matching original circle layout
    const r = 40;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    let recClass = 'bg-amber-100 text-amber-700';
    if (recommendation === 'approve') recClass = 'bg-green-100 text-green-700';
    if (recommendation === 'reject') recClass = 'bg-red-100 text-red-700';

    const cleanRecommendation = (recommendation || '').replace('_', ' ');

    // Render HTML structure natively
    let html = `
      <div class="card">
        <h3 class="font-semibold text-slate-700 mb-4" style="margin-bottom: 1rem; color: var(--slate-700); font-weight: 600;">AI Credit Score</h3>
        <div style="display: flex; align-items: center; gap: 1.5rem;">
          
          <!-- Circular Ring -->
          <div style="position: relative; width: 7rem; height: 7rem; flex-shrink: 0;">
            <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%;">
              <circle cx="50" cy="50" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="10"/>
              <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10"
                      stroke-dasharray="${dash} ${circ}" stroke-linecap="round" style="transition: stroke-dasharray 0.8s ease;"/>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span class="font-mono" style="color: ${color}; font-size: 1.5rem; font-weight: 700;">${pct}</span>
              <span style="color: var(--slate-400); font-size: 0.75rem;">/ 100</span>
            </div>
          </div>

          <!-- Score Metrics Details -->
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="color: ${color}; font-size: 1.125rem; font-weight: 600;">${label}</span>
            </div>
            <p style="color: var(--slate-400); font-size: 0.875rem; margin-bottom: 0.5rem;">
              Confidence: ${Math.round(confidence * 100)}%
            </p>
            <span class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${recClass}" style="padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;">
              Recommendation: ${cleanRecommendation}
            </span>
          </div>
        </div>
    `;

    // Process Risk Factor Elements
    if (factors && factors.length > 0) {
      html += `
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--slate-100);">
          <p style="font-size: 0.75rem; font-weight: 500; color: var(--slate-400); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
            Key Factors
          </p>
          <div style="display: flex; flex-direction: column; gap: 0.375rem;">
      `;

      factors.slice(0, 3).forEach(f => {
        const isRisk = f.direction === 'risk_increase';
        const directionalLabel = isRisk ? '↑ risk' : '↓ risk';
        const directionalColor = isRisk ? '#ef4444' : '#10b981';
        const featureName = f.feature.replace(/_/g, ' ');

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem;">
            <span style="color: var(--slate-700); text-transform: capitalize;">${featureName}</span>
            <span style="color: ${directionalColor}; font-size: 0.75rem;">${directionalLabel}</span>
          </div>
        `;
      });

      html += `</div></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
  },

  /**
   * Shared Navbar Component Builder
   */
  renderNavbar: () => {
    const user = Auth.getUser();
    if (!user) return;

    const navLinks = {
      borrower: [
        { to: 'borrower.html', label: 'Dashboard', icon: '📋' },
        { to: 'apply.html', label: 'Apply', icon: '📝' },
        { to: 'repayments.html', label: 'Repayments', icon: '💳' }
      ],
      officer: [
        { to: 'officer.html', label: 'Review Queue', icon: '📋' },
        { to: 'repayments.html?view=all', label: 'All Loans', icon: '📝' },
        { to: 'repayments.html?view=overdue', label: 'Overdue', icon: '⚠️' }
      ],
      admin: [
        { to: 'officer.html', label: 'Dashboard', icon: '📋' },
        { to: 'repayments.html?view=all', label: 'All Loans', icon: '📝' },
        { to: 'repayments.html?view=overdue', label: 'Overdue', icon: '⚠️' }
      ]
    };

    const links = navLinks[user.role] || [];
    const currentPage = window.location.pathname.split('/').pop() || '';

    let linksHTML = '';
    links.forEach(link => {
      const isActive = currentPage.startsWith(link.to.split('?')[0]);
      const activeStyle = isActive ? 'background-color: var(--primary-700); color: #ffffff;' : 'color: var(--primary-100);';
      
      linksHTML += `
        <a href="${link.to}" class="nav-item" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; text-decoration: none; transition: all 0.15s ease; ${activeStyle}">
          <span>${link.icon}</span>
          <span>${link.label}</span>
        </a>
      `;
    });

    const navbarHTML = `
      <nav style="background-color: var(--primary-900); color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="max-w: 80rem; margin: 0 auto; padding: 0 1rem; display: flex; align-items: center; justify-content: space-between; height: 4rem;">
          
          <!-- Logo element -->
          <a href="${user.role === 'officer' || user.role === 'admin' ? 'officer.html' : 'borrower.html'}" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #ffffff;">
            <div style="width: 2rem; height: 2rem; background-color: var(--accent-500); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center;">
              <span style="font-bold: 700; font-size: 0.875rem; color: var(--primary-900);">ML</span>
            </div>
            <span style="font-weight: 600; font-size: 1.125rem; letter-spacing: -0.025em;">MicroLend</span>
          </a>

          <!-- Page Routing Directory links -->
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            ${linksHTML}
          </div>

          <!-- User Identity Profile and Session Controls -->
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="text-align: right;">
              <p style="font-size: 0.875rem; font-weight: 500;">${user.full_name}</p>
              <p style="font-size: 0.75rem; color: var(--primary-300); text-transform: capitalize;">${user.role}</p>
            </div>
            <button id="nav-logout-btn" style="display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.75rem; border-radius: 0.5rem; background: none; border: none; font-size: 0.875rem; color: var(--primary-200); cursor: pointer; transition: all 0.15s ease;">
              <span>🚪</span> Logout
            </button>
          </div>

        </div>
      </nav>
    `;

    // Inject styles dynamically to handle hover events cleanly
    if (!document.getElementById('nav-hover-styles')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'nav-hover-styles';
      styleTag.innerHTML = `
        .nav-item:hover { background-color: var(--primary-700); color: #ffffff !important; }
        #nav-logout-btn:hover { background-color: var(--primary-700); color: #ffffff !important; }
      `;
      document.head.appendChild(styleTag);
    }

    // Set layout placeholder
    const headerNode = document.getElementById('global-navbar-container');
    if (headerNode) {
      headerNode.innerHTML = navbarHTML;
      document.getElementById('nav-logout-btn').addEventListener('click', () => {
        Auth.logout();
      });
    }
  }
};

window.Utils = Utils;