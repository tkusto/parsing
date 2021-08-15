import { Token } from '../src/common/index.mjs';
import { Regex, Seq, Alt } from '../src/pcs/combinators.mjs';

function Num() {
  const parse = Regex(/\d+(?:\.(\d+))?/);
  const parseNum = (src, index) => parse(src, index).map(t => t.produce({
    type: 'number',
    value: parseFloat(t.value[0])
  }));
  return parseNum;
}

function Id() {
  const parse = Regex(/[a-z_][a-z_0-9]*/i);
  const parseId = (src, index) => parse(src, index).map(t => t.produce({
    type: 'identifier',
    value: t.value[0]
  }));
  return parseId;
}

function Mul() {
  const parseMul = (src, index) => {
    const parse = Seq([
      Alt(Id(), Num(), Paren()),
      Regex(/\s*([*/%])\s*/),
      Alt(Mul(), Id(), Num(), Paren())
    ]);
    return parse(src, index).map(t => {
      const lhs = t.value[0];
      const op = t.value[1].value[1];
      const rhs = t.value[2];
      // Next piece of code used for "rotate" mul subtree
      // to keep right operations order. This trick is needed because
      // Parser Combinators can't handle left-recursion grammars
      // mul ::= mul ('*' | '/' | '%') factor ; left recursion
      // mul ::= factor ('*' | '/' | '%') mul ; actual grammar
      if (rhs.type === 'mul') {
        return t.produce({
          type: 'mul',
          value: {
            lhs: Token.Plain({
              index,
              size: 5,
              type: 'mul',
              value: {
                lhs,
                op,
                rhs: rhs.value.lhs
              }
            }),
            op: rhs.value.op,
            rhs: rhs.value.rhs
          }
        });
      }
      return t.produce({
        type: 'mul',
        value: { lhs, op, rhs }
      });
    });
  };
  return parseMul;
}

function Add() {
  const parseAdd = (src, index) => {
    const parse = Seq([
      Alt(Mul(), Id(), Num(), Paren()),
      Regex(/\s*([-+])\s*/),
      Alt(Add(), Mul(), Id(), Num(), Paren())
    ]);
    return parse(src, index).map(t => t.produce({
      type: 'add',
      value: {
        lhs: t.value[0],
        op: t.value[1].value[1],
        rhs: t.value[2]
      }
    }));
  };
  return parseAdd;
}

function Assign() {
  const parseAssign = (src, index) => {
    const parse = Seq([Id(), Regex(/\s*=\s*/), Expr()]);
    return parse(src, index).map(t => t.produce({
      type: 'assignment',
      value: {
        lhs: t.value[0],
        rhs: t.value[2]
      }
    }));
  };
  return parseAssign;
}

function Factor() {
  const parseFactor = (src, index) => {
    const parse = Alt(Assign(), Num(), Id(), Paren());
    return parse(src, index);
  };
  return parseFactor;
}

function Expr() {
  const parseExpr = (src, index) => {
    const parse = Alt(Add(), Mul(), Factor());
    return parse(src, index);
  };
  return parseExpr;
}

function Paren() {
  const parseParen = (src, index) => {
    const parse = Seq([
      Regex(/\s*\(\s*/),
      Expr(),
      Regex(/\s*\)\s*/)
    ]);
    return parse(src, index).map(t => t.produce({
      type: t.value[1].type,
      value: t.value[1].value
    }));
  };
  return parseParen;
}

export default (src) => {
  const parse = Expr();
  return parse(src, 0);
}
