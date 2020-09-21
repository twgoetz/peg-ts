// const fs = require('fs').promises;
import fsNode from 'fs';
const fs = fsNode.promises;

import {
  string2codePointArray,
} from './GrammarBase';

import {
  createBootstrapGrammar,
  Grammar,
} from './grammar';

import {
  parse,
  parseWithStart,
} from './Interpreter';

const grammar = createBootstrapGrammar();
// console.log(JSON.stringify(grammar));

fs
  .open('./grammars/PEGGrammar.peg', 'r')
  // .open('./grammars/test.peg', 'r')
  .then(fileHandle => fs.readFile(fileHandle, 'utf8'))
  .then(content => {
    const input = string2codePointArray(content);
    console.log(parseWithStart(input, grammar, 'Grammar'));
  })
  .catch(err => console.log(err));


