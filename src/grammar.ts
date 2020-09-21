import {
  ExprArrayData,
  ExprData,
  ExprStringArrayData,
  ExprStringData,
  RuleData,
  bootstrapGrammarData,
} from './BootstrapGrammar';

import { GrammarExpressionCode } from './GrammarBase';

export class GrammarSymbol {
  type = GrammarExpressionCode.symbol as const;
  name: string;
  code: number;
  constructor(name: string, code: number) {
    this.name = name;
    this.code = code;
  }
}

export class GrammarTerminal {
  type = GrammarExpressionCode.terminal as const;
  char: number;
  constructor(char: number) {
    this.char = char;
  }
}

export class GrammarTerminals {
  type = GrammarExpressionCode.terminals as const;
  chars: Array<number>;
  constructor(chars: Array<number>) {
    this.chars = chars;
  }
}

export class TerminalRange {
  type = GrammarExpressionCode.terminalRange as const;
  from: number;
  to: number;
  constructor(from: number, to: number) {
    this.from = from;
    this.to = to;
  }
}

export class EmptyExpression {
  type = GrammarExpressionCode.emptyExpression as const;
}

export class Sequence {
  type = GrammarExpressionCode.sequence as const;
  expressions: Array<GrammarExpression>;
  constructor(expressions: Array<GrammarExpression>) {
    this.expressions = expressions;
  }
}

export class Alternative {
  type = GrammarExpressionCode.alternative as const;
  expressions: Array<GrammarExpression>;
  constructor(expressions: Array<GrammarExpression>) {
    this.expressions = expressions;
  }
}

export class KleeneClosure {
  type = GrammarExpressionCode.kleeneClosure as const;
  expression: GrammarExpression;
  constructor(expression: GrammarExpression) {
    this.expression = expression;
  }
}

export class TransitiveClosure {
  type = GrammarExpressionCode.transitiveClosure as const;
  expression: GrammarExpression;
  constructor(expression: GrammarExpression) {
    this.expression = expression;
  }
}

export class Optional {
  type = GrammarExpressionCode.optional as const;
  expression: GrammarExpression;
  constructor(expression: GrammarExpression) {
    this.expression = expression;
  }
}

export class ReluctantGap {
  type = GrammarExpressionCode.reluctantGap as const;
  expression: GrammarExpression;
  constructor(expression: GrammarExpression) {
    this.expression = expression;
  }
}

export type GrammarExpression =
  GrammarSymbol |
  GrammarTerminal |
  GrammarTerminals |
  TerminalRange |
  EmptyExpression |
  Sequence |
  Alternative |
  KleeneClosure |
  TransitiveClosure |
  Optional |
  ReluctantGap
  ;

export class GrammarRule {
  lhs: GrammarSymbol;
  rhs: GrammarExpression;
  constructor(lhs: GrammarSymbol, rhs: GrammarExpression) {
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

export class Grammar {

  symbolMap = new Map<string, GrammarSymbol>();
  symbolList = new Array<GrammarSymbol>();
  rules = new Array<GrammarRule>();

  constructor() {
  }

  getSymbolCode(name: string): GrammarSymbol {
    const value = this.symbolMap.get(name);
    return value || new GrammarSymbol('', -1);
  }

  // If name is a known symbol, return it; else create it and return it.
  getOrAddSymbol(name: string): GrammarSymbol {
    let value = this.symbolMap.get(name);
    if (!value) {
      value = new GrammarSymbol(name, this.symbolList.length);
      this.symbolList.push(value);
      this.symbolMap.set(name, value);
    }
    return value;
  }
}

const createExpression = (data: ExprData, grammar: Grammar): GrammarExpression => {

  const expr = (data: ExprData): GrammarExpression => {
    switch (data.eType) {
      case GrammarExpressionCode.alternative: {
        const dtrsData: Array<ExprData> = (data as ExprArrayData).dtrs;
        const dtrs = dtrsData
          .map(dtrData => expr(dtrData));
        return new Alternative(dtrs);
      }
      case GrammarExpressionCode.kleeneClosure: {
        const dtrData = (data as ExprArrayData).dtrs[0];
        return new KleeneClosure(expr(dtrData))
      }
      case GrammarExpressionCode.optional: {
        const dtrData = (data as ExprArrayData).dtrs[0];
        return new Optional(expr(dtrData))
      }
      case GrammarExpressionCode.sequence: {
        const dtrsData: Array<ExprData> = (data as ExprArrayData).dtrs;
        const dtrs = dtrsData
          .map(dtrData => expr(dtrData));
        return new Sequence(dtrs);
      }
      case GrammarExpressionCode.symbol: {
        const name = (data as ExprStringData).name;
        return grammar.getOrAddSymbol(name);
      }
      case GrammarExpressionCode.terminal: {
        const name = (data as ExprStringData).name;
        // A terminal in our bootstrap grammar is guaranteed to be exactly one character (i.e., code point)
        const codePoint: number = name.codePointAt(0) || -1;
        return new GrammarTerminal(codePoint);
      }
      case GrammarExpressionCode.terminalRange: {
        // A terminal range has a two-member string array of length 1 strings
        const [fromData, toData]: Array<string> = (data as ExprStringArrayData).dtrs;
        const from = fromData.codePointAt(0) || -1;
        const to = toData.codePointAt(0) || -1;
        return new TerminalRange(from, to);
      }
      case GrammarExpressionCode.terminals: {
        const name = (data as ExprStringData).name;
        // Convert a string to an array of code points. Not exactly obvious.
        const dtrs: Array<number> = Array.from(name, chString => chString.codePointAt(0) || -1);
        return new GrammarTerminals(dtrs);
      }
      default: {
        throw `Can't handle input expression: ${JSON.stringify(data)}`;
      }
    }
  }

  return expr(data);
}

export const createBootstrapGrammar = () => {
  const grammar = new Grammar();
  for (let rule of bootstrapGrammarData) {
    const { lhs, rhs } = rule;
    const lhsSym = grammar.getOrAddSymbol(lhs.name);
    const rhsExpr = createExpression(rhs, grammar);
    grammar.rules[lhsSym.code] = new GrammarRule(lhsSym, rhsExpr);
  }
  return grammar;
};
