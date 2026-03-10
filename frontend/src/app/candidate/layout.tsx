import DashboardShell from "@/components/layout/DashboardShell";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell role="candidate">{children}</DashboardShell>;
}
