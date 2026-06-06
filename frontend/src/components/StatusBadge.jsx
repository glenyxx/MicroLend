// Displays a colour-coded pill for loan and repayment statuses
const colours = {
  applied:   'bg-blue-50   text-blue-700   border-blue-200',
  reviewing: 'bg-amber-50  text-amber-700  border-amber-200',
  approved:  'bg-green-50  text-green-700  border-green-200',
  rejected:  'bg-red-50    text-red-700    border-red-200',
  disbursed: 'bg-purple-50 text-purple-700 border-purple-200',
  pending:   'bg-slate-50  text-slate-600  border-slate-200',
  paid:      'bg-green-50  text-green-700  border-green-200',
  overdue:   'bg-red-50    text-red-700    border-red-200',
  active:    'bg-blue-50   text-blue-700   border-blue-200',
  completed: 'bg-green-50  text-green-700  border-green-200',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                    text-xs font-medium border capitalize
                    ${colours[status] || colours.pending}`}>
    {status}
  </span>
);

export default StatusBadge;