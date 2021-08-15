import { Token } from '../common';

class Lexer {
  constructor() {
    this.patterns = new Map();
  }

  add(regex, mapFn) {
    const flags = new Set([...regex.flags.split(''), 'g', 'y']);
    const pattern = new RegExp(regex, Array.from(flags).join(''));
    this.patterns.set(pattern, mapFn);
    return this;
  }

  lex(input) {
    const tokens = [];
    let lastIndex = 0;
    let matched;
    while (lastIndex < input.length) {
      matched = false;
      for (const pattern of this.patterns.keys()) {
        const res = this.match(pattern, input, lastIndex);
        if (!res) continue;
        matched = true;
        const mapFn = this.patterns.get(pattern);
        const token = mapFn(
          Token.Plain({
            index: lastIndex,
            size: res[0].length,
            type: "regex",
            value: res
          })
        );
        if (!token.isIgnore) {
          tokens.push(token);
        }
        lastIndex += res[0].length;
      }
      if (!matched) {
        throw new SyntaxError(
          `Cannot match token at ${lastIndex} "${
            input[lastIndex]
          }" (${input.charCodeAt(lastIndex)})`
        );
      }
    }
    return tokens;
  }

  match(pattern, input, index = 0) {
    pattern.lastIndex = index;
    const res = pattern.exec(input);
    return res && res.index === index ? res : undefined;
  }
}

export default Lexer;
