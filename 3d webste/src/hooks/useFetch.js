import { useState, useEffect, useCallback } from 'react'

/**
 * useFetch
 * Custom hook to simulate API fetching or handle real fetches in the future.
 * @param {Function} mockPromiseFn - Function that returns a value or promise
 * @param {Array}    deps          - Effect dependencies
 * @returns {Object} { data, loading, error, refetch }
 */
export default function useFetch(mockPromiseFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Simulate network latency (500ms - 900ms) for high-end SaaS feel
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 400))
      
      const result = typeof mockPromiseFn === 'function' ? await mockPromiseFn() : mockPromiseFn
      setData(result)
    } catch (err) {
      console.error('API Fetch error:', err)
      setError(err.message || 'An error occurred while retrieving data.')
    } finally {
      setLoading(false)
    }
  }, [mockPromiseFn])

  useEffect(() => {
    fetchData()
  }, deps)

  return { data, loading, error, refetch: fetchData }
}
