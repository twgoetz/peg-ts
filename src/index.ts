const fs = require('fs').promises;

import {
  string2codePointArray,
} from './GrammarBase';

import {
  createBootstrapGrammar,
  Grammar,
} from './grammar';

import {
  parse,
} from './Interpreter';

const grammar = createBootstrapGrammar();
// console.log(JSON.stringify(grammar));

fs
//   // .open('./grammars/PEGGrammar.peg')
  .open('./grammars/test.peg')
  .then(fileHandle => fs.readFile(fileHandle, 'utf8'))
  .then(content => {
    const input = string2codePointArray(content);
    console.log(parse(input, grammar));
  })
  .catch(err => console.log(err));


