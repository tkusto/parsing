enum Kind {
  Ok = 'ok',
  Err = 'err'
}

export interface IResult<V,E,K extends Kind> {
  readonly isOk: K extends Kind.Ok ? true : false;
  readonly isErr: K extends Kind.Ok ? false : true;
  unwrap(): K extends Kind.Ok ? V : void;
  unwrapErr(): K extends Kind.Err ? E : void;
  map<R>(
    mapFn: (v: V) => R
  ): K extends Kind.Ok ? IResult<R,void,K> : IResult<V,E,K>;
  mapOrElse<V1,V2>(
    elseFn: () => V2,
    mapFn: (v: V) => V1
  ): K extends Kind.Ok ? V1 : V2;
  mapErr<R>(
    mapErrFn: (e: E) => R
  ): K extends Kind.Err ? IResult<R,void,Kind.Ok> : IResult<V,E,K>;
}

export class Result {
  static Ok<V>(value: V) {
    return new Ok(value);
  }

  static Err<E>(error: E) {
    return new Err(error);
  }
}

export class Ok<V> extends Result implements IResult<V,void,Kind.Ok> {
  static is<V>(res: unknown): res is Ok<V> {
    return res instanceof Ok;
  }

  constructor(
    private value: V
  ) {
    super();
  }

  get isOk(): true {
    return true;
  }

  get isErr(): false {
    return false;
  }

  unwrap() {
    return this.value;
  }

  unwrapErr() {
    throw this.value;
  }

  map<R>(mapFn: (v: V) => R) {
    return new Ok<R>(mapFn(this.value));
  }

  mapOrElse<V1,V2>(elseFn: () => V2, mapFn: (v: V) => V1) {
    return mapFn(this.value);
  }

  mapErr<R>(mapErrFn: (e: void) => R) {
    return this;
  }
}

export class Err<E> extends Result implements IResult<void,E,Kind.Err> {
  static is<E>(res: unknown): res is Err<E> {
    return res instanceof Err;
  }

  constructor(
    private error: E
  ) {
    super();
  }

  get isOk(): false {
    return false;
  }

  get isErr(): true {
    return true;
  }

  unwrap() {
    throw this.error;
  }

  unwrapErr() {
    return this.error;
  }

  map<R>(mapFn: (v: void) => R) {
    return this;
  }

  mapOrElse<V1, V2>(elseFn: () => V2, mapFn: (v: void) => V1) {
    return elseFn();
  }

  mapErr<R>(mapErrFn: (e: E) => R) {
    return new Ok<R>(mapErrFn(this.error));
  }
}
