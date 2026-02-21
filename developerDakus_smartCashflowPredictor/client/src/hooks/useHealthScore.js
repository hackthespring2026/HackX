import { useState, useEffect, useCallback } from "react";
import { fetchHealthScore } from "../services/api";

/**
 * Custom hook for fetching the business health score.
 * Automatically re-fetches when `triggerKey` changes (e.g., after new CSV upload).
 *
 * @param {number|string} triggerKey — increment to trigger a refetch
 * @returns {{ healthData, loading, error, refetch }}
 */
function useHealthScore(triggerKey) {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchHealthScore();
            setHealthData(response.data);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                "Failed to fetch health score. Upload a CSV first.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (triggerKey) {
            fetch();
        }
    }, [triggerKey, fetch]);

    return { healthData, loading, error, refetch: fetch };
}

export default useHealthScore;
