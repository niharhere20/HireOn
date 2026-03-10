"use client";
import { useState } from "react";
import DashboardTopbar from "./DashboardTopbar";
import DashboardSidebar from "./DashboardSidebar";
import styles from "./DashboardShell.module.css";

interface Props {
    role: "hr" | "interviewer" | "candidate";
    children: React.ReactNode;
}

export default function DashboardShell({ role, children }: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className={styles.app}>
            <DashboardTopbar
                role={role}
                mobileOpen={mobileOpen}
                onHamburger={() => setMobileOpen((v) => !v)}
            />
            <div className={styles.body}>
                <DashboardSidebar
                    role={role}
                    mobileOpen={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                />
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}
