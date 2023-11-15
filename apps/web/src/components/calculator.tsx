"use client";

import { useCallback, useMemo, useState } from "react";
import { CalculatorPlot } from "./plot";
import { Expression } from "@/types";
import { create, all } from "mathjs";

const math = create(all);
const limitedCompile = math.compile;

math.import(
  {
    import: function () {
      throw new Error("Function import is disabled");
    },
    createUnit: function () {
      throw new Error("Function createUnit is disabled");
    },
    evaluate: function () {
      throw new Error("Function evaluate is disabled");
    },
    parse: function () {
      throw new Error("Function parse is disabled");
    },
    simplify: function () {
      throw new Error("Function simplify is disabled");
    },
  },
  { override: true }
);

export function Calculator(): JSX.Element {
  const [expressions, setExpressions] = useState<Expression[]>([
    {
      id: crypto.randomUUID(),
      text: "",
      results: null,
    },
  ]);

  const xValues = useMemo(() => {
    return math
      .range(-10, 10, 0.1)
      .toArray()
      .map(
        (val: math.MathNumericType | math.MathNumericType[]) =>
          val.valueOf() as number
      );
  }, []);

  const deleteExpression = useCallback(
    (index: number) => {
      setExpressions((expressions) => [
        ...expressions.slice(0, index),
        ...expressions.slice(index + 1),
      ]);
    },
    [setExpressions]
  );

  const addExpression = useCallback(() => {
    setExpressions((expressions) => [
      ...expressions,
      {
        id: crypto.randomUUID(),
        text: "",
        results: null,
      },
    ]);
  }, [setExpressions]);

  const updateExpression = useCallback(
    (newText: string, index: number) => {
      setExpressions((expressions) => {
        return expressions.map((expression) => {
          const isCurrent = expression.id === expressions[index].id;
          const text = isCurrent ? newText : expression.text;
          if (text !== "") {
            try {
              if (isCurrent) {
                const compiled = limitedCompile(text);
                const yValues = xValues.map((x) => compiled.evaluate({ x }));
                return {
                  id: expression.id,
                  text: text,
                  results: yValues as number[],
                };
              } else {
                return {
                  id: expression.id,
                  text: text,
                  results: expression.results,
                };
              }
            } catch (e: unknown) {
              if (e instanceof Error) {
                const error = e as Error;
                return {
                  id: expression.id,
                  text: text,
                  results: error,
                };
              }
            }
          }
          return {
            id: expression.id,
            text: text,
            results: null,
          };
        });
      });
    },
    [setExpressions]
  );

  const updateButtonKey = useMemo(() => crypto.randomUUID(), []);

  return (
    <div className="absolute flex flex-row w-full h-full">
      <div className="flex flex-col h-full">
        {expressions.map((expression, i) => (
          <div key={expression.id} className="flex flex-row">
            <input
              onChange={(e) => {
                updateExpression(e.target.value, i);
              }}
            />
            <button
              onClick={() => {
                if (expressions.length === 1) {
                  addExpression();
                }
                deleteExpression(i);
              }}
            >
              <p>-</p>
            </button>
          </div>
        ))}
        <div key={updateButtonKey} className="flex flex-row">
          <button
            onClick={() => {
              addExpression();
            }}
          >
            <p>+</p>
          </button>
        </div>
      </div>
      <CalculatorPlot xValues={xValues} expressions={expressions} />
    </div>
  );
}
