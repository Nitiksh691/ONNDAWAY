"use client";
import { useEffect, useRef, useCallback } from "react";

interface SSEOptions {
  /** Called when SSE sends an event */
  onMessage: (data: unknown) => void;
  /** Called when SSE fails and polling fallback starts */
  onFallback?: () => void;
  /** Called when SSE reconnects successfully */
  onReconnect?: () => void;
  /** How often to poll (ms) when SSE is down. Default: 8000 */
  pollIntervalMs?: number;
  /** Base delay for exponential backoff (ms). Default: 5000 */
  baseRetryMs?: number;
  /** Maximum backoff delay (ms). Default: 60000 */
  maxRetryMs?: number;
}

/**
 * Connects to /api/orders/stream via SSE.
 * If SSE fails (e.g. local MongoDB sleeping), automatically
 * switches to polling via the provided `pollFn`.
 * When SSE recovers, stops polling and resumes SSE.
 *
 * Usage:
 *   useSSEWithFallback({
 *     onMessage: (data) => { if (data.type === "order_change") mutate(); },
 *     pollFn: () => mutate(),
 *   });
 */
export function useSSEWithFallback(
  pollFn: () => void,
  options: SSEOptions = { onMessage: () => {} }
) {
  const {
    onMessage,
    onFallback,
    onReconnect,
    pollIntervalMs = 8000,
    baseRetryMs = 5000,
    maxRetryMs = 60000,
  } = options;

  const esRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isPollingRef = useRef(false);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      isPollingRef.current = false;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    onFallback?.();
    pollFn(); // immediate first poll
    pollIntervalRef.current = setInterval(pollFn, pollIntervalMs);
  }, [pollFn, onFallback, pollIntervalMs]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Close any existing connection
    esRef.current?.close();

    const es = new EventSource("/api/orders/stream");
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);

        // SSE is healthy — stop polling if it was running
        if (isPollingRef.current) {
          stopPolling();
          onReconnect?.();
        }
        retryCountRef.current = 0; // reset backoff on successful message
      } catch { /* ignore malformed SSE data */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      if (!mountedRef.current) return;

      // Start polling fallback
      startPolling();

      // Exponential backoff for SSE reconnect
      const delay = Math.min(
        baseRetryMs * Math.pow(2, retryCountRef.current),
        maxRetryMs
      );
      retryCountRef.current += 1;

      retryTimeoutRef.current = setTimeout(connect, delay);
    };
  }, [onMessage, startPolling, stopPolling, onReconnect, baseRetryMs, maxRetryMs]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      stopPolling();
    };
  }, [connect, stopPolling]);
}
