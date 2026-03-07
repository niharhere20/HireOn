import styles from "./CTASection.module.css";

export default function CTASection() {
    return (
        <section className={styles.ctaSec}>
            <div className={styles.inner}>
                <div className={styles.badge}>✦ Start hiring smarter today</div>
                <h2 className={styles.heading}>
                    Your next great hire<br />is already waiting.
                </h2>
                <p className={styles.desc}>
                    Join 2,400+ companies that have transformed their recruitment with
                    HireOn. Free to start. No credit card required.
                </p>
                <div className={styles.btns}>
                    <button className={styles.btnW}>Start Free Trial →</button>
                    <button className={styles.btnGw}>Book a Demo</button>
                </div>
            </div>
        </section>
    );
}
