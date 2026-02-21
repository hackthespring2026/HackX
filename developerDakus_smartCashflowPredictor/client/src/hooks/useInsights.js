import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * Custom hook: fetches /api/financial-insights
 * Re-fetches whenever triggerKey changes.
 */
function useInsights(triggerKey = 0) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/insights");
            setData(res.data);
        } catch (err) {
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || "Failed to fetch insights.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (triggerKey > 0) fetch();
    }, [triggerKey, fetch]);

    return { insightsData: data, loading, error, refetch: fetch };
}

export default useInsights;
