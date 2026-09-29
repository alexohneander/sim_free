import Image from "next/image";
import Link from "next/link";
import styles from "../page.module.css";
import { SimCurrentGear } from "./forms/simCurrentGear";

export function Intro() {
  return (
    <main className={styles.main}>
      <Link href="/" style={{ margin: "auto" }}>
        <Image
          className={styles.logo}
          src="/img/warcraft-icon-22.png"
          alt="Sim-Free Logo"
          width={150}
          height={150}
          priority
        />
      </Link>
      <ol>
        <li>
          Copy/paste the text from the SimulationCraft addon. {}
          <a
            className={styles.primary}
            target="_blank"
            href="https://github.com/simulationcraft/simc-addon"
          >
            How to install and use the SimC addon
          </a>
        </li>
        <li>
          Select items from <code>Gear from Bags</code> to compare Top Gear
          combinations against your current gear.
        </li>
      </ol>
      <SimCurrentGear />
    </main>
  );
}
