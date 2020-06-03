import { GrammarExpressionCode } from './GrammarBase';

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

const symbol = (name: string): ExprStringData => new ExprStringData(GrammarExpressionCode.symbol, name);
const star = (dtr: ExprData): ExprArrayData => new ExprArrayData(GrammarExpressionCode.kleeneClosure, [dtr]);
const opt = (dtr: ExprData): ExprArrayData => new ExprArrayData(GrammarExpressionCode.optional, [dtr]);
const seq = (dtrs: Array<ExprData>): ExprArrayData => new ExprArrayData(GrammarExpressionCode.sequence, dtrs);
const terminal = (name: string): ExprStringData => new ExprStringData(GrammarExpressionCode.terminal, name);
const alt = (dtrs: Array<ExprData>): ExprArrayData => new ExprArrayData(GrammarExpressionCode.alternative, dtrs);
const range = (from: string, to: string): ExprStringArrayData => new ExprStringArrayData(GrammarExpressionCode.terminalRange, [from, to]);
const terminals = (name: string): ExprStringData => new ExprStringData(GrammarExpressionCode.terminals, name);

// Represent the bootstrap grammar as a Json structure
export const bootstrapGrammarData: Array<RuleData> = [
  new RuleData(
    symbol('Grammar'),
    star(symbol('Rule'))
  ),
  new RuleData(
    symbol('Rule'),
    seq([symbol('OptWS'), symbol('Symbol'), symbol('OptWS'), terminal('-'), terminal('>'), symbol('OptWS'), symbol('Expr'), symbol('OptWS'), terminal(';'), symbol('OptWS')])
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
    star(seq([
      symbol('OptWS'),
      symbol('AltOperator'),
      symbol('OptWS'),
      symbol('AltElementExpr')
    ]))
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
// Represent the bootstrap grammar as a Json structure
// export const bootstrapGrammarData: Array<any> = [
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Grammar',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.kleeneClosure,
//       dtr: {
//         eType: GrammarExpressionCode.symbol,
//         name: 'Rule',
//       },
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Rule',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Symbol',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '-',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '>',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Expr',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: ';',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Expr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'SeqElementExpr',
//         },
//         {
//           eType: GrammarExpressionCode.kleeneClosure,
//           dtr: {
//             eType: GrammarExpressionCode.sequence,
//             dtrs: [
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'OptWS',
//               },
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'SeqElementExpr',
//               },
//             ]
//           },
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'SeqElementExpr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'AltElementExpr',
//         },
//         {
//           eType: GrammarExpressionCode.kleeneClosure,
//           dtr: {
//             eType: GrammarExpressionCode.sequence,
//             dtrs: [
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'OptWS',
//               },
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'AltOperator',
//               },
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'OptWS',
//               },
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'AltElementExpr',
//               },
//             ]
//           },
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'AltElementExpr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OperandExpr',
//         },
//         {
//           eType: GrammarExpressionCode.optional,
//           dtr: {
//             eType: GrammarExpressionCode.sequence,
//             dtrs: [
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'OptWS',
//               },
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'Operator',
//               },
//             ]
//           },
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'OperandExpr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.alternative,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'ParenExpr',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'SimpleExpr',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'ParenExpr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '(',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Expr',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: ')',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'SimpleExpr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.alternative,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'GapExpr',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Range',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Terminal',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Symbol',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'CharSet',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'GapExpr',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'GapOperator',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Expr',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Terminal',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '\'',
//         },
//         {
//           eType: GrammarExpressionCode.alternative,
//           dtrs: [
//             {
//               eType: GrammarExpressionCode.symbol,
//               name: 'HexChar',
//             },
//             {
//               eType: GrammarExpressionCode.symbol,
//               name: 'EscapedChar',
//             },
//             {
//               eType: GrammarExpressionCode.terminalRange,
//               from: 'a',
//               to: 'z',
//             },
//             {
//               eType: GrammarExpressionCode.terminalRange,
//               from: 'A',
//               to: 'Z',
//             },
//             {
//               eType: GrammarExpressionCode.terminalRange,
//               from: '0',
//               to: '9',
//             },
//             {
//               eType: GrammarExpressionCode.terminals,
//               name: '-_()[]^!?.;<>/#+*',
//             }
//           ],
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '\'',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Symbol',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.alternative,
//           dtrs: [
//             {
//               eType: GrammarExpressionCode.terminalRange,
//               from: 'a',
//               to: 'z',
//             },
//             {
//               eType: GrammarExpressionCode.terminalRange,
//               from: 'A',
//               to: 'Z',
//             },
//           ],
//         },
//         {
//           eType: GrammarExpressionCode.kleeneClosure,
//           dtr:
//           {
//             eType: GrammarExpressionCode.alternative,
//             dtrs: [
//               {
//                 eType: GrammarExpressionCode.terminalRange,
//                 from: 'a',
//                 to: 'z',
//               },
//               {
//                 eType: GrammarExpressionCode.terminalRange,
//                 from: 'A',
//                 to: 'Z',
//               },
//               {
//                 eType: GrammarExpressionCode.terminalRange,
//                 from: '0',
//                 to: '9',
//               },
//             ],
//           },
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'CharSet',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '[',
//         },
//         {
//           eType: GrammarExpressionCode.kleeneClosure,
//           dtr:
//           {
//             eType: GrammarExpressionCode.alternative,
//             dtrs: [
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'HexChar',
//               },
//               {
//                 eType: GrammarExpressionCode.symbol,
//                 name: 'EscapedChar',
//               },
//               {
//                 eType: GrammarExpressionCode.terminalRange,
//                 from: 'a',
//                 to: 'z',
//               },
//               {
//                 eType: GrammarExpressionCode.terminalRange,
//                 from: 'A',
//                 to: 'Z',
//               },
//               {
//                 eType: GrammarExpressionCode.terminalRange,
//                 from: '0',
//                 to: '9',
//               },
//               {
//                 eType: GrammarExpressionCode.terminals,
//                 name: ' -_()^!?,."\';<>/#+*',
//               }
//             ],
//           },
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: ']',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'EscapedChar',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '\\',
//         },
//         {
//           eType: GrammarExpressionCode.terminals,
//           name: '\\nt\'[]',
//         },
//       ],
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Hex',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.alternative,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.terminalRange,
//           from: 'a',
//           to: 'f',
//         },
//         {
//           eType: GrammarExpressionCode.terminalRange,
//           from: 'A',
//           to: 'F',
//         },
//         {
//           eType: GrammarExpressionCode.terminalRange,
//           from: '0',
//           to: '9',
//         },
//       ],
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'HexChar',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '\\',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: 'x',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Hex',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Hex',
//         },
//         {
//           eType: GrammarExpressionCode.optional,
//           dtr: {
//             eType: GrammarExpressionCode.sequence,
//             dtrs: [{
//               eType: GrammarExpressionCode.symbol,
//               name: 'Hex',
//             },
//             {
//               eType: GrammarExpressionCode.symbol,
//               name: 'Hex',
//             },
//             ]
//           }
//         }
//       ],
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Range',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.sequence,
//       dtrs: [
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Terminal',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '.',
//         },
//         {
//           eType: GrammarExpressionCode.terminal,
//           name: '.',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'OptWS',
//         },
//         {
//           eType: GrammarExpressionCode.symbol,
//           name: 'Terminal',
//         },
//       ]
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'OptWS',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.kleeneClosure,
//       dtr:
//       {
//         eType: GrammarExpressionCode.terminals,
//         name: ' \n\t',
//       },
//     }
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'Operator',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.terminals,
//       name: '?*+',
//     },
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'GapOperator',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.terminal,
//       name: '#',
//     },
//   },
//   {
//     lhs: {
//       eType: GrammarExpressionCode.symbol,
//       name: 'AltOperator',
//     },
//     rhs: {
//       eType: GrammarExpressionCode.terminal,
//       name: '/',
//     },
//   },
// ];

const char2int = (char: string): number => {
  if (char && char.length > 0) {
    return char.codePointAt(0) || -1;
  }
  return -1;
}

