import DashboardShell from "@/components/layout/DashboardShell";

export default function InterviewerLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell role="interviewer">{children}</DashboardShell>;
}
