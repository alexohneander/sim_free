import styles from "../page.module.css";
import { Footer } from "./footer";
import { SimCurrentGear } from "./forms/simCurrentGear";

export function Intro() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>World of Warcraft · Gear simulator</p>
          <h1>Find your next upgrade.</h1>
          <p>
            Run SimulationCraft on your own server and compare gear
            combinations against your current setup.
          </p>
          <a
            className={styles.installLink}
            target="_blank"
            rel="noreferrer"
            href="https://github.com/simulationcraft/simc-addon"
          >
            How to install the SimulationCraft addon <span aria-hidden="true">↗</span>
          </a>
        </header>
        <SimCurrentGear />
      </main>
      <Footer />
    </div>
  );
}
