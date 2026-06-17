'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1c1c1c',
          color: '#f4f4f5',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Une erreur est survenue</h1>
          <p style={{ opacity: 0.7, marginBottom: 24 }}>
            Un problème est survenu de notre côté. Réessayez ou rechargez la page.
          </p>
          {error?.digest ? (
            <p style={{ opacity: 0.5, fontSize: 12, marginBottom: 24 }}>
              Code : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#0096C7',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
