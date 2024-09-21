"use client";

import { useState } from "react";
import styles from "../../page.module.css";

export function SimCurrentGear() {
  const [isFetched, setIsFetched] = useState(false);
  const [fetchedData, setFetchedData] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function fetchSimResult(formData: FormData) {
    try {
      const response = await fetch("http://127.0.0.1:8000/sim/current_gear", {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: formData,
      });

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
            style={{
              display: `${isLoading ? "none" : "block"}`,
            }}
          />
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
