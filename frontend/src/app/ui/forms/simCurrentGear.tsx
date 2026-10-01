"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../../page.module.css";

const GEAR_SLOTS = new Set([
  "head", "neck", "shoulder", "back", "chest", "wrist", "hands",
  "waist", "legs", "feet", "finger1", "finger2", "trinket1",
  "trinket2", "main_hand", "off_hand",
]);
const MAX_SELECTED_ITEMS = 20;
const MAX_TOP_GEAR_COMBINATIONS = 100;

interface ItemCandidate {
  slot: string;
  line: string;
  itemId: string;
  name: string;
}

interface SimulationJobStatus {
  status: "queued" | "started" | "finished" | "failed";
  queue_position?: number | null;
  report?: string;
  error?: string;
}

async function pollSimulation(
  jobId: string,
  signal: AbortSignal,
  onQueueMessage: (message: string) => void,
): Promise<string> {
  while (true) {
    const response = await fetch(
      `/api/simulations/${encodeURIComponent(jobId)}`,
      { signal },
    );
    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "This simulation link has expired or does not exist."
          : `Could not read simulation status (HTTP ${response.status}).`,
      );
    }

    const job = await response.json() as SimulationJobStatus;
    if (job.status === "finished") {
      if (!job.report) {
        throw new Error("The simulation completed without a report.");
      }
      return job.report;
    }
    if (job.status === "failed") {
      throw new Error(job.error ?? "The simulation failed.");
    }

    onQueueMessage(
      job.status === "started"
        ? "Simulation is running…"
        : typeof job.queue_position === "number"
        ? `Queue position: ${job.queue_position}`
        : "Waiting in the simulation queue…",
    );
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }
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

function getActorName(profile: string): string {
  const actorLine = profile.match(
    /^(?:player|death_knight|demon_hunter|druid|evoker|hunter|mage|monk|paladin|priest|rogue|shaman|warlock|warrior)=["']?([^"'\r\n]+)["']?\s*$/m,
  );
  if (!actorLine) {
    throw new Error("Could not find the character name in the SimC profile.");
  }
  return actorLine[1].trim();
}

function getTopGearCombinationCount(items: ItemCandidate[]): number {
  if (items.length === 0) {
    return 0;
  }

  const slotOptions = new Map<string, number>();
  items.forEach(({ slot }) => {
    slotOptions.set(slot, (slotOptions.get(slot) ?? 0) + 1);
  });
  return [...slotOptions.values()].reduce(
    (count, optionCount) => count * (optionCount + 1),
    1,
  );
}

function groupItemsBySlot(items: ItemCandidate[]): Map<string, ItemCandidate[]> {
  const groupedItems = new Map<string, ItemCandidate[]>();
  items.forEach((item) => {
    const slotItems = groupedItems.get(item.slot) ?? [];
    slotItems.push(item);
    groupedItems.set(item.slot, slotItems);
  });
  return groupedItems;
}

function createTopGearProfile(profile: string, items: ItemCandidate[]): string {
  const groupedItems = groupItemsBySlot(items);
  const combinationCount = getTopGearCombinationCount(items);
  if (combinationCount > MAX_TOP_GEAR_COMBINATIONS) {
    throw new Error(
      `This selection creates ${combinationCount} combinations. Reduce it to ${MAX_TOP_GEAR_COMBINATIONS} or fewer.`,
    );
  }

  const slots = [...groupedItems.keys()];
  const combinations: ItemCandidate[][] = [];

  function buildCombinations(slotIndex: number, current: ItemCandidate[]) {
    if (slotIndex === slots.length) {
      if (current.length > 0) {
        combinations.push(current);
      }
      return;
    }

    const options = groupedItems.get(slots[slotIndex]);
    if (!options) {
      throw new Error(`No items were found for the ${slots[slotIndex]} slot.`);
    }
    buildCombinations(slotIndex + 1, current);
    options.forEach((item) =>
      buildCombinations(slotIndex + 1, [...current, item]),
    );
  }

  buildCombinations(0, []);

  const actorName = getActorName(profile);
  const copies = combinations.flatMap((combination, index) => [
    "",
    `copy="Top Gear ${index + 2},${actorName}"`,
    `### Top Gear ${index + 2}`,
    ...combination.flatMap((item) => [`# ${item.name}`, item.line]),
  ]);

  return [
    profile.trimEnd(),
    ...copies,
    "",
    "single_actor_batch=1",
    "",
  ].join("\n");
}

