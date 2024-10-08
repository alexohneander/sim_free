"use client";

import { useState } from "react";
import styles from "../../page.module.css";
import { GearParser, ParseGearData, ParsedGear } from "../snippets/gear-parser";

export function SimCurrentGear() {
  const parsedGearList: ParsedGear[] = [];
  const [isFetched, setIsFetched] = useState(false);
  const [fetchedData, setFetchedData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState(parsedGearList);

  async function fetchSimResult(formData: FormData) {
    try {
      const response = await fetch(
        "https://sim-free.dev-null.rocks/sim/current_gear",
        {
          method: "POST",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      } else {
        setIsFetched(true);
        setFetchedData(await response.text());
      }
    } catch (err) {
      if (err instanceof Error) {
        // ✅ TypeScript knows err is Error
        console.log(err.message);
      } else {
        console.log("Unexpected error", err);
      }
    }
  }

  async function parseGearFromText() {
    setParsedData(ParseGearData());
  }

  return (
    <div>
      <div
        className={styles.loader}
        style={{
          display: `${isLoading && !isFetched ? "block" : "none"}`,
        }}
      ></div>
      <iframe
        id="renderframe"
        style={{
          display: `${isFetched ? "block" : "none"}`,
          width: "100%",
          height: "100vh",
          marginBottom: "50px",
        }}
        srcDoc={`${fetchedData}`}
      />
      <form action={fetchSimResult}>
        <div className={styles.ctas}>
          <textarea
            className={styles.textarea}
            rows={10}
            id="simcprofile"
            name="simcprofile"
            onKeyUp={() => parseGearFromText()}
            style={{
              display: `${isLoading ? "none" : "block"}`,
            }}
          />
        </div>
        <div className={styles.ctas}>
          <GearParser isVisible={!isLoading} ParsedGearList={parsedData} />
        </div>
        <div className={styles.ctas}>
          <button
            className={styles.primary}
            type="submit"
            onClick={() => setIsLoading(true)}
          >
            Run Sim
          </button>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            Read our docs
          </a>
        </div>
      </form>
    </div>
  );
}
