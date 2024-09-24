import Image from "next/image";
import styles from "./navigation.module.css";

export function Navigation() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navcontainer}>
        <div className={styles.logocontainer}>
          <a className={styles.logo} href="/">
            <Image
              className={styles.logo}
              src={`https://sim-free.dev-null.rocks/img/warcraft-icon-22.png`}
              alt="Sim-Free Logo"
              width={60}
              height={60}
              priority
            />
          </a>
        </div>

        <div className={styles.navlinkcontainer}>
          <a href="/">Home</a> |<a href="/about">About</a>
        </div>
      </div>
    </nav>
  );
}
