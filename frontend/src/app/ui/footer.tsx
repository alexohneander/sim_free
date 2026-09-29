import Link from "next/link";
import styles from "../page.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerBrand}>
        <span className={styles.footerMark} aria-hidden="true">
          S
        </span>
        <div>
          <strong>SimC-Free</strong>
          <p>Open-source WoW gear simulation, self-hosted.</p>
        </div>
      </div>
      <nav className={styles.footerLinks} aria-label="Footer">
        <Link href="/docs">Documentation</Link>
        <a
          href="https://github.com/alexohneander/sim_free"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
          <span aria-hidden="true">↗</span>
        </a>
        <a
          href="https://github.com/alexohneander/sim_free/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          Report an issue
          <span aria-hidden="true">↗</span>
        </a>
      </nav>
      <p className={styles.footerCopyright}>
        Powered by SimulationCraft
      </p>
    </footer>
  );
}
