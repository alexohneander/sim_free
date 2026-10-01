import styles from "../page.module.css";
import { Footer } from "../ui/footer";

export default function Docs() {
  return (
    <div className={styles.page}>
      <main className={`${styles.main} ${styles.docsContent}`}>
        <h1>How to use SimC-Free</h1>
        <p>
          SimC-Free runs SimulationCraft on your own server and displays its
          interactive HTML report.
        </p>

        <h2>Run a simulation</h2>
        <ol>
          <li>
            Install the{" "}
            <a
              href="https://github.com/simulationcraft/simc-addon"
              target="_blank"
              rel="noreferrer"
            >
              SimulationCraft addon
            </a>{" "}
            in World of Warcraft.
          </li>
          <li>Generate and copy your complete character profile with the addon.</li>
          <li>Paste the profile into the text box on the home page.</li>
          <li>
            Select items from the profile&apos;s Gear from Bags section, if
            desired.
          </li>
          <li>Run the simulation and review the HTML report.</li>
        </ol>

        <h2>Top Gear combinations</h2>
        <p>
          Selected bag items are grouped by gear slot. Items in the same slot
          are alternatives to the currently equipped item. SimC tests every
          combination across the selected slots, including the original gear as
          the baseline. A run supports up to 20 selected items and 100 total
          combinations.
        </p>

        <h2>Simulation options</h2>
        <p>
          Options included at the end of a pasted profile, including Raidbots&apos;
          Simulation Options, are passed through to SimulationCraft. The
          defaults for iterations, target error, and threads are only applied
          when those options are not present in the profile.
        </p>

        <h2>Self-hosting</h2>
        <p>
          Build and run the Docker image from the project root. It includes the
          web frontend, API, and SimulationCraft.
        </p>
        <pre>
          <code>{`docker build -t sim-free .
docker run --rm -p 8000:8000 sim-free`}</code>
        </pre>
      </main>
      <Footer />
    </div>
  );
}
