export enum GrammarExpressionCode {
  symbol,
  terminal,
  terminals,
  terminalRange,
  emptyExpression,
  sequence,
  alternative,
  kleeneClosure,
  transitiveClosure,
  optional,
  reluctantGap,
}

export const string2codePointArray = (s: string): Array<number> => Array.from(s, c => {
  return c.codePointAt(0) || 0;
});
