// Thin client for the interview backend.
// In dev, requests go to relative /api (proxied to localhost:3001 by Vite).
// In production, set VITE_API_BASE_URL to the deployed backend origin.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

// 65s — Render free tier can cold-start in 50-60s after sleeping; allow for that.
const TIMEOUT_MS = 65_000;
const MAX_RETRIES = 1;

// Fire a lightweight health check to wake a sleeping Render instance, so the
// first real turn doesn't hit a cold start. Safe to call repeatedly; failures
// are ignored (it's only a best-effort warm-up).
export function warmUpBackend() {
    try {
        fetch(`${API_BASE_URL}/api/health`, { method: 'GET' }).catch(() => {});
    } catch { /* ignore */ }
}

async function doFetch(payload, signal) {
    const res = await fetch(`${API_BASE_URL}/api/interview/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
    });

    if (!res.ok) {
        let message = `Interview backend error (${res.status})`;
        try {
            const data = await res.json();
            if (data?.error) message = data.error;
        } catch { /* non-JSON error body */ }
        const err = new Error(message);
        err.status = res.status;
        throw err;
    }

    return res.json();
}

export async function requestInterviewTurn({ session, history, currentQuestion, currentAnswer, currentCode, currentLanguage, currentQuery, currentDiagram }) {
    const payload = {
        session,
        history,
        current_question: currentQuestion ?? null,
        current_answer: currentAnswer ?? null,
        current_code: currentCode ?? null,
        current_language: currentLanguage ?? null,
        current_query: currentQuery ?? null,
        current_diagram: currentDiagram ?? null,
    };

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
            try {
                return await doFetch(payload, controller.signal);
            } finally {
                clearTimeout(timer);
            }
        } catch (err) {
            lastError = err;
            // Only retry on timeout / network errors, not on 4xx client errors
            const isRetryable = err.name === 'AbortError' || err.name === 'TypeError' ||
                                err.status === 502 || err.status === 504 || err.status === 429;
            if (!isRetryable || attempt >= MAX_RETRIES) break;
            // Brief pause before retry
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    if (lastError?.name === 'AbortError') {
        throw new Error('The interviewer took too long to respond. Please try again — a faster model will pick it up.');
    }
    throw lastError;
}
