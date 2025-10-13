// src/hooks/useHeatmapPolling.js
import axios from "axios";
import { useEffect, useRef, useState } from "react";

export default function useHeatmapPolling({
    baseUrl = "http://127.0.0.1:8000/api",
    intervalMs = 10000,              // 10s
    daysWindow = 14,                 // ventana de tiempo
    params = {},                     // parámetros extra (escala_min, bbox, etc.)
}) {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);
    const abortRef = useRef(null);

    const fetchOnce = async () => {
        try {
            setLoading((prev) => (points.length ? prev : true));
            // Ventana [start, now]
            const now = new Date();
            const start = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000).toISOString();
            const end = now.toISOString();

            // cancela cualquier request colgando
            if (abortRef.current) abortRef.current.abort();
            abortRef.current = new AbortController();

            const { data } = await axios.get(`${baseUrl}/alertas/heatmap`, {
                params: { start, end, limit: 3000, ...params },
                signal: abortRef.current.signal,
            });

            setPoints(Array.isArray(data?.points) ? data.points : []);
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error("Polling heatmap error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // primera carga
        fetchOnce();

        // intervalos
        timerRef.current = setInterval(fetchOnce, intervalMs);

        // pausa si la pestaña está oculta (ahorra CPU/red)
        const onVis = () => {
            if (document.hidden) {
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
            } else if (!timerRef.current) {
                fetchOnce();
                timerRef.current = setInterval(fetchOnce, intervalMs);
            }
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            document.removeEventListener("visibilitychange", onVis);
            if (timerRef.current) clearInterval(timerRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl, intervalMs, daysWindow, JSON.stringify(params)]);

    return { points, loading, reload: fetchOnce };
}
