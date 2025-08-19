"use client";

import tag_table from "@/public/json/tag_table.json";
import translation from "@/public/json/translation.json";
import { useState } from "react";

type InventoryItem = {
  id: string;
  display: string;
  count?: number;
};

export default function Inventory({ items }: { items: InventoryItem[] }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        margin: "20px 0",
      }}
    >
      <div
        style={{
          width: 352,
          height: 136 + 108 * ~~(items.length / 27),
          padding: 14,
          display: "grid",
          gridTemplateColumns: "36px 36px 36px 36px 36px 36px 36px 36px 36px",
          gridTemplateRows: "36px 36px 36px",
          backgroundSize: "cover",
          imageRendering: "pixelated",
          backgroundImage: `url(/images/inventory/inventory_${~~(items.length / 27 + 1) * 3}.png)`,
        }}
      >
        {items.map((item, i) => (
          <Item key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

function Item({ item: { id, count = 1 } }: { item: InventoryItem }) {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });

  let icon: string = id;
  let members: string[] = [];
  let chinese: string = translation[id as keyof typeof translation] ?? id;

  if (id.startsWith("#")) {
    const blocks = parseTags(id.substring(1));
    ({ icon, chinese, members } = blocks);
  }

  const displayText = (
    <span>
      {id.startsWith("#") ? "任何" : ""}
      {chinese}
      {members.length ? (
        <>
          <br />
          <br />
          {id.startsWith("#") ? "如" : ""}
          {members.map((m) => translation[m as keyof typeof translation] ?? m).join("、")}
        </>
      ) : (
        ""
      )}
    </span>
  );

  return (
    <>
      <div
        style={{
          width: 36,
          height: 36,
          padding: 2,
        }}
        onMouseMove={(e) => {
          setTooltip(() => ({ x: e.clientX + 10, y: e.clientY - 40, visible: true }));
        }}
        onMouseLeave={() => {
          setTooltip((a) => ({ ...a, visible: false }));
        }}
      >
        <div
          style={{
            position: "relative",
            width: 32,
            height: 32,
            backgroundSize: "cover",
            imageRendering: "pixelated",
            backgroundImage: `url(/images/inventory/${icon}.png)`,
          }}
        >
          {count === 1 ? (
            <></>
          ) : (
            <span
              style={{
                position: "absolute",
                top: 19,
                right: -2,
                userSelect: "none",
                fontFamily: "Minecraftia",
                fontSize: 16,
                color: "white",
                textShadow: "2px 2px 0px #3F3F3F",
              }}
            >
              {count}
            </span>
          )}
        </div>
      </div>
      {tooltip.visible && (
        <div
          style={{
            position: "fixed",
            top: tooltip.y,
            left: tooltip.x,
            maxWidth: 352,
            color: "white",
            padding: "6px 8px",
            border: "4px solid black",
            borderImage: "url(/images/inventory/tooltip.png) 4 fill repeat",
            pointerEvents: "none", // don't block mouse
            zIndex: 10,
          }}
        >
          {displayText}
        </div>
      )}
    </>
  );
}

function parseTags(id: string): { icon: string; chinese: string; members: string[] } {
  const list = tag_table[id as keyof typeof tag_table];
  if (!list) {
    throw new Error(`${id} is not a registered tag`);
  }

  const result: string[] = [];
  for (const item of list.members) {
    if (item.startsWith("#")) {
      result.push(...parseTags(item.substring(1)).members);
    } else {
      result.push(item);
    }
  }
  return { icon: list.icon, chinese: list.chinese, members: result };
}
