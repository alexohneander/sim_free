"use client";

import Image from "next/image";
import { useState } from "react";
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
  const [simcProfile, setSimcProfile] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");

  const candidates = parseBagItems(simcProfile);
  const selectedCandidates = candidates.filter((_, index) =>
    selectedItems.has(index),
  );
  const topGearCombinationCount = getTopGearCombinationCount(selectedCandidates);

  async function runCurrentGear() {
    setIsLoading(true);
    setErrorMessage("");
    setSimulationReport("");

    try {
      const profile = selectedCandidates.length > 0
        ? createTopGearProfile(simcProfile, selectedCandidates)
        : simcProfile;
      const formData = new FormData();
      formData.set("simcprofile", profile);
      const response = await fetch("/sim/current_gear", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Simulation failed (HTTP ${response.status}).`);
      }
      setSimulationReport(await response.text());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "An unexpected error occurred.",
      );
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
      {simulationReport && (
        <iframe
          className={styles.simulationReport}
          title="SimulationCraft Ergebnis"
          srcDoc={simulationReport}
        />
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
            setSimulationReport("");
          }}
          placeholder="Paste your SimulationCraft addon profile here"
          disabled={isLoading}
        />
      </div>
      <section className={styles.itemCompare}>
        <h2>Select items from your bags</h2>
        <p>
          Choose up to {MAX_SELECTED_ITEMS} items. Items in the same slot are
          alternatives to your currently equipped item. The report includes
          every combination, including your current gear. Each run supports up
          to {MAX_TOP_GEAR_COMBINATIONS} combinations.
        </p>
        {candidates.length === 0 ? (
          <p role="status">
            {simcProfile.trim()
              ? "No bag items were found in this profile."
              : "Paste your complete SimulationCraft addon profile to get started."}
          </p>
        ) : (
          <>
            <p>
              Selected: {selectedItems.size} / {candidates.length} items ·{" "}
              {topGearCombinationCount} combination(s)
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
                <span>
                  <strong>{candidate.name}</strong>
                  <br />
                  {candidate.slot} · Item {candidate.itemId}
                </span>
              </label>
            ))}
          </>
        )}
        {topGearCombinationCount > MAX_TOP_GEAR_COMBINATIONS && (
          <p className={styles.errorMessage} role="alert">
            This selection creates {topGearCombinationCount} combinations. The
            limit is {MAX_TOP_GEAR_COMBINATIONS}; remove some items or slot
            options.
          </p>
        )}
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}
        <div className={styles.ctas}>
          <button
            className={styles.secondary}
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
