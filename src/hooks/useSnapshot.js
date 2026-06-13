import { useEffect } from 'react';

/**
 * useSnapshot hook
 * Listens for '?snapshot=...' in the URL, decodes the base64-encoded state,
 * and calls the `onLoad` callback with the parsed config and step.
 * 
 * @param {Function} onLoad - Callback called with (config, step)
 */
export default function useSnapshot(onLoad) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const snapshotStr = params.get('snapshot');
        if (snapshotStr) {
            try {
                // Decode base64 safely
                const decodedStr = decodeURIComponent(
                    escape(window.atob(snapshotStr))
                );
                const decoded = JSON.parse(decodedStr);
                if (decoded && decoded.config !== undefined) {
                    onLoad(decoded.config, decoded.step ?? -1);
                }
            } catch (e) {
                console.error("Failed to restore snapshot from URL:", e);
            }
        }
    }, [onLoad]);
}
