import styles from "./StatsSection.module.css";

export default function StatsSection() {
    const stats = [
        { num: "80%", label: "Reduction in resume screening time" },
        { num: "90%", label: "Interview scheduling fully automated" },
        { num: "60%", label: "Faster overall time-to-hire" },
        { num: "30h", label: "HR hours saved every single week" },
    ];

    return (
        <section className={styles.statsSec}>
            <div className={styles.inner}>
                {stats.map((stat) => (
                    <div className={styles.card} key={stat.label}>
                        <span className={styles.num}>{stat.num}</span>
                        <div className={styles.lbl}>{stat.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
