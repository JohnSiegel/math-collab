"use client";

import { useCallback, useMemo, useState } from "react";
import { create, all } from "mathjs";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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
  const [expressions, setExpressions] = useState<
    { id: string; text: string }[]
  >([{ id: crypto.randomUUID(), text: "" }]);

  const functions = useMemo(() => {
    return expressions.map((expression) => {
      if (expression.text !== "") {
        try {
          return limitedCompile(expression.text);
        } catch (e) {
          if (e instanceof Error) {
            return e;
          }
        }
      }
      return null;
    });
  }, [expressions]);

  const [xRange, setXRange] = useState<[number, number]>([-10, 10]);

  const xValues = useMemo(() => {
    return math
      .range(xRange[0], xRange[1], 0.1)
      .toArray()
      .map(
        (val: math.MathNumericType | math.MathNumericType[]) =>
          val.valueOf() as number
      );
  }, [xRange]);

  const yValues = useMemo(() => {
    return functions.map((func) => {
      if (func instanceof Error) {
        return func;
      } else if (func) {
        try {
          return xValues.map((x) => func.evaluate({ x: x }) as number);
        } catch (e) {
          if (e instanceof Error) {
            return e;
          }
        }
      }
      return null;
    });
  }, [xValues, expressions]);

  const graphs = useMemo(() => {
    return yValues.flatMap((result, i) => {
      if (result && !(result instanceof Error)) {
        return {
          x: xValues,
          y: result,
          name: expressions[i].text,
        };
      }
      return [];
    });
  }, [xValues, yValues]);

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
        const newExpressions = [...expressions];
        newExpressions[index].text = newText;
        return newExpressions;
      });
    },
    [setExpressions]
  );

  const [yRange, setYRange] = useState<[number, number]>([-10, 10]);

  const onUpdatePlot = useCallback(
    (event: any) => {
      const x = [event["xaxis.range[0]"], event["xaxis.range[1]"]] as [
        number,
        number,
      ];
      const y = [event["yaxis.range[0]"], event["yaxis.range[1]"]] as [
        number,
        number,
      ];
      if (x[0] && x[1]) {
        setXRange(x);
      }
      if (y[0] && y[1]) {
        setYRange(y);
      }
    },
    [setXRange, setYRange]
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
      <Plot
        data={graphs}
        onRelayout={(event) => {
          onUpdatePlot(event);
        }}
        config={{
          autosizable: true,
          scrollZoom: true,
          responsive: true,
        }}
        layout={{
          xaxis: {
            range: xRange,
          },
          yaxis: {
            range: yRange,
          },
          dragmode: "pan",
          modebar: { orientation: "v" },
        }}
        className="w-full h-full"
      />
    </div>
  );
}
