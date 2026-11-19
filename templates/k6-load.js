import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const BASE = __ENV.QA_BASE_URL || 'https://[REDACTED]';

export const options = {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '10s' }],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const res = http.get(`${BASE}/api/[REDACTED]`, {
    headers: { Authorization: `Bearer ${__ENV.QA_TOKEN || '[REDACTED]'}` },
    tags: { endpoint: 'read' },
  });
  errorRate.add(res.status >= 400);
  check(res, {
    'status 200': (r) => r.status === 200,
    'latency < 2s': (r) => r.timings.duration < 2000,
  });
  if (errorRate.rate > 0.05) {
    fail(`Error rate ${(errorRate.rate * 100).toFixed(1)}% > 5% — dihentikan`);
  }
  sleep(1);
}
