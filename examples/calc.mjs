import Calc from './calc-grammar.mjs';

const code = 'y = 2 + x * x * (a - 5) / 3 % 15';
const tree = Calc(code).unwrap();
console.log(JSON.stringify(tree, null, 2));
