export class ParseError extends Error {
  static merge(errors: Error[], index: number) {
    return new ParseError([
      'Multiple errors occured:',
      ...errors.map(err => err.toString())
    ].join('\n'), index);
  }
  constructor(message: string, public index: number) {
    super(`${message} at ${index}`);
    this.name = 'ParseError';
  }
}
