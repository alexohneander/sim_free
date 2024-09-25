"use client";

import Image from "next/image";
import styles from "./gear-parser.module.css";
import { useState } from "react";

interface GearParserProps {
  isVisible: boolean;
  ParsedGearList: ParsedGear[];
}

export interface ParsedGear {
  id: string;
  name: string;
  active: boolean;
  image: string;
  link: string;
}

export const ParseGearData: () => ParsedGear[] = function () {
  const parsedGearList: ParsedGear[] = [];
  const textFromTextBox = getValueFromTextArea();
  const textArray = textFromTextBox.split(/\r\n|\r|\n/);

  textArray.forEach((line: string) => {
    const isGearItem = isItemGear(line);

    if (isGearItem) {
      const gearObj = line.split(",").reduce((acc, item) => {
        const keyValue = item.split("=");
        return { ...acc, [keyValue[0]]: keyValue[1] };
      }, {});

      console.log(gearObj);

      // Helpers
      const idStr = "id" as keyof typeof gearObj;
      const isActive = line.includes("#") ? false : true;

      const gear: ParsedGear = {
        id: gearObj[idStr],
        name: line,
        active: isActive,
        image:
          "https://www.raidbots.com/icon/36/id/item/" + gearObj[idStr] + ".png",
        link: "https://www.wowhead.com/item=" + gearObj[idStr],
      };

      parsedGearList.push(gear);
    }
  });

  return parsedGearList;
};

const isItemGear: (gearString: string) => boolean = function (gearString) {
  let isGearItem: boolean = false;

  if (gearString.includes("head=")) {
    isGearItem = true;
  }
  if (gearString.includes("neck=")) {
    isGearItem = true;
  }
  if (gearString.includes("shoulder=")) {
    isGearItem = true;
  }
  if (gearString.includes("back=")) {
    isGearItem = true;
  }
  if (gearString.includes("chest=")) {
    isGearItem = true;
  }
  // if (gearString.includes("shirt=")) {
  //   isGearItem = true;
  // }
  // if (gearString.includes("tabard=")) {
  //   isGearItem = true;
  // }
  if (gearString.includes("wrist=")) {
    isGearItem = true;
  }
  if (gearString.includes("hands=")) {
    isGearItem = true;
  }
  if (gearString.includes("waist=")) {
    isGearItem = true;
  }
  if (gearString.includes("legs=")) {
    isGearItem = true;
  }
  if (gearString.includes("feet=")) {
    isGearItem = true;
  }
  if (gearString.includes("finger1=")) {
    isGearItem = true;
  }
  if (gearString.includes("finger2=")) {
    isGearItem = true;
  }
  if (gearString.includes("trinket1=")) {
    isGearItem = true;
  }
  if (gearString.includes("trinket2=")) {
    isGearItem = true;
  }
  if (gearString.includes("main_hand=")) {
    isGearItem = true;
  }

  return isGearItem;
};

const getValueFromTextArea: () => string = function () {
  const textAreaElement = document.getElementById(
    "simcprofile",
  ) as HTMLInputElement;

  const textFromTextBox = textAreaElement.value;

  return textFromTextBox;
};

export function GearParser(props: GearParserProps) {
  const [showGearList, setShowGearList] = useState(false);

  function toggleSetShowGearList(showGearList: boolean) {
    if (showGearList === true) {
      setShowGearList(false);
    } else {
      setShowGearList(true);
    }
  }

  return (
    <div
      className={styles.gearcontainer}
      style={{
        display: `${props.isVisible ? "block" : "none"}`,
      }}
      onClick={() => toggleSetShowGearList(showGearList)}
    >
      <div
        className={styles.geardropdown}
        style={{
          display: `${showGearList ? "block" : "none"}`,
        }}
      >
        {props.ParsedGearList.map((gear: ParsedGear, index: number) => {
          return (
            <div
              className={styles.gearitem}
              key={index}
              style={{
                border: `${gear.active ? "1px solid green" : "1px solid blue"}`,
              }}
            >
              <a href={gear.link} target="_blank">
                <Image
                  aria-hidden
                  src={gear.image}
                  alt={gear.name}
                  width={35}
                  height={35}
                />
                <p>{gear.name}</p>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
