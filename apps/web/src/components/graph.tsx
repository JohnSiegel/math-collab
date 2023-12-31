"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { create, all } from "mathjs";
import { parseTex } from "tex-math-parser";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface Expression {
  id: string;
  text: string;
  latex: string;
}

const math = create(all);

const kGraphLOD = 500;

const kLog = "\\log_";

function groupPosition(
  latex: string,
  groupBegin: string,
  groupEnd: string
): number {
  let pos = 0;
  let depth = 0;
  if (latex.slice(0, groupBegin.length) !== groupBegin) {
    return 1;
  }
  pos += groupBegin.length;
  depth++;
  while (depth > 0) {
    if (latex.slice(pos, pos + groupBegin.length) === groupBegin) {
      depth++;
      pos += groupBegin.length;
    } else if (latex.slice(pos, pos + groupEnd.length) === groupEnd) {
      depth--;
      pos += groupEnd.length;
    } else {
      pos++;
    }
  }
  return pos;
}
const kLeftParen = "\\left(";
const kRightParen = "\\right)";

function transformLogBases(latex: string): string {
  console.log(latex);
  let logIndex = latex.indexOf(kLog);
  while (logIndex !== -1) {
    const logSuffix = logIndex + kLog.length;
    const baseEnd = groupPosition(latex.slice(logSuffix), "{", "}") + logSuffix;
    const base = latex.slice(logSuffix, baseEnd);
    const argEnd =
      groupPosition(latex.slice(baseEnd), kLeftParen, kRightParen) + baseEnd;
    latex = `${latex.slice(0, logIndex)}\\ln${kLeftParen}${latex.slice(
      baseEnd + kLeftParen.length,
      argEnd - kRightParen.length
    )},${base}${kRightParen}${latex.slice(argEnd)}`;
    logIndex = latex.indexOf(kLog);
  }
  console.log(latex);
  return latex;
}

export function Graph(props: {
  expressions: Expression[];
  width: number;
}): JSX.Element {
  const functions = useMemo(() => {
    return props.expressions.map((expression) => {
      if (expression.latex !== "") {
        try {
          return parseTex(transformLogBases(expression.latex)).compile();
        } catch (e) {
          if (e instanceof Error) {
            return e;
          }
        }
      }
      return null;
    });
  }, [props.expressions]);

  const [xRange, setXRange] = useState<[number, number]>([-10, 10]);

  const xValues = useMemo(() => {
    return math
      .range(xRange[0], xRange[1], (xRange[1] - xRange[0]) / kGraphLOD)
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
  }, [xValues, props.expressions]);

  const graphs = useMemo(() => {
    return yValues.flatMap((result, i) => {
      if (result && !(result instanceof Error)) {
        return {
          x: xValues,
          y: result,
          name: props.expressions[i].text,
          mode: "lines",
        };
      }
      return [];
    });
  }, [xValues, yValues, props.expressions]);

  const [yRange, setYRange] = useState<[number, number]>([-10, 10]);

  const onUpdatePlot = useCallback(
    (event: {
      "xaxis.range[0]"?: number;
      "xaxis.range[1]"?: number;
      "yaxis.range[0]"?: number;
      "yaxis.range[1]"?: number;
    }) => {
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

  return (
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
        margin: { l: 20, r: 20, t: 20, b: 20 },
        xaxis: {
          nticks: 15,
          range: xRange,
        },
        yaxis: {
          nticks: 15,
          range: yRange,
        },
        dragmode: "pan",
        modebar: { orientation: "v" },
        width: props.width,
      }}
    />
  );
}
