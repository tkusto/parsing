import { Result, Token, ParseError } from '../common';


export function Text(text, ci = false) {
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

export function Regex(re) {
  const flags = new Set([...re.flags.split(''), 'g', 'y']);
  const pattern = new RegExp(re, Array.from(flags).join(''));
  const parseRegex = (src, index) => {
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

export function Ignore(parse) {
  return (src, index) => parse(src, index).map(t => t.ignore());
}

export function Opt(parse) {
  return (src, index) => parse(src, index).mapErr(() => {
    return Token.Ignore({ index, size: 0 });
  });
}

export function Alt(...parsers) {
  const parseAlt = (src, index) => {
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

export function Seq(parsers, checkEnd) {
  const parseSeq = (src, index) => {
    const items = [];
    let lastIndex = index;
    for (const parse of parsers) {
      if (lastIndex >= src.length) {
        return Result.Err(new ParseError('Unexpected end of input', lastIndex));
      }
      const res = parse(src, lastIndex);
      if (res.isErr) {
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

export function List(parseItem, parseDelim, checkEnd) {
  return (src, index) => {
    const items = [];
    let lastIndex = index;
    try {
      while (lastIndex < src.length) {
        const itemRes = parseItem(src, lastIndex);
        if (itemRes.isErr) {
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
          if (delimRes.isErr) {
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
