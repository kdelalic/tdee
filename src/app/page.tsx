import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '2rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-0.05em' }}>
        TDEE Tracker
      </h1>
      <p style={{ maxWidth: '600px', color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
        Optimize your bulk or cut with adaptive TDEE tracking based on the nSuns methodology.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--primary)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          fontWeight: '600',
          transition: 'opacity 0.2s'
        }}>
          Get Started
        </Link>
        <Link href="/about" style={{
          padding: '0.75rem 1.5rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          fontWeight: '600'
        }}>
          Learn More
        </Link>
      </div>
    </main>
  );
}
