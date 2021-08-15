const TOKEN_IGNORE = Symbol('@tkustov/parsing/Token/Ignore');

export class Token {
  static Plain(params) { return new Token(params); }
  static Ignore({ index, size }) { return new Token({ index, size, type: TOKEN_IGNORE }); }
  constructor({ index, size, type, value = undefined }) {
    this.index = index;
    this.size = size;
    this.type = type;
    this.value = value;
  }
  produce({ type, value }) {
    return new Token({ index: this.index, size: this.size, type, value });
  }
  ignore() {
    return Token.Ignore({ index: this.index, size: this.size });
  }
  get end() { return this.index + this.size; }
  get isIgnore() { return this.type === TOKEN_IGNORE; }
}
