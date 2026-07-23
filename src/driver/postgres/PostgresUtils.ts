import { TypeORMError } from "../../error/TypeORMError"

/**
 * Utility functions shared across the Postgres driver family (PostgreSQL,
 * CockroachDB and Aurora Postgres).
 */
export class PostgresUtils {
    /**
     * Builds a "connect" handler that applies session variables to every new
     * pooled connection via `set_config(<key>, <value>, false)`. Returns
     * `undefined` when no session variables are configured. The caller is
     * responsible for registering the returned handler on its pool.
     *
     * `set_config()` is used rather than `SET <key> TO <value>` because PostgreSQL
     * does not accept bind parameters in the `SET` utility statement; `set_config`
     * is a regular parameterized function call supported by both PostgreSQL and
     * CockroachDB. The variable name and value are bound, so nothing is
     * interpolated into the SQL text.
     *
     * Variable names are validated up front: any key that is not a valid session
     * parameter identifier throws a `TypeORMError`, so a misconfiguration fails
     * loudly during connection setup rather than being silently dropped.
     *
     * Callers should apply the returned handler to the first connection during
     * pool setup — so an invalid value or unknown parameter fails initialization
     * instead of leaving pooled connections silently unconfigured — and register
     * it as the pool's `connect` listener for every subsequently created
     * connection.
     *
     * @param sessionVariables Session variables to apply, keyed by variable name.
     * @returns A pool "connect" handler, or `undefined` when nothing is configured.
     */
    static buildSessionVariablesHandler(
        sessionVariables?: Record<string, any>,
    ): ((connection: any) => Promise<void>) | undefined {
        if (!sessionVariables) return undefined

        // Session variable names are plain identifiers, optionally namespaced
        // with a dot for custom parameters (e.g. "my_app.setting").
        const validSessionVariableKey =
            /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/
        for (const key of Object.keys(sessionVariables)) {
            if (!validSessionVariableKey.test(key))
                throw new TypeORMError(
                    `Invalid session variable name "${key}". Session variable names must be valid identifiers.`,
                )
            if (sessionVariables[key] == null)
                throw new TypeORMError(
                    `Invalid value for session variable "${key}": value must not be null or undefined.`,
                )
        }

        return async (connection: any) => {
            // `.map` runs synchronously, so every query is issued (and thus queued
            // on the connection) before the pool can hand it out; awaiting between
            // queries would let the client be acquired with only the first
            // parameter guaranteed to be applied.
            await Promise.all(
                Object.keys(sessionVariables).map((key) =>
                    connection.query("SELECT set_config($1, $2, false)", [
                        key,
                        String(sessionVariables[key]),
                    ]),
                ),
            )
        }
    }
}
