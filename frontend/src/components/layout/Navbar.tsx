import Link from "next/link";

export default function Navbar() {
    return (
        <nav style={{
            position: 'fixed', top: 18, left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 64px)', maxWidth: 1200, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 24px', background: 'rgba(255,255,255,.78)',
            backdropFilter: 'blur(24px) saturate(180%)', border: '1px solid var(--glass-b)',
            borderRadius: 20, boxShadow: 'var(--shadow), 0 1px 0 rgba(255,255,255,.8) inset',
        }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <div style={{
                    width: 36, height: 36, background: 'linear-gradient(135deg,var(--violet),var(--pink))',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, boxShadow: '0 4px 12px rgba(108,71,255,.35)',
                }}>✦</div>
                <span style={{
                    fontSize: 20, fontWeight: 800,
                    background: 'linear-gradient(135deg,var(--violet),var(--pink))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>HireOn</span>
            </Link>

            <ul style={{ listStyle: 'none', display: 'flex', gap: 4 }}>
                {[
                    { label: 'How it Works', href: '#howitworks' },
                    { label: 'Dashboard', href: '#dashboard' },
                    { label: 'Features', href: '#' },
                    { label: 'Pricing', href: '#' },
                ].map((item) => (
                    <li key={item.label}>
                        <a href={item.href} style={{
                            display: 'block', padding: '8px 16px', textDecoration: 'none',
                            fontSize: 14, fontWeight: 500, color: 'var(--text-mid)', borderRadius: 10,
                        }}>{item.label}</a>
                    </li>
                ))}
            </ul>

            <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/login">
                    <button className="btn-ghost-nav">Log in</button>
                </Link>
                <Link href="/register">
                    <button className="btn-pri-nav">Start Free →</button>
                </Link>
            </div>
        </nav>
    );
}
