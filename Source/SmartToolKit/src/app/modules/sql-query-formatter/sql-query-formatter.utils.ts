export type SqlTokenKind = 'word' | 'number' | 'string' | 'identifier' | 'comment' | 'operator' | 'punctuation' | 'parameter' | 'whitespace';

export interface SqlToken {
  kind: SqlTokenKind;
  value: string;
}

export interface SqlTokenizationResult {
  tokens: SqlToken[];
  error?: string;
}

export interface SqlTransformationResult {
  text: string;
  error?: string;
}

type ClauseInfo = {
  length: number;
  value: string;
  major: boolean;
};

const SQL_KEYWORDS = new Set([
  'ADD', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'ANY', 'AS', 'ASC', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE',
  'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT', 'DATABASE',
  'DECLARE', 'DEFAULT', 'DELETE', 'DESC', 'DISTINCT', 'DROP', 'ELSE', 'END', 'EXCEPT', 'EXISTS', 'EXPLAIN',
  'FALSE', 'FETCH', 'FILTER', 'FIRST', 'FOLLOWING', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'FUNCTION', 'GROUP',
  'HAVING', 'IF', 'IN', 'INDEX', 'INNER', 'INSERT', 'INTERSECT', 'INTO', 'IS', 'JOIN', 'KEY', 'LATERAL',
  'LEFT', 'LIKE', 'LIMIT', 'MATERIALIZED', 'MERGE', 'NEXT', 'NOT', 'NULL', 'NULLS', 'OFFSET', 'ON', 'ONLY',
  'OR', 'ORDER', 'OUTER', 'OVER', 'PARTITION', 'PRECEDING', 'PRIMARY', 'QUALIFY', 'RECURSIVE', 'REFERENCES',
  'RENAME', 'REPLACE', 'RETURNING', 'RIGHT', 'ROLLBACK', 'ROW', 'ROWS', 'SCHEMA', 'SELECT', 'SET', 'TABLE', 'TEMP', 'TEMPORARY',
  'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'TRUE', 'TRUNCATE', 'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VALUES',
  'VIEW', 'WHEN', 'WHERE', 'WINDOW', 'WITH', 'WITHIN'
]);

const MAJOR_CLAUSES = [
  'DELETE FROM', 'INSERT INTO', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE VIEW', 'DROP VIEW',
  'CREATE OR REPLACE', 'INSERT OR REPLACE',
  'GROUP BY', 'ORDER BY', 'PARTITION BY', 'UNION ALL', 'OFFSET FETCH', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN',
  'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN', 'NATURAL JOIN',
  'SELECT', 'FROM', 'WHERE', 'HAVING', 'LIMIT', 'OFFSET', 'FETCH', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'ALTER', 'DROP', 'INSERT', 'WITH', 'RETURNING', 'QUALIFY', 'UNION', 'INTERSECT', 'EXCEPT',
  'JOIN', 'ON', 'USING', 'WINDOW', 'CONNECT BY', 'START WITH', 'MODEL', 'PIVOT', 'UNPIVOT'
];

const MAJOR_CLAUSE_PARTS = MAJOR_CLAUSES.map(clause => clause.split(' '));

const CONTINUATION_WORDS = new Set(['AND', 'OR', 'ON', 'USING', 'WHEN', 'THEN', 'ELSE']);
const OPERATORS = [
  '->>', '#>>', '#>', '#-', '!~*', '!~', '~*', '||', '::', ':=', '=>', '->', '>=', '<=', '<>', '!=', '<<', '>>',
  '@>', '<@', '@?', '@@', '?|', '?&', '**', '//', '&&', '|=', '+', '-', '*', '/', '%', '=', '<', '>', '~', '#', '^', '&', '|', ':', '?'
];
const OPERATOR_PAIRS = new Set(['--', '/*', '*/', '::', '->', '=>', '<=', '>=', '<>', '!=', '||', '&&', '<<', '>>', '..']);
const PUNCTUATION = new Set(['(', ')', ',', ';', '.']);
const SPACE_BEFORE_PARENTHESIS = new Set(['IN', 'VALUES', 'EXISTS', 'ALL', 'ANY', 'ON', 'USING', 'WHERE', 'AND', 'OR', 'NOT', 'BETWEEN', 'LIKE', 'SELECT', 'AS']);
const QUOTES = new Set(["'", '"', '`']);

