import { ListTreeApiNode, ListTreeEntry, ServiceError } from "./types.js";


export const isServiceError = (data: unknown): data is ServiceError => {
    return typeof data === 'object' &&
        data !== null &&
        'statusCode' in data &&
        'errorCode' in data &&
        'message' in data;
}

export class ServiceErrorException extends Error {
    constructor(public readonly serviceError: ServiceError) {
        super(JSON.stringify(serviceError));
    }
}

/**
 * Wraps a search query in double quotes so Sourcebot reads it as one phrase (like grep).
 *
 * The Sourcebot query parser removes the surrounding quotes and passes the text between
 * them to the search engine without unescaping it. So backslash escapes such as `\w` must
 * stay as they are: doubling them turns the regex `foo\w+` into `foo\\w+`, which matches a
 * literal backslash. Only a bare double quote is escaped, because it would end the phrase,
 * and a trailing lone backslash is escaped so it cannot escape the closing quote.
 */
export const quoteSearchQuery = (query: string): string => {
    let escaped = '';
    for (let i = 0; i < query.length; i++) {
        const char = query[i];
        if (char === '\\') {
            escaped += i + 1 < query.length ? char + query[++i] : '\\\\';
        } else if (char === '"') {
            escaped += '\\"';
        } else {
            escaped += char;
        }
    }
    return `"${escaped}"`;
}

export const normalizeTreePath = (path: string): string => {
    const withoutLeading = path.replace(/^\/+/, '');
    return withoutLeading.replace(/\/+$/, '');
}

export const joinTreePath = (parentPath: string, name: string): string => {
    if (!parentPath) {
        return name;
    }

    return `${parentPath}/${name}`;
}

export const buildTreeNodeIndex = (root: ListTreeApiNode): Map<string, ListTreeApiNode> => {
    const nodeIndex = new Map<string, ListTreeApiNode>();

    const visit = (node: ListTreeApiNode, currentPath: string) => {
        nodeIndex.set(currentPath, node);

        for (const child of node.children) {
            visit(child, joinTreePath(currentPath, child.name));
        }
    };

    visit(root, '');

    return nodeIndex;
}

export const sortTreeEntries = (entries: ListTreeEntry[]): ListTreeEntry[] => {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

    return [...entries].sort((a, b) => {
        const parentCompare = collator.compare(a.parentPath, b.parentPath);
        if (parentCompare !== 0) {
            return parentCompare;
        }

        if (a.type !== b.type) {
            // sort directories above files
            return a.type === 'tree' ? -1 : 1;
        }

        const nameCompare = collator.compare(a.name, b.name);
        if (nameCompare !== 0) {
            return nameCompare;
        }

        return collator.compare(a.path, b.path);
    });
}
