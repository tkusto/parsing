import { Parser, Regex, Ignore, Seq, List, Opt, Alt } from '../../pcs/combinators';

function Num(): Parser {
  const parse = Regex(/\d+(?:\.d+)?/);
  return (src, index) => {
    const res = parse(src, index);
    return res.map((t) => t.produce({
      type: "number",
      value: parseFloat(t.value[0])
    }));
  };
}

function WS(): Parser {
  const parse = Regex(/\s+/);
  return (src, index) => {
    return parse(src, index).map((t) => t.produce({
      type: "whitespace",
      value: t.value[0]
    }));
  };
}

function Str(): Parser {
  const parse = Regex(/'(.*?)(?<!')'/);
  return (src, index) => parse(src, index).map(t => t.produce({
    type: 'string',
    value: t.value[1]
  }));
}

function Cmp(): Parser {
  const parse = Regex(/ (=|>|<|<=|>=|<>) /);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type: "compare",
      value: t.value[1]
    }));
}

function Const(): Parser {
  const parse = Alt(Num(), Str());
  return (src, index) => parse(src, index);
}

function Id(type: string): Parser {
  const parse = Regex(/[a-z][a-z0-9_]*/i);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type,
      value: t.value[0]
    }));
}

function ColId(): Parser {
  const parse = Seq([Id("table-name"), Regex(/\./), Id("column-name")]);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
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

function ValTest(): Parser {
  const parse = Seq([Val(), Cmp(), Val()]);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type: "value-test",
      value: {
        lhs: t.value[0],
        op: t.value[1],
        rhs: t.value[2]
      }
    }));
}

function Where(): Parser {
  const parse = Seq([Regex(/WHERE /), ValTest()]);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type: "where",
      value: t.value[1]
    }));
}

function Join(): Parser {
  const parse = Seq([
    Regex(/\s*JOIN /),
    Id("table-name"),
    Regex(/ ON /i),
    ValTest()
  ]);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type: "join",
      value: {
        table: t.value[1].value,
        test: t.value[3].value
      }
    }));
}

function From(): Parser {
  const parse = Seq([
    Regex(/\s*FROM /),
    Id("table-name"),
    Opt(List(Join(), WS(), Regex(/\s*WHERE/i)))
  ]);
  return (src, index) => parse(src, index).map((t) => {
    return t.produce({
      type: "from",
      value: {
        table: t.value[1].value,
        joins: t.value[2].value
      }
    });
  });
}

function Select(): Parser {
  const parse = Seq([Regex(/\s*SELECT /), List(ColId(), Regex(/\s*,\s*/))]);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type: "select",
      value: t.value[1].value
    }));
}

function Query(): Parser {
  const parse = Seq([
    Select(),
    Ignore(WS()),
    From(),
    Ignore(Opt(WS())),
    Opt(Where())
  ]);
  return (src, index) =>
    parse(src, index).map((t) => t.produce({
      type: "query",
      value: {
        select: t.value[0].value,
        from: t.value[1].value,
        where: t.value[2]
      }
    }));
}

export default (src: string) => {
  const parse = Query();
  return parse(src, 0);
};
