export type Expression = {
  id: string;
  text: string;
  results: number[] | number | Error | null;
};
