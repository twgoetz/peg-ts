import { GrammarExpressionCode } from './GrammarBase';

// Datastructures for grammar expressions
export class ExprData {
  eType: GrammarExpressionCode;
  constructor(eType: GrammarExpressionCode) {
    this.eType = eType;
  }
}

export class ExprStringData extends ExprData {
  name: string;
  constructor(eType: GrammarExpressionCode, name: string) {
    super(eType)
    this.name = name;
  }
}

export class ExprStringArrayData extends ExprData {
  dtrs: Array<string>;
  constructor(eType: GrammarExpressionCode, dtrs: Array<string>) {
    super(eType);
    this.dtrs = dtrs;
  }
}

export class ExprArrayData extends ExprData {
  dtrs: Array<ExprData>;
  constructor(eType: GrammarExpressionCode, dtrs: Array<ExprData>) {
    super(eType);
    this.dtrs = dtrs;
  }
}

export class RuleData {
  lhs: ExprStringData;
  rhs: ExprData;
  constructor(lhs: ExprStringData, rhs: ExprData) {
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

// Convenience functions for creating expressions
const symbol = (name: string): ExprStringData => new ExprStringData(GrammarExpressionCode.symbol, name);
const star = (dtr: ExprData): ExprArrayData => new ExprArrayData(GrammarExpressionCode.kleeneClosure, [dtr]);
const opt = (dtr: ExprData): ExprArrayData => new ExprArrayData(GrammarExpressionCode.optional, [dtr]);
const seq = (dtrs: Array<ExprData>): ExprArrayData => new ExprArrayData(GrammarExpressionCode.sequence, dtrs);
const terminal = (name: string): ExprStringData => new ExprStringData(GrammarExpressionCode.terminal, name);
const alt = (dtrs: Array<ExprData>): ExprArrayData => new ExprArrayData(GrammarExpressionCode.alternative, dtrs);
const range = (from: string, to: string): ExprStringArrayData => new ExprStringArrayData(GrammarExpressionCode.terminalRange, [from, to]);
const terminals = (name: string): ExprStringData => new ExprStringData(GrammarExpressionCode.terminals, name);

// Represent the bootstrap grammar as a set of objects that can be used by the interpreter. The
// bootstrap grammar is just rich enough so it can parse the actual grammar of PEGs. The real
// grammar lives in grammars/PEGGrammar.peg.
export const bootstrapGrammarData: Array<RuleData> = [
  new RuleData(
    symbol('Grammar'),
    star(symbol('Rule'))
  ),
  new RuleData(
    symbol('Rule'),
    seq([
      symbol('OptWS'),
      symbol('Symbol'),
      symbol('OptWS'),
      terminal('-'),
      terminal('>'),
      symbol('OptWS'),
      symbol('Expr'),
      symbol('OptWS'),
      terminal(';'),
      symbol('OptWS')
    ])
  ),
  new RuleData(
    symbol('Expr'),
    seq([
      symbol('SeqElementExpr'),
      star(seq([
        symbol('OptWS'),
        symbol('SeqElementExpr')]))])
  ),
  new RuleData(
    symbol('SeqElementExpr'),
    seq([
      symbol('AltElementExpr'),
      star(seq([
        symbol('OptWS'),
        symbol('AltOperator'),
        symbol('OptWS'),
        symbol('AltElementExpr')
      ]))
    ])
  ),
  new RuleData(
    symbol('AltElementExpr'),
    seq([
      symbol('OperandExpr'),
      opt(
        seq([
          symbol('OptWS'),
          symbol('Operator')
        ])
      )
    ])
  ),
  new RuleData(
    symbol('OperandExpr'),
    alt([
      symbol('ParenExpr'),
      symbol('SimpleExpr')
    ])
  ),
  new RuleData(
    symbol('ParenExpr'),
    seq([
      terminal('('),
      symbol('OptWS'),
      symbol('Expr'),
      symbol('OptWS'),
      terminal(')')
    ])
  ),
  new RuleData(
    symbol('SimpleExpr'),
    alt([
      symbol('GapExpr'),
      symbol('Range'),
      symbol('Terminal'),
      symbol('Symbol'),
      symbol('CharSet')
    ])
  ),
  new RuleData(
    symbol('GapExpr'),
    seq([
      symbol('GapOperator'),
      symbol('OptWS'),
      symbol('Expr'),
    ])
  ),
  new RuleData(
    symbol('Terminal'),
    seq([
      terminal('\''),
      alt([
        symbol('HexChar'),
        symbol('EscapedChar'),
        range('a', 'z'),
        range('A', 'Z'),
        range('0', '9'),
        terminals('-_()[]^!?.;<>/#+*'),
      ]),
      terminal('\''),
    ])
  ),
  new RuleData(
    symbol('Symbol'),
    seq([
      alt([
        range('a', 'z'),
        range('A', 'Z'),
      ]),
      star(
        alt([
          range('a', 'z'),
          range('A', 'Z'),
          range('0', '9'),
        ])
      )
    ])
  ),
  new RuleData(
    symbol('CharSet'),
    seq([
      terminal('['),
      star(
        alt([
          symbol('HexChar'),
          symbol('EscapedChar'),
          range('a', 'z'),
          range('A', 'Z'),
          range('0', '9'),
          terminals(' -_()^!?,."\';<>/#+*'),
        ])
      ),
      terminal(']'),
    ])
  ),
  new RuleData(
    symbol('EscapedChar'),
    seq([terminal('\\'), terminals('\\nt\'[]')]),
  ),
  new RuleData(
    symbol('Hex'),
    alt([
      range('a', 'f'),
      range('A', 'F'),
      range('0', '9'),
    ]),
  ),
  new RuleData(
    symbol('HexChar'),
    seq([
      terminal('\\'),
      terminal('x'),
      symbol('Hex'),
      symbol('Hex'),
      opt(seq([
        symbol('Hex'),
        symbol('Hex'),
      ]))
    ])
  ),
  new RuleData(
    symbol('Range'),
    seq([
      symbol('Terminal'),
      symbol('OptWS'),
      terminal('.'),
      terminal('.'),
      symbol('OptWS'),
      symbol('Terminal')
    ])
  ),
  new RuleData(
    symbol('OptWS'),
    star(terminals(' \n\t'))
  ),
  new RuleData(
    symbol('Operator'),
    terminals('?*+')
  ),
  new RuleData(
    symbol('GapOperator'),
    terminal('#'),
  ),
  new RuleData(
    symbol('AltOperator'),
    terminal('/'),
  ),
];

// const char2int = (char: string): number => {
//   if (char && char.length > 0) {
//     return char.codePointAt(0) || -1;
//   }
//   return -1;
// }

