import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default function InterviewerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <DashboardSidebar role="interviewer" />
            <main className="dash-main">
                {children}
            </main>
        </div>
    );
}
