"use client";
import Link from "next/link";
import { useState } from "react";
import styles from "./Navbar.module.css";
import { useThemeStore } from "@/store/theme.store";

const NAV_LINKS = [
    { label: "How it Works", href: "#howitworks" },
    { label: "Dashboard",    href: "#dashboard" },
    { label: "Features",     href: "#" },
    { label: "Pricing",      href: "#" },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggle } = useThemeStore();

    return (
        <>
            <nav className={styles.nav}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoOrbit}>
                        <div className={styles.logoOrbitRing} />
                        <div className={styles.logoBox}>
                            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                                <rect x="2" y="3" width="4" height="16" rx="2" fill="white" opacity="0.95" />
                                <rect x="16" y="3" width="4" height="16" rx="2" fill="white" opacity="0.95" />
                                <rect x="2" y="9" width="18" height="4" rx="2" fill="white" opacity="0.95" />
                                <path d="M16 5 L20 1 M18.2 1 L20 1 L20 2.8" stroke="rgba(0,212,200,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                    <span className={`${styles.wordmark} ${theme === "dark" ? styles.lwd : styles.lwl}`}>
                        Hireon
                    </span>
                </Link>

                <ul className={styles.links}>
                    {NAV_LINKS.map((item) => (
                        <li key={item.label}>
                            <a href={item.href} className={styles.link}>{item.label}</a>
                        </li>
                    ))}
                </ul>

                <div className={styles.actions}>
                    <button onClick={toggle} className={styles.themeBtn} aria-label="Toggle theme">
                        {theme === "dark" ? "☀️" : "🌙"}
                    </button>
                    <Link href="/login">
                        <button className="btn-ghost-nav">Log in</button>
                    </Link>
                    <Link href="/register">
                        <button className="btn-pri-nav">Start Free →</button>
                    </Link>
                </div>

                <button
                    className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Toggle menu"
                >
                    <span className={styles.hamLine} />
                    <span className={styles.hamLine} />
                    <span className={styles.hamLine} />
                </button>
            </nav>

            {menuOpen && (
                <div className={styles.mobileOverlay}>
                    <button className={styles.closeBtn} onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>

                    {NAV_LINKS.map((item) => (
                        <a key={item.label} href={item.href} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                            {item.label}
                        </a>
                    ))}

                    <div className={styles.mobileDivider} />

                    <div className={styles.mobileActions}>
                        <button onClick={toggle} className={styles.themeBtn} aria-label="Toggle theme">
                            {theme === "dark" ? "☀️" : "🌙"}
                        </button>
                        <Link href="/login" onClick={() => setMenuOpen(false)}>
                            <button className="btn-ghost-nav">Log in</button>
                        </Link>
                        <Link href="/register" onClick={() => setMenuOpen(false)}>
                            <button className="btn-pri-nav">Start Free →</button>
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
