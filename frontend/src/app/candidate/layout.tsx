import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <DashboardSidebar role="candidate" />
            <main className="dash-main">
                {children}
            </main>
        </div>
    );
}
