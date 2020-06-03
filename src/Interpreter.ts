import {
  GrammarExpressionCode,
  string2codePointArray,
} from './GrammarBase';

import {
  Grammar,
  Alternative,
  EmptyExpression,
  GrammarExpression,
  GrammarRule,
  GrammarSymbol,
  GrammarTerminal,
  GrammarTerminals,
  KleeneClosure,
  Optional,
  ReluctantGap,
  Sequence,
  TerminalRange,
  TransitiveClosure,
} from './grammar';

enum NodeType {
  terminal,
  nonTerminal,
}

class ParseTreeNonTerminal {
  nodeType = NodeType.nonTerminal as const;
  category: number;
  dtrs: Array<ParseTree> = [];
  constructor(category: number, dtrs: Array<ParseTree>) {
    this.category = category;
    this.dtrs = dtrs;
  }
}

class ParseTreeTerminal {
  nodeType = NodeType.terminal as const;
  terminal: number;
  constructor(terminal: number) {
    this.terminal = terminal;
  }
}

type ParseTree =  ParseTreeNonTerminal | ParseTreeTerminal;

class ParseResult {
  success: boolean;
  pos: int;
  tree: ParseTree;
  constructor(success: boolean, pos: int, tree: ParseTree) {
    this.success = success;
    this.pos = pos;
    this.tree = tree;
  }
}

type int = number;

const SEQ: int = -1;

class LookupTable {
  numCols: int;
  numSyms: int;
  table: Array<Array<[int, ParseTree]>> = [];
  constructor(numCols: int, numSyms: int) {
    this.numCols = numCols;
    this.numSyms = numSyms;
    const initialTree = new ParseTreeNonTerminal(SEQ, []);
    for (let index = 0; index < numSyms; index++) {
      const entry: Array<[int, ParseTree]> = [];
      for (let j = 0; j < numCols; j++) {
        entry[j] = [SEQ, initialTree];
      } 
      this.table[index] = entry;
    }
  }

  isSet(pos: int, sym: int): boolean {
    return this.table[sym][pos][0] >= 0;
  }

  set(from: int, to: int, sym: int, tree: ParseTree): void {
    this.table[sym][from] = [to, tree];
  }

  get(pos: int, sym: int): [int, ParseTree] {
    return this.table[sym][pos];
  }
}

