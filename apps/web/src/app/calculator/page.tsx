"use client";

import { useCallback, useState } from "react";

type Expression = {
  id: string;
  text: string;
};

export default function Calculator(): JSX.Element {
  const [expressions, setExpressions] = useState<Expression[]>([]);

  const updateLine = useCallback(
    (i: number, text: string) => {
      setExpressions((expressions) => [
        ...expressions.slice(0, i),
        { id: expressions[i].id, text },
        ...expressions.slice(i + 1),
      ]);
    },
    [setExpressions]
  );

  const deleteLine = useCallback(
    (line: number) => {
      setExpressions((expressions) => [
        ...expressions.slice(0, line),
        ...expressions.slice(line + 1),
      ]);
    },
    [setExpressions]
  );

  const addLine = useCallback(() => {
    setExpressions((expressions) =>
      expressions.concat([{ id: crypto.randomUUID(), text: "" }])
    );
  }, [setExpressions]);

  return (
    <div className="flex flex-col h-full">
      {expressions.map((expression, i) => (
        <div key={expression.id} className="flex flex-row">
          <input
            type="text"
            onChange={(e) => {
              updateLine(i, e.target.value);
            }}
          />
          <button
            onClick={() => {
              deleteLine(i);
            }}
          >
            <p>-</p>
          </button>
        </div>
      ))}
      <div key={Math.random().toString()} className="flex flex-row">
        <button
          onClick={() => {
            addLine();
          }}
        >
          <p>+</p>
        </button>
      </div>
    </div>
  );
}
