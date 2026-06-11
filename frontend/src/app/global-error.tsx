'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#16120b',
          color: '#fafafa',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#a3a3a3', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            The application hit an unexpected error. Please reload.
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: '#fafafa',
              color: '#16120b',
              border: 'none',
              borderRadius: 8,
              padding: '0.625rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
