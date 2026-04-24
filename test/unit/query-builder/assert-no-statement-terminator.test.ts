import { expect } from "chai"
import { QueryBuilder } from "../../../src/query-builder/QueryBuilder"

// Regression tests for the quote-aware `;` scanner in `select()` /
// `addSelect()`. Context: #12209 (original blunt `;` reject), #12396
// (revert that restored legitimate `STRING_AGG(col, ';' …)`), #12408
// (sibling PR that kept unconditional `;` reject on group/sort keys),
// and this PR which reinstates a string-literal-aware reject on
// select/addSelect without breaking the STRING_AGG case.

// The scanner is a pure function of its input, so bypass the constructor
// (which wants a DataSource) by creating a prototype-only instance and
// routing calls through a cast. We only ever invoke
// `assertNoStatementTerminator`, which touches no `this` state.
interface Scanner {
    assertNoStatementTerminator(value: string, context: string): void
}
const qb = Object.create(QueryBuilder.prototype) as Scanner

describe("QueryBuilder > assertNoStatementTerminator", () => {
    const run =
        (value: string): (() => void) =>
        () =>
            qb.assertNoStatementTerminator(value, "select")

    const accepts = (value: string) => () => expect(run(value)).to.not.throw()

    const rejects = (value: string) => () =>
        expect(run(value)).to.throw(/Semicolons are not allowed/)

    describe("plain semicolons", () => {
        it("accepts empty input", accepts(""))
        it("accepts a plain column reference", accepts("post.id"))
        it("accepts a function call", accepts("COUNT(post.id)"))

        it("rejects a bare terminator", rejects(";"))
        it("rejects statement stacking", rejects("post.id; DROP TABLE post"))
        it(
            "rejects a comment-prefixed injection",
            rejects("post.id; DELETE FROM post; --"),
        )
    })

    describe("single-quoted string", () => {
        it(
            "accepts a quoted semicolon",
            accepts("STRING_AGG(col, ';' ORDER BY col)"),
        )
        it(
            "accepts SQL-standard doubled-quote escape",
            accepts("'a;b' = 'c''d;e'"),
        )
        it(
            "accepts consecutive quoted regions",
            accepts("CONCAT('a;', 'b;', 'c;')"),
        )

        it(
            "rejects a close-preceding-quote injection",
            rejects("'foo'; DROP TABLE users--"),
        )
        it(
            "rejects a semicolon after an unterminated-looking prefix",
            // `'a''b'` closes cleanly at position 5; the `;` at position 7
            // must still be flagged.
            rejects("'a''b' ; DROP"),
        )

        // Backslash-escape is intentionally NOT recognised — see the
        // JSDoc on assertNoStatementTerminator. On non-MySQL-default
        // drivers, `\'` is a literal backslash + closing quote, so
        // `'foo\'; DROP` opens and closes the string normally and the
        // semicolon must be caught.
        it(
            "rejects backslash-apostrophe as NOT an escape (cross-driver safety)",
            rejects("'foo\\'; DROP TABLE users--"),
        )
    })

    describe("double-quoted string / identifier", () => {
        it("accepts a quoted semicolon", accepts('SELECT "a;b" FROM t'))
        it("accepts doubled-quote escape", accepts('SELECT "a""b;c" FROM t'))

        it(
            "rejects a close-preceding-quote injection",
            rejects('"foo"; DROP TABLE users--'),
        )
    })

    describe("backtick-quoted identifier (MySQL)", () => {
        it("accepts a quoted semicolon", accepts("`col;name`"))
        it("accepts doubled-backtick escape", accepts("`col``name;with;semi`"))

        it(
            "rejects a close-preceding-backtick injection",
            rejects("`foo`; DROP TABLE users--"),
        )

        // Without the doubled-backtick escape, a naive scanner would treat
        // the `` `` `` sequence inside this input as close-then-open — two
        // separate regions — and miss-interpret the whole expression. With
        // the fix, the `` `` `` pair is recognised as one escaped literal
        // backtick inside a single quoted identifier. MySQL parses the
        // whole input the same way (one identifier containing a literal
        // backtick, semicolon and all), so the `;` is intentionally
        // inside-quote and not flagged.
        it(
            "accepts a doubled-backtick identifier with internal semicolon",
            accepts("`foo``; DROP TABLE users--`"),
        )
    })

    describe("bracket-quoted identifier (MSSQL)", () => {
        it("accepts a quoted semicolon", accepts("[col;name]"))
        it("accepts doubled-bracket-close escape", accepts("[col]]name;with]"))

        it(
            "rejects a close-preceding-bracket injection",
            rejects("[foo]; DROP TABLE users--"),
        )

        // Mirror of the backtick case: `]]` is a single literal `]` inside
        // the identifier, so the whole expression is one MSSQL identifier
        // with a `;` embedded in the name — not an injection.
        it(
            "accepts a doubled-bracket identifier with internal semicolon",
            accepts("[foo]]; DROP TABLE users--]"),
        )
    })

    describe("dollar-quoted string (Postgres)", () => {
        it("accepts an untagged string", accepts("$$a;b$$"))
        it("accepts a tagged string", accepts("$tag$a;b$tag$"))
        it(
            "accepts a string whose tag reuses the dollar pattern",
            accepts("$_1$a;b$_1$"),
        )

        it(
            "rejects a semicolon after a closed dollar-quoted string",
            rejects("$$foo$$; DROP"),
        )

        it(
            "rejects a lone `$` followed by a stacking semicolon",
            // `$` alone (no close-`$`) is a plain char — the `;` that
            // follows must be flagged.
            rejects("$ ; DROP"),
        )

        it(
            "treats the first close-tag as terminal",
            // `$$abc$$def$$` — first `$$...$$` is the string, the trailing
            // `def$$` is a fresh plain-text + open-dollar-quote (unterminated).
            // The `;` inside the first quoted region is skipped; the `;` in
            // the (unterminated) trailing region is also skipped because we
            // never find its close-tag. Positive test: input containing only
            // safe characters after the first close should pass.
            accepts("$$a;b$$def"),
        )

        it(
            "rejects a semicolon between close-tag sequences",
            rejects("$$foo$$; $$bar$$"),
        )
    })

    describe("SQL comments", () => {
        // The scanner recognises `--` line comments and `/* … */` block
        // comments so that quote chars inside them do not put the outer
        // loop into "inside quote" mode. Without this, a quote char in a
        // block comment (`1/*'*/; DROP`) would swallow the trailing `;`.

        it(
            "rejects a semicolon bypass hidden behind a block-comment quote",
            rejects("1/*'*/; DROP TABLE post --'"),
        )
        it(
            "rejects a semicolon bypass hidden behind a line-comment quote",
            rejects("-- '\n1; DROP TABLE post --'"),
        )

        it(
            "accepts a line comment containing a quote",
            accepts("post.id -- it's fine\nAS id"),
        )
        it(
            "accepts a block comment containing a quote",
            accepts("post.id /* it's fine */ AS id"),
        )
        it(
            "accepts an unterminated line comment",
            accepts("post.id -- trailing"),
        )
        it(
            "accepts an unterminated block comment",
            accepts("post.id /* trailing"),
        )

        it("rejects a semicolon inside a line comment", rejects("-- ;\n"))
        it("rejects a semicolon inside a block comment", rejects("/* ; */"))
    })

    describe("unterminated quotes", () => {
        // Unterminated quotes leave the scanner "inside" until end-of-input.
        // This is safe because the runtime SQL parser will reject the
        // malformed query before execution; the scanner's job is only to
        // prevent statement stacking, not to validate SQL.
        it("accepts unterminated single-quote", accepts("'abc"))
        it("accepts unterminated double-quote", accepts('"abc'))
        it("accepts unterminated backtick", accepts("`abc"))
        it("accepts unterminated bracket", accepts("[abc"))
        it("accepts unterminated dollar-quote", accepts("$$abc"))
    })

    describe("loop termination invariant", () => {
        // assertNoStatementTerminator's outer loop relies on every
        // quoted-region helper advancing `i` by at least 1. Pin the
        // invariant for the plain-char fallthrough: a long run of plain
        // chars must not hang.
        it("handles a long plain-text input", () => {
            const input = "a".repeat(10_000)
            expect(() =>
                qb.assertNoStatementTerminator(input, "select"),
            ).to.not.throw()
        })

        it("handles a long quoted input", () => {
            const input = `'${"a".repeat(10_000)}'`
            expect(() =>
                qb.assertNoStatementTerminator(input, "select"),
            ).to.not.throw()
        })
    })
})
