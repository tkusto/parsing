export const lexic = [
  ['whitespace', /\s+/],
  ['paren', /[()]/, val => val[0]],
  ['op', /[-+*/%=]/, val => val[0]],
  ['id', /[a-z_][a-z_0-9]*/i, val => val[0]],
  ['number', /\d+(?:\.\d+)?/, val => parseFloat(val[0])],
];

function T(type) { return { type }; }
function TV(type, value) { return { type, value }; }
function OP(op) { return { type: 'op', value: op }; }

export const grammar = [
  ['factor', [
    [T('number')],
    [T('id')],
    [T('assign')],
    [TV('paren', '('), T('expr'), TV('paren', ')')],
  ]],
  ['assign', T('id'), OP('='), T('expr')],
  ['mul', [
    [T('factor')],
    [T('mul'), OP('*'), T('factor')],
    [T('mul'), OP('/'), T('factor')],
    [T('mul'), OP('%'), T('factor')]
  ]],
  ['add', [
    [T('mul')],
    [T('add'), OP('+'), T('mul')],
    [T('add'), OP('-'), T('mul')]
  ]],
  ['expr', T('add')],
  ['program', [
    [T('program'), T('expr')],
    [T('expr')]
  ]]
];
