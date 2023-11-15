import { Expression } from "@/types";
import dynamic from "next/dynamic";
import { useMemo } from "react";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function CalculatorPlot(props: {
  xValues: number[];
  expressions: Expression[];
}): JSX.Element {
  const results = useMemo(() => {
    return props.expressions
      .filter(
        (expression) =>
          expression.results !== null &&
          !(expression.results instanceof SyntaxError)
      )
      .map((expression) => expression.results) as number[][];
  }, [props.expressions]);

  return (
    <Plot
      data={results.map((yValues: number[]) => ({
        x: props.xValues,
        y: yValues,
      }))}
      layout={{ autosize: true, modebar: { orientation: "v" } }}
      useResizeHandler
      className="w-full h-full"
    />
  );
}
