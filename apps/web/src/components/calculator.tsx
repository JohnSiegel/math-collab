"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Expression } from "./graph";
import { Graph } from "./graph";

const EditableMathField = dynamic(
  async () => (await import("react-mathquill")).EditableMathField,
  { ssr: false }
);

const kInitialSidebarWidth = 150;
const kInitialSidebarWidthPercent = 0.2;
const kSidebarSnapThreshold = 70;

const kSqrtRegex = /(?<!\\)sqrt/g;

export function Calculator(): JSX.Element {
  const [expressions, setExpressions] = useState<Expression[]>([
    { id: crypto.randomUUID(), latex: "", text: "" },
  ]);

  const [sidebarWidth, setSidebarWidth] = useState(kInitialSidebarWidth);

  const [dragging, setDragging] = useState(false);

  const mouseUpHandler = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  useEffect(() => {
    window.addEventListener("mouseup", mouseUpHandler);
    return () => {
      window.removeEventListener("mouseup", mouseUpHandler);
    };
  }, [mouseUpHandler]);

  const mouseMoveHandler = useCallback(
    (e: MouseEvent) => {
      if (dragging) {
        if (e.clientX < kSidebarSnapThreshold) {
          setSidebarWidth(0);
        } else if (e.clientX > window.innerWidth - kSidebarSnapThreshold) {
          setSidebarWidth(window.innerWidth);
        } else {
          setSidebarWidth(e.clientX);
        }
      }
    },
    [dragging, setSidebarWidth]
  );

  useEffect(() => {
    window.addEventListener("mousemove", mouseMoveHandler);
    return () => {
      window.removeEventListener("mousemove", mouseMoveHandler);
    };
  }, [mouseMoveHandler]);

  const deleteExpression = useCallback(
    (index: number) => {
      setExpressions((exprs) => [
        ...exprs.slice(0, index),
        ...exprs.slice(index + 1),
      ]);
    },
    [setExpressions]
  );

  const addExpression = useCallback(() => {
    setExpressions((exprs) => [
      ...exprs,
      {
        id: crypto.randomUUID(),
        latex: "",
        text: "",
        results: null,
      },
    ]);
  }, [setExpressions]);

  const updateExpression = useCallback(
    (newText: string, newLatex: string, index: number) => {
      setExpressions((exprs) => {
        const newExpressions = [...exprs];
        newExpressions[index].text = newText;
        newExpressions[index].latex = newLatex;
        return newExpressions;
      });
    },
    [setExpressions]
  );

  useEffect(() => {
    setSidebarWidth(window.innerWidth * kInitialSidebarWidthPercent);
  }, [setSidebarWidth]);

  const onResize = useCallback(() => {
    setSidebarWidth(Math.min(sidebarWidth, window.innerWidth));
  }, [sidebarWidth, setSidebarWidth]);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [onResize]);

  const graphWidth = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth - sidebarWidth;
    }
    return 100;
  }, [sidebarWidth]);

  const updateButtonKey = useMemo(() => crypto.randomUUID(), []);

  return (
    <div className="absolute flex flex-row w-full h-full">
      {sidebarWidth > 0 ? (
        <div
          className="flex flex-col h-full"
          style={{ width: `${sidebarWidth}px` }}
        >
          {expressions.map((expression, i) => (
            <div className="flex flex-row w-full" key={expression.id}>
              <EditableMathField
                className="w-full"
                latex={expression.latex}
                onChange={(e) => {
                  updateExpression(
                    e.text(),
                    e.latex().replaceAll(kSqrtRegex, "\\sqrt{}"),
                    i
                  );
                }}
              />
              <button
                onClick={() => {
                  if (expressions.length === 1) {
                    addExpression();
                  }
                  deleteExpression(i);
                }}
                type="button"
              >
                <p>-</p>
              </button>
            </div>
          ))}
          <div className="flex flex-row" key={updateButtonKey}>
            <button
              onClick={() => {
                addExpression();
              }}
              type="button"
            >
              <p>+</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="ml-2" />
      )}
      <div
        className="flex w-5 cursor-ew-resize justify-center"
        onMouseDownCapture={() => {
          setDragging(true);
        }}
      >
        <div className="w-0.5 bg-black" />
      </div>
      {graphWidth > 0 ? (
        <Graph expressions={expressions} width={graphWidth} />
      ) : null}
    </div>
  );
}
