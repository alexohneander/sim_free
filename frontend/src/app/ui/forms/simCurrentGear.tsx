"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "../../page.module.css";

const GEAR_SLOTS = new Set([
  "head", "neck", "shoulder", "back", "chest", "wrist", "hands",
  "waist", "legs", "feet", "finger1", "finger2", "trinket1",
  "trinket2", "main_hand", "off_hand",
]);
const MAX_ITEMS_PER_COMPARISON = 20;

interface ItemCandidate {
  slot: string;
  line: string;
  itemId: string;
  name: string;
}

interface SimulationReport {
  title: string;
  html: string;
}

function parseBagItems(profile: string): ItemCandidate[] {
  const items: ItemCandidate[] = [];
  let inBagSection = false;
  let itemName = "";

  for (const rawLine of profile.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("###")) {
      inBagSection = /^###\s*Gear from Bags\s*$/i.test(line);
      itemName = "";
      continue;
    }
    if (!inBagSection) {
      continue;
    }
    if (line === "#") {
      itemName = "";
      continue;
    }

    const commentedLine = line.match(/^#\s*(.*)$/);
    if (!commentedLine) {
      itemName = "";
      continue;
    }

    const content = commentedLine[1].trim();
    const gearMatch = content.match(/^([a-z0-9_]+)=.*(?:^|,)id=(\d+)(?:,|$)/);
    if (gearMatch && GEAR_SLOTS.has(gearMatch[1])) {
      items.push({
        slot: gearMatch[1],
        line: content,
        itemId: gearMatch[2],
        name: itemName || `Item ${gearMatch[2]}`,
      });
      itemName = "";
    } else {
      itemName = content;
    }
  }

  return items;
}

function applySelectedItems(profile: string, items: ItemCandidate[]): string {
  const lines = profile.split(/\r\n|\r|\n/);

  for (const item of items) {
    const slotLine = new RegExp(`^\\s*${item.slot}=`);
    const slotIndex = lines.findIndex((line) => slotLine.test(line));
    if (slotIndex >= 0) {
      lines[slotIndex] = item.line;
    } else {
      lines.push(item.line);
    }
  }

  return lines.join("\n");
}

export function SimCurrentGear() {
  const [simulationReports, setSimulationReports] = useState<SimulationReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [simcProfile, setSimcProfile] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");

  const candidates = parseBagItems(simcProfile);
  const selectedCandidates = candidates.filter((_, index) => selectedItems.has(index));
  const selectedSlots = new Set(selectedCandidates.map((item) => item.slot));

  async function runCurrentGear() {
    setIsLoading(true);
    setErrorMessage("");
    setSimulationReports([]);

    try {
      const profiles = selectedCandidates.length > 0
        ? [
            { title: "Aktuelles Gear", profile: simcProfile },
            {
              title: "Ausgewählte Items",
              profile: applySelectedItems(simcProfile, selectedCandidates),
            },
          ]
        : [{ title: "Aktuelles Gear", profile: simcProfile }];
      const reports: SimulationReport[] = [];

      for (const sim of profiles) {
        const formData = new FormData();
        formData.set("simcprofile", sim.profile);
        const response = await fetch("/sim/current_gear", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `${sim.title}: Simulation fehlgeschlagen (HTTP ${response.status}).`,
          );
        }
        reports.push({ title: sim.title, html: await response.text() });
      }
      setSimulationReports(reports);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unbekannter Fehler.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div
        className={styles.loader}
        style={{ display: isLoading ? "block" : "none" }}
      />
      {simulationReports.length > 0 && (
        <section
          className={`${styles.simulationReports} ${
            simulationReports.length === 1 ? styles.singleSimulationReport : ""
          }`}
          aria-label="Simulationsergebnisse"
        >
          {simulationReports.map((report) => (
            <div className={styles.simulationReport} key={report.title}>
              <h2>{report.title}</h2>
              <iframe
                title={`SimulationCraft: ${report.title}`}
                srcDoc={report.html}
              />
            </div>
          ))}
        </section>
      )}
      <div className={styles.ctas}>
        <textarea
          className={styles.textarea}
          rows={10}
          id="simcprofile"
          name="simcprofile"
          value={simcProfile}
          onChange={(event) => {
            setSimcProfile(event.target.value);
            setSelectedItems(new Set());
            setSimulationReports([]);
          }}
          placeholder="SimulationCraft-Addon-Profil hier einfügen"
          disabled={isLoading}
        />
      </div>
      <section className={styles.itemCompare}>
        <h2>Items aus den Taschen auswählen</h2>
        <p>
          Ausgewählte Items ersetzen den aktuell ausgerüsteten Gegenstand im SimC-
          Profil. Pro Slot kann nur ein Item ausgewählt werden. Der SimC-HTML-Report
          enthält anschließend die Simulation mit dieser Gear-Auswahl.
        </p>
        {candidates.length === 0 ? (
          <p role="status">
            {simcProfile.trim()
              ? "Im Profil wurden keine Taschen-Items gefunden."
              : "Füge zuerst dein vollständiges SimulationCraft-Addon-Profil ein."}
          </p>
        ) : (
          <>
            <p>
              Ausgewählt: {selectedItems.size} / {candidates.length} (maximal{" "}
              {MAX_ITEMS_PER_COMPARISON} pro Simulation)
            </p>
            {candidates.map((candidate, index) => (
              <label
                className={styles.itemOption}
                key={`${candidate.slot}-${candidate.itemId}-${index}`}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.has(index)}
                  onChange={(event) => {
                    setSelectedItems((previous) => {
                      const next = new Set(previous);
                      if (event.target.checked) {
                        next.add(index);
                      } else {
                        next.delete(index);
                      }
                      return next;
                    });
                    setSimulationReports([]);
                  }}
                  disabled={
                    isLoading ||
                    (!selectedItems.has(index) &&
                      (selectedItems.size >= MAX_ITEMS_PER_COMPARISON ||
                        selectedSlots.has(candidate.slot)))
                  }
                />
                <Image
                  className={styles.itemIcon}
                  src={`https://www.raidbots.com/icon/36/id/item/${candidate.itemId}.png`}
                  alt=""
                  aria-hidden
                  width={36}
                  height={36}
                  unoptimized
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span>
                  <strong>{candidate.name}</strong>
                  <br />
                  {candidate.slot} · Item {candidate.itemId}
                </span>
              </label>
            ))}
          </>
        )}
        {errorMessage && <p className={styles.errorMessage} role="alert">{errorMessage}</p>}
        <div className={styles.ctas}>
          <button
            className={styles.secondary}
            type="button"
            onClick={runCurrentGear}
            disabled={isLoading}
          >
            {selectedCandidates.length > 0
              ? "Aktuelles Gear mit Auswahl simulieren"
              : "Nur aktuelles Gear simulieren"}
          </button>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docsLink}
          >
            Read our docs
          </a>
        </div>
      </section>
    </div>
  );
}
