"use client";

import { useState } from "react";

export default function Calculator(): JSX.Element {
  const [lines, setLines] = useState(["hi", "bye"]);

  return (
    <div className="flex flex-col h-full">
      {lines.map((line, i) => (
        <div key={i} className="flex flex-row">
          <p>{line}</p>
          <button
            onClick={() => {
              setLines(lines.slice(0, i).concat(lines.slice(i + 1)));
            }}
          >
            <p>-</p>
          </button>
        </div>
      ))}
      <div key={lines.length} className="flex flex-row">
        <button
          onClick={() => {
            setLines(lines.concat([""]));
          }}
        >
          <p>+</p>
        </button>
      </div>
    </div>
  );
}
