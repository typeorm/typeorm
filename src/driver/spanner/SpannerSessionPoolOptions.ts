/**
 * Spanner specific SessionPool options
 * more: https://github.com/ko3a4ok/nodejs-spanner/blob/aa8e8becf74d41d0de68253c17ebab188b5c7620/src/session-pool.ts#L149
 */
export interface SpannerSessionPoolOptions {
    acquireTimeout?: number;
    concurrency?: number;
    fail?: boolean;
    idlesAfter?: number;
    keepAlive?: number;
    labels?: { [label: string]: string };
    max?: number;
    maxIdle?: number;
    min?: number;
    /**
     * @deprecated. Starting from v6.5.0 the same session can be reused for
     * different types of transactions.
     */
    writes?: number;
    incStep?: number;
    databaseRole?: string | null;
}

/* Defaults:
    const DEFAULTS: SessionPoolOptions = {
    acquireTimeout: Infinity,
    concurrency: Infinity,
    fail: false,
    idlesAfter: 10,
    keepAlive: 30,
    labels: {},
    max: 100,
    maxIdle: 1,
    min: 25,
    incStep: 25,
    databaseRole: null,
    };
*/
