import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 users
        { duration: '1m', target: 30 },  // Stay at 30 users
        { duration: '30s', target: 10 },  // Ramp down
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<3000'],
    },
};

export default function () {
    const url = 'http://localhost:3000/api/v1/tickets';

    const payload = JSON.stringify({
        title: 'Stress Test Ticket ' + Math.random().toString(36).substring(7),
        description: 'Automatic test description for performance validation',
        priority: 'Média'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 201': (r) => r.status === 201,
        'status is 429': (r) => r.status === 429,
    });

    sleep(1);
}
