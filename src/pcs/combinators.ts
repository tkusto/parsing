import { Result, Ok, Err, Token, ParseError } from '../common';

type ParseResult<V=any, E=ParseError> = Ok<Token<V>> | Err<E>;
export type Parser<V=any> = (src: string, index: number) => ParseResult<V>;

export function Text(text: string, ci = false): Parser {
  if (ci) {
    text = text.toLowerCase();
  }
  return (src, index) => {
    const sample = src.slice(index, index + text.length);
    const matches = ci ? (text === sample.toLowerCase()) : (text === sample);
    if (!matches) {
      return Result.Err(new ParseError(`Expects "${text}" instead got "${sample}"`, index));
    }
    return Result.Ok(Token.Plain({
      index,
      size: sample.length,
      type: 'text',
      value: sample
    }));
  };
}

export function Regex(re: RegExp) {
  const flags = new Set([...re.flags.split(''), 'g', 'y']);
  const pattern = new RegExp(re, Array.from(flags).join(''));
  const parseRegex: Parser = (src, index) => {
    pattern.lastIndex = index;
    try {
      const match = pattern.exec(src);
      if (!match || match.index !== index) {
        throw new ParseError(`Cannot match "${pattern}"`, index);
      }
      return Result.Ok(Token.Plain({
        index,
        size: match[0].length,
        type: 'regex',
        value: match
      }));
    } catch (error) {
      return Result.Err(error);
    }
  };
  return parseRegex;
}

export function Ignore(parse: Parser<unknown>): Parser<undefined> {
  return (src, index) => parse(src, index).map(t => t.ignore());
}

/**
 * Make parser optional
 * returns parser result if it matches,
 * or zero-length Ignore token if not
 */
export function Opt<V>(parse: Parser<V>): Parser<V> | Parser<undefined> {
  return (src, index) => parse(src, index).mapErr(() => {
    return Token.Ignore({ index, size: 0 });
  });
}

/**
 * Try to match every passed parser,
 * returns first matched successfully
 */
export function Alt(...parsers: Parser[]) {
  const parseAlt: Parser = (src, index) => {
    const errors = [];
    for (const parse of parsers) {
      const res = parse(src, index);
      if (res.isOk) {
        return res;
      }
      errors.push(res.unwrapErr());
    }
    return Result.Err(ParseError.merge(errors, index));
  };
  return parseAlt;
}

/**
 * Parse sequence of parsers, one by one.
 * Returns Token with array of matched tokens.
 * To omit some tokens from sequence use Token.Ignore
 */
export function Seq(parsers: Parser[], checkEnd?: Parser) {
  const parseSeq: Parser = (src, index) => {
    const items: Token<any>[] = [];
    let lastIndex = index;
    for (const parse of parsers) {
      if (lastIndex >= src.length) {
        return Result.Err(new ParseError('Unexpected end of input', lastIndex));
      }
      const res = parse(src, lastIndex);
      if (Err.is(res)) {
        if (checkEnd && checkEnd(src, lastIndex).isOk) {
          break;
        } else {
          return res;
        }
      }
      const token = res.unwrap();
      lastIndex = token.end;
      if (!token.isIgnore) {
        items.push(token);
      }
    }
    if (items.length === 0) {
      return Result.Err(new ParseError('Cannot match sequence', lastIndex));
    }
    return Result.Ok(Token.Plain({
      index,
      size: lastIndex - index,
      type: 'sequence',
      value: items
    }));
  };
  return parseSeq;
}

/**
 * Parse list/repetitive parser patterns
 */
export function List(parseItem: Parser, parseDelim?: Parser, checkEnd?: Parser): Parser {
  return (src, index) => {
    const items = [];
    let lastIndex = index;
    try {
      while (lastIndex < src.length) {
        const itemRes = parseItem(src, lastIndex);
        if (Err.is(itemRes)) {
          return itemRes;
        }
        const itemToken = itemRes.unwrap();
        if (!itemToken.isIgnore) {
          items.push(itemToken);
        }
        lastIndex = itemToken.end;
        if (checkEnd && checkEnd(src, lastIndex).isOk) {
          break;
        }
        if (parseDelim) {
          const delimRes = parseDelim(src, lastIndex);
          if (Err.is(delimRes)) {
            break;
          }
          lastIndex = delimRes.unwrap().end;
        }
      }
      if (items.length === 0) {
        throw new ParseError('Cannot match list', lastIndex);
      }
    } catch (error) {
      return Result.Err(error);
    }
    return Result.Ok(Token.Plain({
      index,
      size: lastIndex - index,
      type: 'list',
      value: items
    }));
  };
}