export function SimCurrentGear() {
  const [simulationReport, setSimulationReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queueMessage, setQueueMessage] = useState("");
  const [simcProfile, setSimcProfile] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");
  const [simulationUrl, setSimulationUrl] = useState("");
  const activeController = useRef<AbortController | null>(null);

  const watchJob = useCallback((jobId: string) => {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    setSimulationUrl(window.location.href);
    setIsLoading(true);
    setErrorMessage("");
    setSimulationReport("");
    setQueueMessage("Checking queue position…");

    void pollSimulation(jobId, controller.signal, setQueueMessage)
      .then(setSimulationReport)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
          );
          setQueueMessage("");
        }
      })
      .finally(() => {
        if (activeController.current === controller) {
          activeController.current = null;
          setIsLoading(false);
          setQueueMessage("");
        }
      });
  }, []);

  useEffect(() => {
    const loadFromUrl = () => {
      const jobId = new URLSearchParams(window.location.search).get(
        "simulation",
      );
      if (jobId) {
        watchJob(jobId);
        return;
      }

      activeController.current?.abort();
      activeController.current = null;
      setSimulationUrl("");
      setSimulationReport("");
      setQueueMessage("");
      setErrorMessage("");
      setIsLoading(false);
    };

    loadFromUrl();
    window.addEventListener("popstate", loadFromUrl);
    return () => {
      window.removeEventListener("popstate", loadFromUrl);
      activeController.current?.abort();
      activeController.current = null;
    };
  }, [watchJob]);

  const candidates = parseBagItems(simcProfile);
  const selectedCandidates = candidates.filter((_, index) =>
    selectedItems.has(index),
  );
  const topGearCombinationCount = getTopGearCombinationCount(selectedCandidates);

  async function runCurrentGear() {
    setIsLoading(true);
    setErrorMessage("");
    setQueueMessage("Submitting simulation…");
    setSimulationReport("");
    setSimulationUrl("");
    const controller = new AbortController();
    activeController.current = controller;

    try {
      const profile = selectedCandidates.length > 0
        ? createTopGearProfile(simcProfile, selectedCandidates)
        : simcProfile;
      const formData = new FormData();
      formData.set("simcprofile", profile);
      const response = await fetch("/sim/current_gear", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Simulation failed (HTTP ${response.status}).`);
      }
      const { job_id: jobId } = await response.json() as { job_id: string };
      if (!jobId) {
        throw new Error("The server did not return a simulation job ID.");
      }

      const resultUrl = new URL(window.location.href);
      resultUrl.searchParams.set("simulation", jobId);
      window.history.pushState(
        {},
        "",
        `${resultUrl.pathname}${resultUrl.search}${resultUrl.hash}`,
      );
      watchJob(jobId);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        );
        setQueueMessage("");
      }
    } finally {
      if (activeController.current === controller) {
        activeController.current = null;
        setIsLoading(false);
      }
    }
  }

  return (
    <div className={styles.simulator}>
      <section className={styles.profileCard} aria-labelledby="profile-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>01 / Character profile</p>
            <h2 id="profile-heading">Paste your SimulationCraft profile</h2>
          </div>
          <span className={styles.profileCount}>
            {simcProfile.length.toLocaleString()} characters
          </span>
        </div>
        <label className={styles.visuallyHidden} htmlFor="simcprofile">
          SimulationCraft profile
        </label>
        <textarea
          className={styles.profileInput}
          rows={12}
          id="simcprofile"
          name="simcprofile"
          value={simcProfile}
          onChange={(event) => {
            setSimcProfile(event.target.value);
            setSelectedItems(new Set());
            setSimulationReport("");
            setQueueMessage("");
          }}
          placeholder={`player=YourCharacter
...
### Gear from Bags
...`}
          disabled={isLoading}
          spellCheck={false}
        />
        <p className={styles.fieldHint}>
          Copy the complete profile from the SimulationCraft addon. Bag items
          will appear below when they are included in the profile.
        </p>
      </section>

      <section className={styles.itemCompare} aria-labelledby="bags-heading">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>02 / Optional</p>
            <h2 id="bags-heading">Compare items from your bags</h2>
          </div>
          {candidates.length > 0 && (
            <span className={styles.selectionBadge}>
              {selectedItems.size} selected
            </span>
          )}
        </div>
        <p className={styles.sectionDescription}>
          Choose up to {MAX_SELECTED_ITEMS} items. Items in the same slot are
          alternatives to your currently equipped item. The report includes
          your current gear as the baseline.
        </p>
        {candidates.length === 0 ? (
          <p className={styles.emptySelection} role="status">
            {simcProfile.trim()
              ? "No bag items were found in this profile."
              : "Paste your complete SimulationCraft addon profile to get started."}
          </p>
        ) : (
          <>
            <div className={styles.selectionSummary} aria-live="polite">
              <span>
                {selectedItems.size} of {candidates.length} bag items selected
              </span>
              <span>
                {topGearCombinationCount} / {MAX_TOP_GEAR_COMBINATIONS}{" "}
                combinations
              </span>
            </div>
            <div className={styles.itemGrid}>
              {candidates.map((candidate, index) => (
                <label
                  className={`${styles.itemOption} ${
                    selectedItems.has(index) ? styles.itemOptionSelected : ""
                  }`}
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
                      setSimulationReport("");
                    }}
                    disabled={
                      isLoading ||
                      (!selectedItems.has(index) &&
                        selectedItems.size >= MAX_SELECTED_ITEMS)
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
                  <span className={styles.itemDetails}>
                    <strong>{candidate.name}</strong>
                    <span>{candidate.slot} · Item {candidate.itemId}</span>
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
        {topGearCombinationCount > MAX_TOP_GEAR_COMBINATIONS && (
          <p className={styles.errorMessage} role="alert">
            This selection creates {topGearCombinationCount} combinations. The
            limit is {MAX_TOP_GEAR_COMBINATIONS}; remove some items or slot
            options.
          </p>
        )}
        <div className={styles.actions}>
          <button
            className={styles.runButton}
            type="button"
            onClick={runCurrentGear}
            disabled={
              isLoading ||
              topGearCombinationCount > MAX_TOP_GEAR_COMBINATIONS
            }
          >
            {selectedCandidates.length > 0
              ? "Run Top Gear simulation"
              : "Simulate current gear"}
          </button>
          <span className={styles.actionHint}>
            {selectedCandidates.length > 0
              ? `${topGearCombinationCount} gear combinations will be tested`
              : "Run a simulation with your equipped gear"}
          </span>
        </div>
      </section>

      <section className={styles.resultCard} aria-labelledby="result-heading">
        <div className={styles.resultHeader}>
          <div>
            <p className={styles.eyebrow}>03 / Results</p>
            <h2 id="result-heading">Simulation report</h2>
          </div>
          {isLoading && (
            <span className={styles.runningBadge}>
              <span className={styles.statusDot} />
              In progress
            </span>
          )}
        </div>
        {(queueMessage || errorMessage || simulationUrl) && (
          <div className={styles.resultMessages}>
            {queueMessage && (
              <p className={styles.queueMessage} role="status">
                <span className={styles.loader} aria-hidden="true" />
                {queueMessage}
              </p>
            )}
            {errorMessage && (
              <p className={styles.errorMessage} role="alert">
                {errorMessage}
              </p>
            )}
            {simulationUrl && (
              <div className={styles.shareLink}>
                <span>Share this simulation</span>
                <a href={simulationUrl}>{simulationUrl}</a>
              </div>
            )}
          </div>
        )}
        {simulationReport ? (
          <iframe
            className={styles.simulationReport}
            title="SimulationCraft result"
            srcDoc={simulationReport}
          />
        ) : (
          !isLoading && !errorMessage && (
            <div className={styles.emptyReport}>
              <span className={styles.reportMark} aria-hidden="true">
                ↗
              </span>
              <strong>Your results will appear here</strong>
              <span>
                Paste a profile and run a simulation to see your SimulationCraft
                report.
              </span>
            </div>
          )
        )}
      </section>
    </div>
  );
}
