const TOKEN_IGNORE = Symbol('@tkustov/parsing/Token/Ignore');

/** Class representing Token */
class Token {
  /**
   * Creates regular token
   * @param {TokenParams} params 
   * @returns {Token}
   */
  static Plain(params) {
    return new Token(params);
  }

  /**
   * Creates Ignore token
   * @param {Object} param0 - token dimension params
   * @property {number} index - offset in source string
   * @property {number} size - size of substring that represents token
   * @returns {Token}
   */
  static Ignore({ index, size }) {
    return new Token({ index, size, type: TOKEN_IGNORE });
  }

  /**
   * Create a token, better to use static methods
   * @param {TokenParams} param0 - token params
   */
  constructor({ index, size, type, value = undefined }) {
    this.index = index;
    this.size = size;
    this.type = type;
    this.value = value;
    Object.freeze(this);
  }

  /**
   * Create new token using location of the current one
   * @param {Object} param0 
   * @property {string|symbol} type - new token type
   * @property {*} value - new token value
   * @returns {Token}
   */
  produce({ type, value }) {
    return Token.Plain({ index: this.index, size: this.size, type, value });
  }

  /**
   * Creates ignore token based on the current one
   * @returns {Token}
   */
  ignore() {
    return Token.Ignore({ index: this.index, size: this.size });
  }

  /**
   * Position just after the current token
   * @type {number}
   */
  get end() {
    return this.index + this.size;
  }

  /**
   * Indicates is the current token ignore or not
   * @type {boolean}
   */
  get isIgnore() {
    return this.type === TOKEN_IGNORE;
  }
}

export default Token;

/**
 * @typedef {Object} TokenParams
 * @property {number} index - offset in source code
 * @property {number} size - length of substring that represents token
 * @property {string|symbol} type - type of token
 * @property {*} value - value of token
 */