export function tokenizeSql(query: string): SqlTokenizationResult {
  const tokens: SqlToken[] = [];
  let index = 0;
  let error: string | undefined;
  let previousSignificantWord = '';

  while (index < query.length) {
    const character = query[index];

    if (/\s/.test(character)) {
      const start = index;
      while (index < query.length && /\s/.test(query[index])) {
        index++;
      }
      tokens.push({ kind: 'whitespace', value: query.slice(start, index) });
      continue;
    }

    const previousWord = character === '#' ? previousSignificantWord : '';
    const hashNameStart = character === '#' && (
      /[A-Za-z_]/.test(query[index + 1] ?? '') ||
      (query[index + 1] === '#' && /[A-Za-z_]/.test(query[index + 2] ?? ''))
    );
    const hashIdentifier = character === '#' && hashNameStart &&
      (index === 0 || /[\s(]/.test(query[index - 1] ?? '')) &&
      ['TABLE', 'TEMP', 'TEMPORARY', 'FROM', 'JOIN', 'INTO', 'UPDATE'].includes(previousWord);
    const isHashComment = character === '#' && !query.startsWith('#>', index) && !query.startsWith('#>>', index) &&
      !query.startsWith('#-', index) && !hashIdentifier &&
      (index === 0 || /[\s;)\d]/.test(query[index - 1] ?? '')) &&
      (index + 1 >= query.length || /\s/.test(query[index + 1] ?? '') ||
        (/[\d]/.test(query[index - 1] ?? '') && /[A-Za-z_]/.test(query[index + 1] ?? '')));
    if ((character === '-' && query[index + 1] === '-') || isHashComment) {
      const start = index;
      if (isHashComment) {
        index++;
      } else {
        index += 2;
      }
      while (index < query.length && query[index] !== '\n' && query[index] !== '\r') {
        index++;
      }
      tokens.push({ kind: 'comment', value: query.slice(start, index) });
      continue;
    }

    if (character === '/' && query[index + 1] === '*') {
      const start = index;
      const end = query.indexOf('*/', index + 2);
      if (end < 0) {
        error = 'Unterminated block comment.';
        index = query.length;
        break;
      }
      index = end + 2;
      tokens.push({ kind: 'comment', value: query.slice(start, index) });
      continue;
    }

    const dollarDelimiter = getDollarDelimiter(query, index);
    if (dollarDelimiter) {
      const start = index;
      const end = query.indexOf(dollarDelimiter, index + dollarDelimiter.length);
      if (end < 0) {
        error = 'Unterminated dollar-quoted string.';
        index = query.length;
        break;
      }
      index = end + dollarDelimiter.length;
      tokens.push({ kind: 'string', value: query.slice(start, index) });
      continue;
    }

    if ((character === 'U' || character === 'u') && query[index + 1] === '&' && QUOTES.has(query[index + 2] ?? '')) {
      const quote = query[index + 2];
      const result = consumeQuoted(query, index + 2, quote);
      if (!result.closed) {
        error = 'Unterminated prefixed quoted value.';
        index = query.length;
        break;
      }
      index = result.end;
      tokens.push({ kind: 'string', value: query.slice(index - result.length - 2, index) });
      continue;
    }

    if (QUOTES.has(character)) {
      const result = consumeQuoted(query, index, character);
      if (!result.closed) {
        error = 'Unterminated quoted value.';
        index = query.length;
        break;
      }
      index = result.end;
      tokens.push({ kind: character === "'" ? 'string' : 'identifier', value: query.slice(index - result.length, index) });
      continue;
    }

    if (character === '[') {
      const result = consumeQuoted(query, index, ']');
      if (!result.closed) {
        error = 'Unterminated bracketed identifier.';
        index = query.length;
        break;
      }
      index = result.end;
      tokens.push({ kind: 'identifier', value: query.slice(index - result.length, index) });
      continue;
    }

    if ((character === '@' || character === ':') && isParameterStart(query, index)) {
      const start = index;
      index++;
      if (character === '@' && query[index] === '@') {
        index++;
      }
      while (index < query.length && isWordPart(query[index])) {
        index++;
      }
      tokens.push({ kind: 'parameter', value: query.slice(start, index) });
      continue;
    }

    if (hashIdentifier) {
      const start = index;
      index++;
      if (query[index] === '#') {
        index++;
      }
      while (index < query.length && isWordPart(query[index])) {
        index++;
      }
      const value = query.slice(start, index);
      tokens.push({ kind: 'identifier', value });
      previousSignificantWord = value.replace(/^#+/, '').toUpperCase();
      continue;
    }

    if (isWordStart(character)) {
      const start = index;
      index++;
      while (index < query.length && isWordPart(query[index])) {
        index++;
      }
      const value = query.slice(start, index);
      tokens.push({ kind: 'word', value });
      previousSignificantWord = value.toUpperCase();
      continue;
    }

    if (isNumberStart(query, index)) {
      const start = index;
      index = consumeNumber(query, index);
      tokens.push({ kind: 'number', value: query.slice(start, index) });
      continue;
    }

    if ((character === '$' || (character === '?' && query[index + 1] !== '|' && query[index + 1] !== '&')) && index < query.length) {
      const start = index;
      index += character === '?' ? 1 : 1;
      while (index < query.length && isWordPart(query[index])) {
        index++;
      }
      if (index > start + 1 || character === '?') {
        tokens.push({ kind: 'parameter', value: query.slice(start, index) });
        continue;
      }
      index = start;
    }

    const operator = OPERATORS.find(candidate => query.startsWith(candidate, index));
    if (operator) {
      index += operator.length;
      tokens.push({ kind: 'operator', value: operator });
      continue;
    }

    index++;
    tokens.push({
      kind: PUNCTUATION.has(character) ? 'punctuation' : 'operator',
      value: character
    });
  }

  if (!error) {
    let parenthesisDepth = 0;
    for (const token of tokens) {
      if (token.value === '(') {
        parenthesisDepth++;
      } else if (token.value === ')') {
        parenthesisDepth--;
        if (parenthesisDepth < 0) {
          error = 'Unexpected closing parenthesis.';
          break;
        }
      }
    }
    if (!error && parenthesisDepth > 0) {
      error = 'Unclosed parenthesis.';
    }
  }

  return error ? { tokens, error } : { tokens };
}

export function formatSql(query: string): SqlTransformationResult {
  const tokenized = tokenizeSql(query);
  if (tokenized.error) {
    return { text: '', error: tokenized.error };
  }

  const tokens = tokenized.tokens
    .filter(token => token.kind !== 'whitespace')
    .map(normalizeToken);
  if (tokens.length === 0) {
    return { text: '' };
  }

  const lines: string[] = [];
  let currentLine = '';
  let lineHasContent = false;
  let breakBeforeNext = false;
  let lastToken: SqlToken | undefined;
  let depth = 0;
  let caseDepth = 0;
  let lastMajorClause = '';

  const pushLine = (): void => {
    if (lineHasContent) {
      lines.push(currentLine.replace(/\s+$/, ''));
    }
    currentLine = '';
    lineHasContent = false;
  };

  const startLine = (token: SqlToken, listContinuation: boolean): void => {
    const continuation = CONTINUATION_WORDS.has(token.value.toUpperCase());
    const indentation = Math.max(0, depth + (continuation || listContinuation ? 1 : 0));
    currentLine = ' '.repeat(indentation * 2);
    lineHasContent = false;
  };

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const clause = getClauseInfo(tokens, index);
    const isComment = token.kind === 'comment';
    const listContinuation = breakBeforeNext && lineHasContent && token.value !== ')' && token.value !== ',' && token.value !== ';';
    const shouldBreak = !isComment && lineHasContent && (
      listContinuation ||
      (clause?.major === true && !isClauseContinuation(tokens, index)) ||
      (isContinuationWord(token) && caseDepth === 0 && !isClauseContinuation(tokens, index)) ||
      (lastToken?.value === ';' && token.value !== ')')
    );

    if (shouldBreak) {
      pushLine();
    }
    breakBeforeNext = false;

    if (!lineHasContent) {
      startLine(token, listContinuation);
    }

    if (lastToken && lineHasContent && needsFormatSpace(lastToken, token, lastMajorClause, tokens[index - 2])) {
      currentLine += ' ';
    }
    currentLine += token.value;
    lineHasContent = true;
    lastToken = token;

    if (token.value === '(') {
      depth++;
    } else if (token.value === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (token.kind === 'word') {
      const word = token.value.toUpperCase();
      if (word === 'CASE') {
        caseDepth++;
      } else if (word === 'END' && caseDepth > 0) {
        caseDepth--;
      }
    }

    if (clause?.major && !isClauseContinuation(tokens, index)) {
      lastMajorClause = clause.value;
    }

    if (token.value === ',' && depth <= 1 && (lastMajorClause === 'SELECT' || lastMajorClause === 'FROM')) {
      breakBeforeNext = true;
    }
    if (token.value === ';' || (token.kind === 'comment' && (token.value.startsWith('--') || token.value.startsWith('#')))) {
      pushLine();
    }
  }

  pushLine();
  return { text: lines.join('\n') };
}

export function minifySql(query: string): SqlTransformationResult {
  const tokenized = tokenizeSql(query);
  if (tokenized.error) {
    return { text: '', error: tokenized.error };
  }

  let output = '';
  let lastToken: SqlToken | undefined;
  let removedComment = false;

  for (const originalToken of tokenized.tokens) {
    if (originalToken.kind === 'whitespace') {
      continue;
    }

    if (originalToken.kind === 'comment' && !isImportantComment(originalToken.value)) {
      removedComment = true;
      continue;
    }

    const token = normalizeToken(originalToken);
    if (output && needsMinifySpace(lastToken, token, removedComment)) {
      output += ' ';
    }
    output += token.value;
    lastToken = token;
    removedComment = false;
  }

  return { text: output.trim() };
}

function consumeQuoted(query: string, start: number, quote: string): { end: number; length: number; closed: boolean } {
  let index = start + 1;
  while (index < query.length) {
    if (query[index] === quote) {
      if (query[index + 1] === quote) {
        index += 2;
        continue;
      }
      index++;
      return { end: index, length: index - start, closed: true };
    }
    if (quote === "'" && query[index] === '\\' && query[start - 1]?.toLowerCase() === 'e' && index + 1 < query.length) {
      index += 2;
      continue;
    }
    index++;
  }
  return { end: index, length: index - start, closed: false };
}

function getDollarDelimiter(query: string, index: number): string | null {
  if (query[index] !== '$') {
    return null;
  }

  let cursor = index + 1;
  if (query[cursor] === '$') {
    return '$$';
  }
  if (!query[cursor] || !/[A-Za-z_]/.test(query[cursor])) {
    return null;
  }

  cursor++;
  while (cursor < query.length && /[A-Za-z0-9_]/.test(query[cursor])) {
    cursor++;
  }
  return query[cursor] === '$' ? query.slice(index, cursor + 1) : null;
}

function isParameterStart(query: string, index: number): boolean {
  const next = query[index + 1];
  if (query[index] === ':') {
    return next !== undefined && next !== ':' && /[A-Za-z_]/.test(next);
  }
  return next !== undefined && /[A-Za-z_@]/.test(next);
}

function isWordStart(character: string): boolean {
  return /[A-Za-z_]/.test(character);
}

function isWordPart(character: string): boolean {
  return /[A-Za-z0-9_$]/.test(character);
}

function isNumberStart(query: string, index: number): boolean {
  const character = query[index];
  return /[0-9]/.test(character) || (character === '.' && /[0-9]/.test(query[index + 1] ?? ''));
}

function consumeNumber(query: string, start: number): number {
  let index = start;
  if (query[index] === '0' && /[xX]/.test(query[index + 1] ?? '')) {
    index += 2;
    while (index < query.length && /[0-9a-fA-F]/.test(query[index])) {
      index++;
    }
    return index;
  }

  while (index < query.length && /[0-9]/.test(query[index])) {
    index++;
  }
  if (query[index] === '.') {
    index++;
    while (index < query.length && /[0-9]/.test(query[index])) {
      index++;
    }
  }
  if (/[eE]/.test(query[index] ?? '')) {
    index++;
    if (/[+-]/.test(query[index] ?? '')) {
      index++;
    }
    while (index < query.length && /[0-9]/.test(query[index])) {
      index++;
    }
  }
  return index;
}

function normalizeToken(token: SqlToken): SqlToken {
  if (token.kind === 'word' && SQL_KEYWORDS.has(token.value.toUpperCase())) {
    return { ...token, value: token.value.toUpperCase() };
  }
  return token;
}

function getClauseInfo(tokens: SqlToken[], index: number): ClauseInfo | null {
  const token = tokens[index];
  if (!token || token.kind !== 'word') {
    return null;
  }

  for (let clauseIndex = 0; clauseIndex < MAJOR_CLAUSE_PARTS.length; clauseIndex++) {
    const parts = MAJOR_CLAUSE_PARTS[clauseIndex];
    if (parts.every((part, partIndex) => tokens[index + partIndex]?.value.toUpperCase() === part)) {
      return { length: parts.length, value: MAJOR_CLAUSES[clauseIndex], major: true };
    }
  }
  return null;
}

function isClauseContinuation(tokens: SqlToken[], index: number): boolean {
  const current = tokens[index]?.value.toUpperCase();
  const previous = tokens[index - 1]?.value.toUpperCase();
  if ((current === 'FROM' && previous === 'DELETE') || (current === 'INTO' && previous === 'INSERT') ||
      (current === 'OR' && ['CREATE', 'INSERT'].includes(previous ?? '')) ||
      (current === 'TABLE' && ['CREATE', 'ALTER', 'DROP'].includes(previous ?? '')) ||
      (current === 'JOIN' && ['LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'NATURAL'].includes(previous ?? '')) ||
      (current === 'ALL' && previous === 'UNION')) {
    return true;
  }
  return false;
}

function isContinuationWord(token: SqlToken): boolean {
  return token.kind === 'word' && CONTINUATION_WORDS.has(token.value.toUpperCase());
}

function needsFormatSpace(previous: SqlToken, current: SqlToken, lastMajorClause: string, previousPrevious?: SqlToken): boolean {
  if (current.value === ',' || current.value === ';' || current.value === ')' || current.value === '.') {
    return false;
  }
  if (previous.value === '(' || previous.value === '.' || previous.value === '[') {
    return false;
  }
  if (isUnaryNumberContext(previous, current, previousPrevious)) {
    return false;
  }
  if (current.value === '(') {
    return previous.kind === 'word' && SPACE_BEFORE_PARENTHESIS.has(previous.value.toUpperCase());
  }
  if (current.value === '[' || (current.kind === 'identifier' && current.value.startsWith('['))) {
    return false;
  }
  if (isStringPrefix(previous, current)) {
    return false;
  }
  if (previous.value === ',' || previous.value === ';') {
    return true;
  }
  if (current.kind === 'comment' || previous.kind === 'comment') {
    return true;
  }
  if (isWordLike(previous) && isWordLike(current)) {
    return true;
  }
  if (previous.kind === 'operator' || current.kind === 'operator') {
    return true;
  }
  if (lastMajorClause === 'SELECT' && current.value === '(' && previous.kind === 'word') {
    return true;
  }
  return false;
}

function needsMinifySpace(previous: SqlToken | undefined, current: SqlToken, removedComment: boolean): boolean {
  if (!previous) {
    return false;
  }
  if (current.value === ',' || current.value === ';' || current.value === ')' || current.value === '.') {
    return false;
  }
  if (previous.value === '(' || previous.value === '.' || previous.value === '[' || previous.value === '::') {
    return false;
  }
  if (previous.value === ')' && current.kind === 'word') {
    return true;
  }
  if (previous.kind === 'word' && SQL_KEYWORDS.has(previous.value.toUpperCase()) && current.kind === 'operator') {
    return true;
  }
  if (current.value === '[' || (current.kind === 'identifier' && current.value.startsWith('['))) {
    return false;
  }
  if (isStringPrefix(previous, current)) {
    return false;
  }
  if (current.value === '(') {
    return previous.kind === 'word' && SPACE_BEFORE_PARENTHESIS.has(previous.value.toUpperCase());
  }
  if (previous.value === ',' || previous.value === ';') {
    return true;
  }
  if (isWordLike(previous) && isWordLike(current)) {
    return true;
  }
  if (previous.value === '*' && current.kind === 'word') {
    return true;
  }
  if ((previous.kind === 'operator' && current.kind === 'operator') || OPERATOR_PAIRS.has(previous.value + current.value)) {
    return true;
  }
  if (current.kind === 'comment' || previous.kind === 'comment') {
    return true;
  }
  if (removedComment && isWordLike(previous) && isWordLike(current)) {
    return true;
  }
  return false;
}

function isStringPrefix(previous: SqlToken, current: SqlToken): boolean {
  if (previous.kind !== 'word' || current.kind !== 'string') {
    return false;
  }
  const prefix = previous.value.toUpperCase();
  return ['B', 'E', 'N', 'Q', 'R', 'X'].includes(prefix) || /^_[A-Z0-9]+$/.test(prefix);
}

function isUnaryNumberContext(previous: SqlToken, current: SqlToken, previousPrevious?: SqlToken): boolean {
  if ((previous.value !== '+' && previous.value !== '-') || current.kind !== 'number') {
    return false;
  }

  if (!previousPrevious) {
    return true;
  }

  return previousPrevious.value === '(' || previousPrevious.value === ',' || previousPrevious.kind === 'operator' ||
    (previousPrevious.kind === 'word' && SPACE_BEFORE_PARENTHESIS.has(previousPrevious.value.toUpperCase()));
}

function isWordLike(token: SqlToken): boolean {
  return token.kind === 'word' || token.kind === 'number' || token.kind === 'string' || token.kind === 'identifier' || token.kind === 'parameter';
}

function isImportantComment(value: string): boolean {
  return value.startsWith('/*+') || value.startsWith('/*!');
}
