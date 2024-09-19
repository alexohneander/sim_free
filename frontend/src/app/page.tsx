import Image from "next/image";
import styles from "./page.module.css";
import { SimCurrentGear } from "./ui/forms/simCurrentGear";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <img
          className={styles.logo}
          src={`/img/warcraft-icon-22.png`}
          alt="Sim-Free Logo"
          width={150}
          height={150}
          // priority
        />
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
          <li>Select pieces of gear and Sim-Free will sim them</li>
        </ol>
        <SimCurrentGear />
      </main>
      <footer className={styles.footer}>
        <a
          href="https://github.com/alexohneander/sim_free/issues/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Issues
        </a>
        <a
          href="https://github.com/alexohneander/sim_free/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Project
        </a>
        <a
          href="https://alexohneander.de"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to alexohneander.de →
        </a>
      </footer>
    </div>
  );
}
