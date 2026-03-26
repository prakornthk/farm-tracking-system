import { useState, useCallback, useEffect, useRef } from 'react';

export function useApi(apiFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Store latest apiFn in a ref so the execute closure always calls the latest version
  const apiFnRef = useRef(apiFn);
  const abortRef = useRef(null);

  useEffect(() => {
    apiFnRef.current = apiFn;
  }, [apiFn]);

  const execute = useCallback(async (...args) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const res = await apiFnRef.current(...args);
      const payload = res?.data;
      const normalizedData = payload && Object.prototype.hasOwnProperty.call(payload, 'data')
        ? payload.data
        : payload;
      setData(normalizedData);
      return normalizedData;
    } catch (err) {
      // Ignore abort errors (component unmounted mid-request)
      if (err.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        return;
      }
      const msg = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // intentionally empty — uses refs for stability

  // Cleanup: abort pending request on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
