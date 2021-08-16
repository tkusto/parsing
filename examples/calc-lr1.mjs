import { Lexer, Parser } from '../src/lr1/index.mjs';
import { lexic, grammar } from './calc-lr1-grammar.mjs';

const lexer = new Lexer();
lexic.forEach(([type, pattern, mapFn]) => {
  lexer.add(pattern,
    mapFn
      ? t => t.produce({ type, value: mapFn(t.value) })
      : t => t.ignore()
  );
});

const parser = new Parser();
grammar.forEach(rule => {
  if (Array.isArray(rule[1])) {
    const [name, alts] = rule;
    alts.forEach(tokens => {
      parser.addRule(name, tokens);
    });
  } else {
    const [name, ...tokens] = rule;
    parser.addRule(name, tokens);
  }
});

const code = `y = x * (pi * r + 7 * c) - x / e`;
const tokens = lexer.lex(code);
parser.compile('program');