export const parse = (input: Array<number>, grammar: Grammar): ParseResult => {

  const table = new LookupTable(input.length + 1, grammar.rules.length);

  const parseSequence = (seq: Array<GrammarExpression>, seqIdx: int, pos: int, trees: Array<ParseTree>): ParseResult => {
    if (seqIdx >= seq.length) {
      return new ParseResult(true, pos, new ParseTreeNonTerminal(SEQ, trees));
    }
    const { success: subSuccess, tree: subTree, pos: subPos } = parse(seq[seqIdx], pos);
    if (subSuccess) {
      // Special case: the result of parsing is a sequence; then we concatenate the sequences
      if (subTree.nodeType === NodeType.nonTerminal) {
        if (subTree.category === SEQ) {
          return parseSequence(seq, seqIdx + 1, subPos, [...trees, ...subTree.dtrs])
        }
      }
      return parseSequence(seq, seqIdx + 1, subPos, [...trees, subTree]);
    }
    return new ParseResult(false, pos, new ParseTreeNonTerminal(SEQ, trees));
  }

  const parseClosure = (exp: GrammarExpression, pos: int, trees: Array<ParseTree>): ParseResult => {
    const { success: subSuccess, tree: subTree, pos: subPos } = parse(exp, pos);
    if (subSuccess) {
      if (subTree.nodeType === NodeType.nonTerminal) {
        if(subTree.category === SEQ) {
          return parseClosure(exp, subPos, [...trees, ...subTree.dtrs]);
        }
        return parseClosure(exp, subPos, [...trees, subTree]);
      }
    }
    // Always return success
    return new ParseResult(true, pos, new ParseTreeNonTerminal(SEQ, trees));
  }

  // Parsing transitive closure is like Kleene closure, except that the first result must not be a failure
  const parsePlus = (exp: GrammarExpression, pos: int, trees: Array<ParseTree>): ParseResult => {
    const result = parse(exp, pos);
    const { success: subSuccess, tree: subTree, pos: subPos } = result;
    if (subSuccess) {
      if (subTree.nodeType === NodeType.nonTerminal) {
        if(subTree.category === SEQ) {
          return parseClosure(exp, subPos, [...trees, ...subTree.dtrs]);
        }
        return parseClosure(exp, subPos, [...trees, subTree]);
      }
    }
    // Failed to parse
    return result;
  }

  const parseAlternative = (seq: Array<GrammarExpression>, seqIdx: int, pos: int): ParseResult => {
    if (seqIdx >= seq.length) {
      return new ParseResult(false, pos, new ParseTreeNonTerminal(SEQ, []));
    }
    const result = parse(seq[seqIdx], pos);
    if (result.success) {
      return result;
    }
    return parseAlternative(seq, seqIdx + 1, pos);
  }

  const parseReluctantGap = (exp: GrammarExpression, pos: int): ParseResult => {
    if (pos >= input.length) {
      return new ParseResult(false, pos, new ParseTreeNonTerminal(SEQ, []));
    }
    const result = parse(exp, pos);
    if (result.success) {
      return result;
    }
    return parseReluctantGap(exp, pos + 1);
  }

  const parseTerminals = (terminals: Array<int>, pos: int): ParseResult => {
    const c = input[pos];
    const tree = new ParseTreeTerminal(c);
    if (pos >= input.length) {
      return new ParseResult(false, pos, tree);
    }
    if (terminals.indexOf(c) >= 0) {
      return new ParseResult(true, pos + 1, tree);
    }
    return new ParseResult(false, pos, tree);
  }

  const parseTerminalRange = (from: int, to: int, pos: int): ParseResult => {
    const c = input[pos];
    const tree = new ParseTreeTerminal(c);
    if (pos >= input.length) {
      return new ParseResult(false, pos, tree);
    }
    if (from <= c && c <= to) {
      return new ParseResult(true, pos + 1, tree);
    }
    return new ParseResult(false, pos, tree);
  }

  const parseSymbol = (symbolCode: int, pos: int): ParseResult => {
    const [toPos, tree] = table.get(pos, symbolCode);
    if (toPos >= 0) {
      return new ParseResult(true, toPos, tree);
    }
    const result = parse(grammar.rules[symbolCode].rhs, pos);
    const { success: subSuccess, tree: subTree, pos: subPos } = result;
    if (subSuccess) {
      let outTree: ParseTree;
      if (subTree.nodeType === NodeType.nonTerminal && subTree.category === SEQ) {
        outTree = new ParseTreeNonTerminal(symbolCode, subTree.dtrs);
      } else {
        outTree = new ParseTreeNonTerminal(symbolCode, [subTree]);
      }
      table.set(pos, subPos, symbolCode, outTree);
      return new ParseResult(true, subPos, outTree);
    }
    // Failure
    return result;
  }

  const parseOptional = (exp: GrammarExpression, pos: int): ParseResult => {
    const result = parse(exp, pos);
    if (result.success) {
      return result;
    }
    return new ParseResult(true, pos, new ParseTreeNonTerminal(SEQ, []));
  }

  const parse = (exp: GrammarExpression, pos: number): ParseResult => {
    switch (exp.type) {
      case GrammarExpressionCode.terminal: {
        return new ParseResult(exp.char === input[pos], pos, new ParseTreeTerminal(exp.char));
      }
      case GrammarExpressionCode.sequence: {
        return parseSequence(exp.expressions, 0, pos, []);
      }
      case GrammarExpressionCode.kleeneClosure: {
        return parseClosure(exp.expression, pos, []);
      }
      case GrammarExpressionCode.transitiveClosure: {
        return parsePlus(exp.expression, pos, []);
      }
      case GrammarExpressionCode.alternative: {
        return parseAlternative(exp.expressions, 0, pos);
      }
      case GrammarExpressionCode.reluctantGap: {
        return parseReluctantGap(exp.expression, pos);
      }
      case GrammarExpressionCode.terminals: {
        return parseTerminals(exp.chars, pos);
      }
      case GrammarExpressionCode.terminalRange: {
        return parseTerminalRange(exp.from, exp.to, pos);
      }
      case GrammarExpressionCode.symbol: {
        return parseSymbol(exp.code, pos);
      }
      case GrammarExpressionCode.optional: {
        return parseOptional(exp.expression, pos);
      }
      default: {
        return new ParseResult(false, pos, new ParseTreeNonTerminal(SEQ, []));
      }
    }
  }

  return parse(grammar.symbolList[9], 0); 
}
