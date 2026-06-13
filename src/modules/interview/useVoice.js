import { useCallback, useEffect, useRef, useState } from 'react';

// Web Speech API — no backend or API key needed.
// TTS (speechSynthesis) works in all modern browsers; STT (SpeechRecognition)
// is Chrome/Edge only, so each capability is feature-detected separately.
const SR = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

export const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
export const sttSupported = Boolean(SR);

// Spoken commands recognized while the mic is on.
function matchCommand(text) {
    const t = text.toLowerCase().replace(/[.,!?]/g, '').trim();
    if (/^(submit|submit answer|submit my answer|done answer|that's my answer|thats my answer)$/.test(t)) return 'submit';
    if (/^(repeat|repeat question|repeat the question|say that again|say it again)$/.test(t)) return 'repeat';
    if (/^(clear|clear answer|start over|scratch that)$/.test(t)) return 'clear';
    return null;
}

export function useVoice({ onTranscript, onCommand }) {
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const recRef = useRef(null);
    const keepAlive = useRef(false);

    // Keep latest callbacks without rebuilding the recognizer on every render.
    const cbRef = useRef({ onTranscript, onCommand });
    useEffect(() => {
        cbRef.current = { onTranscript, onCommand };
    });

    const speak = useCallback((text) => {
        if (!ttsSupported || !text) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' ').trim());
        const voices = window.speechSynthesis.getVoices();
        const v =
            voices.find((x) => /en[-_](IN|GB|US)/i.test(x.lang) && /natural|online|neural/i.test(x.name)) ||
            voices.find((x) => x.lang?.toLowerCase().startsWith('en'));
        if (v) u.voice = v;
        u.rate = 1.02;
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
    }, []);

    const stopSpeaking = useCallback(() => {
        if (ttsSupported) window.speechSynthesis.cancel();
        setSpeaking(false);
    }, []);

    const stopListening = useCallback(() => {
        keepAlive.current = false;
        try { recRef.current?.stop(); } catch { /* already stopped */ }
        setListening(false);
    }, []);

    const startListening = useCallback(() => {
        if (!sttSupported || keepAlive.current) return;
        stopSpeaking(); // don't transcribe the interviewer's own voice

        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-IN';

        rec.onresult = (e) => {
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const result = e.results[i];
                if (!result.isFinal) continue;
                const text = result[0].transcript.trim();
                if (!text) continue;
                const cmd = matchCommand(text);
                if (cmd) cbRef.current.onCommand?.(cmd);
                else cbRef.current.onTranscript?.(text);
            }
        };
        // Chrome auto-stops recognition after silence — restart while mic is "on".
        rec.onend = () => {
            if (keepAlive.current) {
                try { rec.start(); } catch { setListening(false); keepAlive.current = false; }
            } else {
                setListening(false);
            }
        };
        rec.onerror = (e) => {
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                keepAlive.current = false;
                setListening(false);
            }
        };

        recRef.current = rec;
        keepAlive.current = true;
        try {
            rec.start();
            setListening(true);
        } catch {
            keepAlive.current = false;
        }
    }, [stopSpeaking]);

    // Cleanup on unmount
    useEffect(() => () => {
        keepAlive.current = false;
        try { recRef.current?.abort(); } catch { /* noop */ }
        if (ttsSupported) window.speechSynthesis.cancel();
    }, []);

    return { speak, stopSpeaking, speaking, listening, startListening, stopListening };
}
