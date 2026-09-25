import { formatSql, minifySql, tokenizeSql } from './sql-query-formatter.utils';

describe('SQL query formatter utilities', () => {
  it('preserves quoted values and comment markers', () => {
    const query = "select 'from' as value, 'a--b' as other from t /* comment */";

    expect(formatSql(query).text).toContain("'from'");
    expect(minifySql(query).text).toContain("'a--b'");
    expect(minifySql(query).text).not.toContain('comment');
  });

  it('keeps qualified joins and unary minus readable and safe', () => {
    const formatted = formatSql('select a - -1 from t left join u on t.id = u.id');
    const minified = minifySql('select a - -1 from t left join u on t.id = u.id');

    expect(formatted.text).toContain('LEFT JOIN');
    expect(formatted.text).toContain('a - -1');
    expect(minified.text).toContain('a- -1');
    expect(minified.text).not.toContain('a--1');
  });

  it('supports common SQL variables and operators', () => {
    const query = "select @@ROWCOUNT, @value, :name, payload #> '{a,b}', data #- '{c}' from #temp";

    expect(tokenizeSql(query).error).toBeUndefined();
    expect(minifySql(query).text).toContain('@@ROWCOUNT');
    expect(minifySql(query).text).toContain('#>');
    expect(minifySql(query).text).toContain('#-');
    expect(minifySql(query).text).toContain('#temp');
  });

  it('reports unbalanced parentheses without transforming input', () => {
    expect(formatSql('select (1').error).toBe('Unclosed parenthesis.');
    expect(minifySql('select 1)').error).toBe('Unexpected closing parenthesis.');
  });
});
