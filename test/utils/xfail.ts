import { assert, AssertionError } from "chai"
import { it } from "vitest"
import type { TestContext } from "vitest"

type DoneCallback = (err?: unknown) => void
type AsyncFunc = (this: TestContext) => void | Promise<void>
type Func = (this: TestContext, done: DoneCallback) => void
type Test = ReturnType<typeof it>
type TestOverload = {
    (title: string, fn: Func | AsyncFunc): Test
    (fn: Func | AsyncFunc): Test
}

type TestFunction = {
    (title: string, fn: Func | AsyncFunc): Test
    (fn: Func | AsyncFunc): Test
    only: TestOverload
    skip: TestOverload
    retries: (n: number) => void
}

type XFailFunction = {
    it: TestFunction
    unless: (condition: boolean | (() => boolean)) => { it: TestFunction }
}

const wrap = (
    fn: Func | AsyncFunc,
    condition: boolean | (() => boolean),
): AsyncFunc => {
    return function Wrapped(this: TestContext): Promise<void> {
        if (typeof condition === "function") {
            if (!condition()) {
                return Promise.resolve()
            }
        } else if (condition === false) {
            return Promise.resolve()
        }

        return new Promise<void>((ok, fail) => {
            if (fn.length > 1) {
                ;(fn as Func).call(this, (err: unknown) =>
                    err ? fail(err) : ok(),
                )
            } else {
                ok((fn as AsyncFunc).call(this))
            }
        }).then(
            () => assert.fail("Expected this test to fail"),
            (e) => {
                if (!(e instanceof AssertionError)) {
                    throw e
                }
            },
        )
    }
}

function unless(condition: boolean | (() => boolean)): { it: TestFunction } {
    const xfailIt: TestFunction = (
        fnOrTitle: Func | AsyncFunc | string,
        fn?: Func | AsyncFunc,
    ): Test => {
        if (typeof fnOrTitle === "string") {
            return it(fnOrTitle, wrap(fn!, condition))
        } else {
            return it(wrap(fnOrTitle, condition))
        }
    }

    xfailIt.only = (
        fnOrTitle: Func | AsyncFunc | string,
        fn?: Func | AsyncFunc,
    ): Test => {
        if (typeof fnOrTitle === "string") {
            return it.skip(fnOrTitle, wrap(fn!, condition))
        } else {
            return it.skip(wrap(fnOrTitle, condition))
        }
    }

    xfailIt.skip = (
        fnOrTitle: Func | AsyncFunc | string,
        fn?: Func | AsyncFunc,
    ): Test => {
        if (typeof fnOrTitle === "string") {
            return it.skip(fnOrTitle, wrap(fn!, condition))
        } else {
            return it.skip(wrap(fnOrTitle, condition))
        }
    }

    xfailIt.retries = (n: number): void => {
        if ("retries" in it && typeof it.retries === "function") {
            it.retries(n)
        }
    }

    return { it: xfailIt }
}

/**
 * XFail is used to mark tests that are expected to fail.
 */
export const xfail: XFailFunction = {
    ...unless(true),
    unless,
}
