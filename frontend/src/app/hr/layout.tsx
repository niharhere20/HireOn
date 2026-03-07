import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function HRLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <DashboardSidebar role="hr" />
            <main className="dash-main">
                {children}
            </main>
        </div>
    );
}
