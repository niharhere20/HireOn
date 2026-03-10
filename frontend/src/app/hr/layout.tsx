import DashboardShell from "@/components/layout/DashboardShell";

export default function HRLayout({ children }: { children: React.ReactNode }) {
    return <DashboardShell role="hr">{children}</DashboardShell>;
}
