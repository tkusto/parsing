import { Token } from '../common';

type LexerPatternMapFn = (token: Token<any>) => any;

class Lexer {
  private patterns = new Map<RegExp, LexerPatternMapFn>();

  add(regex: RegExp, mapFn?: LexerPatternMapFn) {
    const flags = new Set([...regex.flags.split(''), 'g', 'y']);
    const pattern = new RegExp(regex, Array.from(flags).join(''));
    this.patterns.set(pattern, mapFn);
    return this;
  }

  lex(input: string) {
    const tokens: Token<any>[] = [];
    let lastIndex = 0;
    let matched: boolean;
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

  private match(pattern: RegExp, input: string, index: number = 0) {
    pattern.lastIndex = index;
    const res = pattern.exec(input);
    return res && res.index === index ? res : undefined;
  }
}

export default Lexer;
