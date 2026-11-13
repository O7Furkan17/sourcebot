import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { listCommitsResponseSchema } from './schemas.js';

const commit = {
    hash: 'f3b1c2d4e5a6978877665544332211aabbccddee',
    date: '2026-01-15T10:20:30+00:00',
    message: 'fix: handle empty input',
    refs: 'HEAD -> main, origin/main',
    body: '',
};

describe('listCommitsResponseSchema', () => {
    test('parses the camelCase author fields returned by GET /api/commits', () => {
        const parsed = listCommitsResponseSchema.safeParse([
            { ...commit, authorName: 'Jane Doe', authorEmail: 'jane@example.com' },
        ]);

        assert.ok(parsed.success, parsed.error?.message);
        assert.deepEqual(parsed.data, [
            { ...commit, authorName: 'Jane Doe', authorEmail: 'jane@example.com' },
        ]);
    });

    test('parses the snake_case author fields returned by older servers', () => {
        const parsed = listCommitsResponseSchema.safeParse([
            { ...commit, author_name: 'Jane Doe', author_email: 'jane@example.com' },
        ]);

        assert.ok(parsed.success, parsed.error?.message);
        assert.deepEqual(parsed.data, [
            { ...commit, authorName: 'Jane Doe', authorEmail: 'jane@example.com' },
        ]);
    });

    test('rejects a commit without author fields', () => {
        const parsed = listCommitsResponseSchema.safeParse([commit]);

        assert.equal(parsed.success, false);
    });
});
