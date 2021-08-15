import { Regex, Ignore, Seq, List, Opt, Alt } from '../src/pcs/combinators.mjs';

function Num() {
  const parse = Regex(/\d+(?:\.d+)?/);
  return (input, offset) => {
    const res = parse(input, offset);
    return res.map((t) => ({
      offset: t.offset,
      length: t.length,
      type: "number",
      value: parseFloat(t.value[0])
    }));
  };
}

function WS() {
  const parse = Regex(/\s+/);
  return (input, offset) => {
    return parse(input, offset).map((t) => t.produce({
      type: "whitespace",
      value: t.value[0]
    }));
  };
}

function Str() {
  const parse = Regex(/'(.*?)(?<!')'/);
  return (src, index) => parse(src, index).map(t => t.produce({
    type: 'string',
    value: t.value[1]
  }));
}

function Cmp() {
  const parse = Regex(/ (=|>|<|<=|>=|<>) /);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "compare",
      value: t.value[1]
    }));
}

function Const() {
  const parse = Alt(Num(), Str());
  return (input, offset) => parse(input, offset);
}

function Id(type) {
  const parse = Regex(/[a-z][a-z0-9_]*/i);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type,
      value: t.value[0]
    }));
}

function ColId() {
  const parse = Seq([Id("table-name"), Regex(/\./), Id("column-name")]);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "column-id",
      value: {
        table: t.value[0].value,
        column: t.value[2].value
      }
    }));
}

function Val() {
  const parse = Alt(ColId(), Const());
  return parse;
}

function ValTest() {
  const parse = Seq([Val(), Cmp(), Val()]);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "value-test",
      value: {
        lhs: t.value[0],
        op: t.value[1],
        rhs: t.value[2]
      }
    }));
}

function Where() {
  const parse = Seq([Regex(/WHERE /), ValTest()]);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "where",
      value: t.value[1]
    }));
}

function Join() {
  const parse = Seq([
    Regex(/\s*JOIN /),
    Id("table-name"),
    Regex(/ ON /i),
    ValTest()
  ]);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "join",
      value: {
        table: t.value[1].value,
        test: t.value[3].value
      }
    }));
}

function From() {
  const parse = Seq([
    Regex(/\s*FROM /),
    Id("table-name"),
    Opt(List(Join(), WS(), Regex(/\s*WHERE/i)))
  ]);
  return (input, offset) => parse(input, offset).map((t) => {
    return t.produce({
      type: "from",
      value: {
        table: t.value[1].value,
        joins: t.value[2].value
      }
    });
  });
}

function Select() {
  const parse = Seq([Regex(/\s*SELECT /), List(ColId(), Regex(/\s*,\s*/))]);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "select",
      value: t.value[1].value
    }));
}

function Query() {
  const parse = Seq([
    Select(),
    Ignore(WS()),
    From(),
    Ignore(Opt(WS())),
    Opt(Where())
  ]);
  return (input, offset) =>
    parse(input, offset).map((t) => t.produce({
      type: "query",
      value: {
        select: t.value[0].value,
        from: t.value[1].value,
        where: t.value[2]
      }
    }));
}

export default (src) => {
  const parse = Query();
  return parse(src, 0);
};
