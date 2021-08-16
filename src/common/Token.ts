interface TokenPosition {
  index: number;
  size: number;
}

interface TokenValue<V> {
  type: TokenType;
  value: V;
}

type TokenParams<V> = TokenPosition & TokenValue<V>;

type TokenType = string | symbol;

const IgnoreSymbol = Symbol('Token/Ignore');

export class Token<V> {
  static Plain<V>({ index, size, type, value }: TokenParams<V>) {
    return new Token(index, size, type, value);
  }

  static Ignore({ index, size }: TokenPosition) {
    return new Token<undefined>(index, size, IgnoreSymbol, undefined);
  }

  constructor(
    public index: number,
    public size: number,
    public type: TokenType,
    public value: V
  ) {
    Object.freeze(this);
  }

  produce<V2>({ type, value }: TokenValue<V2>) {
    return Token.Plain({
      index: this.index,
      size: this.size,
      type,
      value
    });
  }

  ignore() {
    return Token.Ignore({
      index: this.index,
      size: this.size
    });
  }

  get end() {
    return this.index + this.size;
  }

  get isIgnore() {
    return this.type === IgnoreSymbol;
  }
}
