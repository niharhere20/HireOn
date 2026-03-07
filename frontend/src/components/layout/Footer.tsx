export default function Footer() {
    return (
        <footer style={{
            position: 'relative', zIndex: 1, padding: 'clamp(40px, 6vw, 60px) clamp(16px, 5vw, 80px) 40px',
            borderTop: '1px solid rgba(108,71,255,.1)',
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 'clamp(24px, 4vw, 60px)', marginBottom: 48,
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 36, height: 36, background: 'linear-gradient(135deg,var(--violet),var(--pink))',
                            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                            boxShadow: '0 4px 12px rgba(108,71,255,.35)',
                        }}>✦</div>
                        <span style={{
                            fontSize: 20, fontWeight: 800,
                            background: 'linear-gradient(135deg,var(--violet),var(--pink))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>HireOn</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: 240 }}>
                        Intelligent hiring for modern teams. From resume to offer letter — all automated.
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                        {['𝕏', 'in', '▶', '★'].map((icon) => (
                            <button key={icon} style={{
                                width: 36, height: 36, borderRadius: 10, background: 'rgba(108,71,255,.08)',
                                border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>{icon}</button>
                        ))}
                    </div>
                </div>

                {[
                    { title: 'Product', links: ['Features', 'How It Works', 'Pricing', 'Changelog', 'Roadmap'] },
                    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
                    { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'GDPR', 'Security'] },
                ].map((col) => (
                    <div key={col.title}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{col.title}</h4>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {col.links.map((link) => (
                                <li key={link}>
                                    <a href="#" style={{ textDecoration: 'none', fontSize: 14, color: 'var(--text-mid)' }}>{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: 12,
                paddingTop: 28, borderTop: '1px solid rgba(108,71,255,.08)',
            }}>
                <span style={{ fontSize: 13, color: 'var(--text-lite)' }}>
                    © 2025 HireOn Technologies, Inc. All rights reserved.
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['SOC 2', 'GDPR Ready', '99.9% Uptime'].map((badge) => (
                        <span key={badge} style={{
                            padding: '4px 12px', background: 'rgba(108,71,255,.07)',
                            borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'var(--text-mid)',
                        }}>{badge}</span>
                    ))}
                </div>
            </div>
        </footer>
    );
}
