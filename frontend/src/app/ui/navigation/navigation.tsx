import Image from "next/image";
import Link from "next/link";
import styles from "./navigation.module.css";

export function Navigation() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navcontainer}>
        <div className={styles.logocontainer}>
          <Link className={styles.logo} href="/">
            <Image
              className={styles.logo}
              src="/img/warcraft-icon-22.png"
              alt="Sim-Free Logo"
              width={60}
              height={60}
              priority
            />
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
