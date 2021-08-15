import SSQL from './ssql-pc-grammar.mjs';

const code = `
SELECT movie.name
FROM movie JOIN director ON movie.directorID = director.id
WHERE director.name = 'Jame''s Cameron'
`;

try {
  const tree = SSQL(code).unwrap();
  console.log(JSON.stringify(tree, null, 2));
} catch (error) {
  console.log(code.slice(error.index - 5, error.index + 5));
  console.error(error.stack);
}

