import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { quoteSearchQuery } from './utils.js';

// The quoted string token of the Sourcebot query grammar (packages/queryLanguage/src/query.grammar).
const QUOTED_STRING = /^"(?:[^"\\\n]|\\[\s\S])*"$/;

// What the Sourcebot query parser passes to the search engine for a quoted term:
// the surrounding quotes are removed and nothing is unescaped.
const serverTerm = (quoted: string) => quoted.replace(/^"|"$/g, '');

describe('quoteSearchQuery', () => {
    test('wraps the query in double quotes', () => {
        assert.equal(quoteSearchQuery('foo bar'), '"foo bar"');
    });

    test('keeps regex escapes so the server receives the regex as written', () => {
        const quoted = quoteSearchQuery('SOURCEBOT_\\w+_URL');

        assert.equal(quoted, '"SOURCEBOT_\\w+_URL"');
        assert.equal(serverTerm(quoted), 'SOURCEBOT_\\w+_URL');
    });

    test('keeps a backslash in a literal search as it is', () => {
        assert.equal(serverTerm(quoteSearchQuery("printf '\\n%s")), "printf '\\n%s");
        assert.equal(serverTerm(quoteSearchQuery('C:\\\\Users')), 'C:\\\\Users');
    });

    test('escapes a bare double quote so it does not end the quoted term', () => {
        assert.equal(quoteSearchQuery('say "hi"'), '"say \\"hi\\""');
    });

    test('does not escape a double quote that is already escaped', () => {
        assert.equal(quoteSearchQuery('say \\"hi\\"'), '"say \\"hi\\""');
    });

    test('escapes a trailing lone backslash so it cannot escape the closing quote', () => {
        assert.equal(quoteSearchQuery('end\\'), '"end\\\\"');
    });

    test('always produces a single quoted string token', () => {
        const queries = ['', 'a', '"', '\\', '\\\\', '\\"', '"\\', 'a"b\\c', 'x\\\\"y', '(foo|bar)\\s*\\(', "it's \"ok\"\\"];
        for (const query of queries) {
            assert.match(quoteSearchQuery(query), QUOTED_STRING, JSON.stringify(query));
        }
    });
});
