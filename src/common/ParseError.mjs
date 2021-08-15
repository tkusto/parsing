export class ParseError extends Error {
  static merge(errors, index) {
    return new ParseError([
      'Multiple errors occured:',
      ...errors.map(err => err instanceof Error ? err.toString() : err)
    ].join('\n'), index);
  }
  constructor(message, index) {
    super(`${message} at ${index}`);
    this.name = 'ParseError';
    this.index = index;
  }
}
