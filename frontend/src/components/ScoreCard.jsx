// Circular score display used on the loan detail page
const ScoreCard = ({ score, recommendation, confidence, factors }) => {
  const pct    = Math.round(score * 100);
  const colour = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
  const label  = pct >= 70 ? 'Low Risk' : pct >= 45 ? 'Medium Risk' : 'High Risk';

  // SVG circle math
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-700 mb-4">AI Credit Score</h3>

      <div className="flex items-center gap-6">
        {/* Circular progress ring */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none"
                    stroke="#e2e8f0" strokeWidth="10"/>
            <circle cx="50" cy="50" r={r} fill="none"
                    stroke={colour} strokeWidth="10"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-mono" style={{ color: colour }}>
              {pct}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>

        {/* Score details */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold" style={{ color: colour }}>
              {label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-2">
            Confidence: {Math.round(confidence * 100)}%
          </p>
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize
            ${recommendation === 'approve' ? 'bg-green-100 text-green-700' :
              recommendation === 'reject'  ? 'bg-red-100 text-red-700' :
                                             'bg-amber-100 text-amber-700'}`}>
            Recommendation: {recommendation?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Top risk factors */}
      {factors && factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Key Factors
          </p>
          <div className="space-y-1.5">
            {factors.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">
                  {f.feature.replace(/_/g, ' ')}
                </span>
                <span className={f.direction === 'risk_increase'
                  ? 'text-red-500 text-xs' : 'text-green-500 text-xs'}>
                  {f.direction === 'risk_increase' ? '↑ risk' : '↓ risk'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreCard;