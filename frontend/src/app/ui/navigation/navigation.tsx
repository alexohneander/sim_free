import Image from "next/image";
import Link from "next/link";
import styles from "./navigation.module.css";

export function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <div className={styles.navcontainer}>
        <div className={styles.logocontainer}>
          <Link className={styles.logo} href="/">
            <Image
              className={styles.logoImage}
              src="/img/warcraft-icon-22.png"
              alt=""
              width={44}
              height={44}
              priority
            />
            <span className={styles.brandName}>OpenSim</span>
          </Link>
        </div>

        <div className={styles.navlinkcontainer}>
          <Link href="/">Home</Link>
          <Link href="/docs">Docs</Link>
        </div>
      </div>
    </nav>
  );
}
