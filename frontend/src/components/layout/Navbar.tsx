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
                    <div className={styles.logoIcon}>✦</div>
                    <span className={styles.logoText}>HireOn</span>
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
