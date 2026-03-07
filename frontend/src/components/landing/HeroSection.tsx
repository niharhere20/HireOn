import styles from "./HeroSection.module.css";

export default function HeroSection() {
    return (
        <section className={styles.hero} id="dashboard">
            <div className={styles.badge}>
                <span className={styles.badgeDot} />
                Trusted by 500+ companies worldwide
            </div>

            <h1 className={styles.heading}>
                Hire brilliantly.<br />
                <span className="grad">Powered by AI.</span>
            </h1>

            <p className={styles.sub}>
                From first application to offer letter — HireOn automates your entire
                recruitment pipeline. 87% match accuracy. 10-second analysis. Zero
                scheduling stress.
            </p>

            <div className={styles.ctas}>
                <button className="btn-pri">Start Free Trial</button>
                <button className="btn-gl">▶ Watch Demo</button>
            </div>

            <div className={styles.trust}>
                <div className={styles.avatars}>
                    <span className={styles.avA}>👩</span>
                    <span className={styles.avB}>👨</span>
                    <span className={styles.avC}>👩‍💼</span>
                    <span className={styles.avD}>🧑‍💻</span>
                </div>
                <span>Join 2,400+ HR professionals already using HireOn</span>
            </div>

            {/* Dashboard Preview */}
            <div className={styles.dbOuter}>
                <div className={styles.dbGlow} />
                <div className={styles.dashboard}>
                    <div className={styles.dbBar}>
                        <div className={styles.dots}>
                            <div className={`${styles.dot} ${styles.dr}`} />
                            <div className={`${styles.dot} ${styles.dy}`} />
                            <div className={`${styles.dot} ${styles.dg}`} />
                        </div>
                        <div className={styles.dbUrl}>app.hireon.ai/dashboard</div>
                        <div className={styles.dbSearch}>🔍 Search...</div>
                    </div>

                    <div className={styles.dbContent}>
                        {/* KPI Row */}
                        <div className={styles.kpiRow}>
                            {[
                                { icon: '📥', val: '1,247', label: 'Resumes Processed', delta: '↑ 18% this month', up: true },
                                { icon: '✅', val: '342', label: 'Auto-Shortlisted', delta: '↑ 12% this month', up: true },
                                { icon: '📅', val: '89', label: 'Interviews Booked', delta: '↑ 7% this month', up: true },
                                { icon: '🎉', val: '24', label: 'Hires Made', delta: '↓ 2 vs last month', up: false },
                            ].map((kpi) => (
                                <div className="kpi" key={kpi.label}>
                                    <div className="kpi-icon">{kpi.icon}</div>
                                    <div className="kpi-val">{kpi.val}</div>
                                    <div className="kpi-lbl">{kpi.label}</div>
                                    <div className={`kpi-delta ${kpi.up ? 'up' : 'dn'}`}>{kpi.delta}</div>
                                </div>
                            ))}
                        </div>

                        {/* Candidate List Preview */}
                        <div className={styles.midRow}>
                            <div className={styles.card}>
                                <div className={styles.cardHead}>
                                    Hiring Funnel <span className="ctag">This Month</span>
                                </div>
                                <div className={styles.funnel}>
                                    {[
                                        { label: 'Applied', width: '100%', val: '1,247', cls: styles.fn1 },
                                        { label: 'Shortlisted', width: '27%', val: '342', cls: styles.fn2 },
                                        { label: 'Interviewed', width: '7%', val: '89', cls: styles.fn3 },
                                        { label: 'Hired', width: '2%', val: '24', cls: styles.fn4 },
                                    ].map((row) => (
                                        <div className={styles.fnRow} key={row.label}>
                                            <span className={styles.fnLbl}>{row.label}</span>
                                            <div className={styles.fnTrack}>
                                                <div className={`${styles.fnFill} ${row.cls}`} style={{ width: row.width }} />
                                            </div>
                                            <span className={styles.fnNum}>{row.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardHead}>
                                    Recent Candidates <span className="ctag teal">Live</span>
                                </div>
                                <div className={styles.cList}>
                                    {[
                                        { name: 'Sarah Chen', role: 'Senior React Dev · 6.5y', emoji: '👩‍💻', score: '87%', scoreCls: 'sc-hi', bg: 'linear-gradient(135deg,#ddd6fe,#a78bfa)' },
                                        { name: 'Marcus Reid', role: 'React Dev · 5.2y', emoji: '👨‍💼', score: '81%', scoreCls: 'sc-hi', bg: 'linear-gradient(135deg,#fce7f3,#f9a8d4)' },
                                        { name: 'Priya Nair', role: 'Frontend Eng · 4y', emoji: '🧑‍💻', score: '71%', scoreCls: 'sc-md', bg: 'linear-gradient(135deg,#d1fae5,#6ee7b7)' },
                                        { name: 'Lena Schwartz', role: 'UI Engineer · 3.5y', emoji: '👩‍🎨', score: 'New', scoreCls: 'sc-new', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
                                    ].map((c) => (
                                        <div className={styles.cRow} key={c.name}>
                                            <div className={styles.cAv} style={{ background: c.bg }}>{c.emoji}</div>
                                            <div className={styles.cInfo}>
                                                <div className={styles.cName}>{c.name}</div>
                                                <div className={styles.cRole}>{c.role}</div>
                                            </div>
                                            <span className={`${styles.cScore} ${c.scoreCls}`}>{c.score}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
