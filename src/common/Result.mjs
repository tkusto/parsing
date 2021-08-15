export class Result {
  static Ok(value) { return new Ok(value); }
  static Err(error) { return new Err(error); }
  get isOk() { return false; }
  get isErr() { return false; }
}

class Ok extends Result {
  constructor(value) {
    super();
    this.value = value;
    Object.freeze(this);
  }
  get isOk() { return true; }
  unwrap() { return this.value; }
  unwrapErr() { throw this.value; }
  map(mapFn) { return new Ok(mapFn(this.value)); }
  mapOrElse(elseFn, mapFn) { return mapFn(this.value); }
  mapErr(mapFn) { return this; }
}

class Err extends Result {
  constructor(error) {
    super();
    this.error = error;
    Object.freeze(this);
  }
  get isErr() { return true; }
  unwrap() { throw this.error; }
  unwrapErr() { return this.error; }
  map(mapFn) { return this; }
  mapErr(mapFn) { return new Ok(mapFn(this.error)); }
  mapOrElse(elseFn, mapFn) { return elseFn(); }
}
