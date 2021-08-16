import { Lexer, Parser } from '../../lr1';
import { lexic, grammar } from './grammar';

const lexer = new Lexer();
lexic.forEach(([type, pattern, mapFn]) => {
  lexer.add(pattern,
    mapFn
      ? t => t.produce({ type, value: mapFn(t.value) })
      : t => t.ignore()
  );
});

const parser = new Parser();
Object.keys(grammar).forEach(name => {
  const ruleSet = grammar[name];
  ruleSet.forEach(tokens => {
    parser.addRule(name, tokens);
  });
});

const code = `y = x * (pi * r + 7 * c) - x / e`;
const tokens = lexer.lex(code);
console.log(tokens.map(t => t.value).join(' '));
parser.compile('program');
