from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry

registry = CollectorRegistry()

# Total scoring requests
scoring_requests_total = Counter(
    'credit_service_scoring_requests_total',
    'Total number of credit scoring requests',
    ['recommendation'],   # 'approve', 'reject', 'manual_review'
    registry=registry
)

# Histogram of how long scoring takes
scoring_duration_seconds = Histogram(
    'credit_service_scoring_duration_seconds',
    'Time taken to compute a credit score',
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0],
    registry=registry
)

# Gauge — average credit score of the last 100 requests
average_credit_score = Gauge(
    'credit_service_average_credit_score',
    'Rolling average credit score of recent requests',
    registry=registry
)

# Counter — total approve vs reject decisions
decisions_total = Counter(
    'credit_service_decisions_total',
    'Total approve and reject decisions made',
    ['decision'],
    registry=registry
)