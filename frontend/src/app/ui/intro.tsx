import Image from "next/image";
import styles from "../page.module.css";
import { SimCurrentGear } from "./forms/simCurrentGear";

export function Intro() {
  return (
    <main className={styles.main}>
      <a href="/" style={{ margin: "auto" }}>
        <Image
          className={styles.logo}
          src="/img/warcraft-icon-22.png"
          alt="Sim-Free Logo"
          width={150}
          height={150}
          priority
        />
      </a>
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
          Füge weitere SimC-Itemzeilen aus deinem Inventar hinzu, wähle Items
          aus und vergleiche sie mit deinem aktuellen Gear.
        </li>
      </ol>
      <SimCurrentGear />
    </main>
  );
}
