// Thin client for the interview backend (proxied to localhost:3001 in dev).

const TIMEOUT_MS = 35_000; // 35s — backend hedge fires at 4s, provider cap at 30s
const MAX_RETRIES = 1;

async function doFetch(payload, signal) {
    const res = await fetch('/api/interview/turn', {
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
