import {
  createBootstrapGrammar,
} from '../src/grammar';

import {
  parseWithStart,
} from '../src/Interpreter';

import {
  string2codePointArray,
} from '../src/GrammarBase';

import { expect } from 'chai';

const grammar = createBootstrapGrammar();
const parse = (input: string, sym: string) => {
  const arr = string2codePointArray(input);
  return parseWithStart(arr, grammar, sym);
}

describe('The bootstrap grammar', function () {
  it('should recogonize terminals', function () {
    const result = parse('\'t\'', 'Terminal');
    expect(result.success).true;
    expect(parse('x', 'Terminal').success).false;
  });

  it('should recogonize operators', function () {
    const result = parse('*', 'Operator');
    expect(result.success).true;
    expect(parse('x', 'Operator').success).false;
  });

  it('should recognize optional whitespace', function() {
    expect(parse('', 'OptWS').success).true;
    expect(parse('  ', 'OptWS').success).true;
    expect(parse('\t', 'OptWS').success).true;
    expect(parse('foo', 'OptWS').success).true;
    expect(parse('  foo', 'OptWS').success).true;
  });

  it('should recognize character ranges', function() {
    expect(parse('\'a\'..\'z\'', 'Range').success).true;
    expect(parse('\'a\' .. \'z\'', 'Range').success).true;
    expect(parse('\'A\'..\'Z\'', 'Range').success).true;
    expect(parse('\'a\'. .\'z\'', 'Range').success).false;
    expect(parse('\'a\' . . \'z\'', 'Range').success).false;
  });

  it('should recognize hex digits', function() {
    expect(parse('a', 'Hex').success).true;
    expect(parse('b', 'Hex').success).true;
    expect(parse('c', 'Hex').success).true;
    expect(parse('D', 'Hex').success).true;
    expect(parse('E', 'Hex').success).true;
    expect(parse('F', 'Hex').success).true;
    expect(parse('0', 'Hex').success).true;
    expect(parse('1', 'Hex').success).true;
    expect(parse('5', 'Hex').success).true;
    expect(parse('9', 'Hex').success).true;
    expect(parse('g', 'Hex').success).false;
  });

  it('should recognize hex characters', function() {
    expect(parse('\\xAB', 'HexChar').success).true;
    expect(parse('\\x01', 'HexChar').success).true;
    expect(parse('\\xeF', 'HexChar').success).true;
    expect(parse('\\xABCD', 'HexChar').success).true;
    expect(parse('\\xAB97', 'HexChar').success).true;
    expect(parse('\\xA0b0', 'HexChar').success).true;
    expect(parse('\\x1234', 'HexChar').success).true;
    expect(parse('\\x1', 'HexChar').success).false;
    expect(parse('x12', 'HexChar').success).false;
    expect(parse('\\11', 'HexChar').success).false;
    expect(parse('\\x1g', 'HexChar').success).false;
  });

  it('should recognize escaped characters', function() {
    expect(parse('\\t', 'EscapedChar').success).true;
    expect(parse('\\n', 'EscapedChar').success).true;
    expect(parse('\\\'', 'EscapedChar').success).true;
    expect(parse('\\\\', 'EscapedChar').success).true;
    expect(parse('\\[', 'EscapedChar').success).true;
    expect(parse('\\]', 'EscapedChar').success).true;
    expect(parse('\\*', 'EscapedChar').success).false;
  });

  it('should recognize character sets', function() {
    expect(parse('[abc-*()]', 'CharSet').success).true;
    expect(parse('[ab\\\\-*()]', 'CharSet').success).true;
    expect(parse('[abc-\\xab*()]', 'CharSet').success).true;
    expect(parse('abc-*()', 'CharSet').success).false;
    expect(parse('[abc-*()[]]', 'CharSet').success).false;
  });

  it('should recognize symbols', function() {
    expect(parse('ab12', 'Symbol').success).true;
    expect(parse(' ab12', 'Symbol').success).false;
    expect(parse('1ab12', 'Symbol').success).false;
    expect(parse('_ab12', 'Symbol').success).false;
    expect(parse('üab12', 'Symbol').success).false;
  });

  it('should recognize gap expressions', function() {
    expect(parse('# foo', 'GapExpr').success).true;
    expect(parse('# # foo', 'GapExpr').success).true;
    expect(parse('## foo', 'GapExpr').success).true;
  });

  it('should recognize parenthesized expressions', function() {
    expect(parse('( # abc )', 'ParenExpr').success).true;
    expect(parse('(abc)', 'ParenExpr').success).true;
    expect(parse('((abc)', 'ParenExpr').success).false;
  });

  it('should recognize expressions with closure operators', function() {
    expect(parse('abc*', 'AltElementExpr').success).true;
    expect(parse('abc+', 'AltElementExpr').success).true;
    expect(parse('abc?', 'AltElementExpr').success).true;
    expect(parse('(abc*)+', 'AltElementExpr').success).true;
  });

  it('should recognize disjunctive expressions (alternatives)', function() {
    expect(parse('abc/def', 'SeqElementExpr').success).true;
    expect(parse('((abc/def)/xyz)', 'SeqElementExpr').success).true;
    expect(parse('xyz/(abc/def)', 'SeqElementExpr').success).true;
    expect(parse('xyz / ( abc / def )', 'SeqElementExpr').success).true;
  });

  it('should recognize grammar rules', function() {
    expect(parse('start -> x1 / x2 ;', 'Rule').success).true;
  });

});
