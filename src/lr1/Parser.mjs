class Parser {
  constructor() {
    this.rules = [];
    this.nonTerms = new Set();
  }
  
  addRule(name, tokens) {
    this.rules.push({ index: this.rules.length, name, tokens });
    this.nonTerms.add(name);
  }
  
  compile(mainRule) {
    const firstState = this.getFirstState(mainRule);
    console.log(`\n${this.serializeState(firstState)}\n`);
    console.log(this.getFirstSet('program'));
  }
  
  isTerm(name) {
    return !this.nonTerms.has(name);
  }
  
  getFirstState(mainRule) {
    const state = this.rules
      .filter(r => r.name === mainRule)
      .map(r => [r, 0]);
    const inState = new Set(state.map(s => s[0].index));
    for (let i = 0; i < state.length; i += 1) {
      const [rule, offset] = state[i];
      const token = rule.tokens[offset];
      if (!this.isTerm(token.type)) {
        this.rules
          .filter(r => !inState.has(r.index))
          .forEach(r => {
            inState.add(r.index);
            state.push([r, 0]);
          });
      }
    }
    return state;
  }
  
  getFirstSet(name) {
    const q = this.rules.filter(r => r.name === name);
    const checked = new Set(q.map(r => r.index));
    const firstSet = [];
    while (q.length > 0) {
      const rule = q.shift();
      const first = rule.tokens[0];
      if (this.isTerm(first.type)) {
        if (firstSet.every(t => !this.matchToken(t, first))) {
          firstSet.push(first);
        }
      } else {
        this.rules
          .filter(r => !checked.has(r.index))
          .forEach(r => {
            q.push(r);
            checked.add(r.index);
          });
      }
    }
    return firstSet;
  }

  matchToken(t1, t2) {
    let matches = true;
    if (t1.hasOwnProperty('type')) {
      matches &= t1.type === t2.type;
    }
    if (t1.hasOwnProperty('value')) {
      matches &= t1.value === t2.value;
    }
    return matches;
  }
  
  serializeState(state) {
    const lines = state.map(([rule, index]) => {
      const tokens = rule.tokens
        .map(t => t.value ? `'${t.value}'` : t.type)
        .map((t, i) => i === index ? `\u2022${t}` : t);
      if (index >= tokens.length) {
        tokens.push('\u2022');
      }
      const name = rule.name + ''.padStart(10 - rule.name.length, ' ');
      return `${rule.index.toString(10).padStart(3, ' ')} ${name}${tokens.join(' ')}`;
    });
    return lines.join('\n');
  }
}

export default Parser;
