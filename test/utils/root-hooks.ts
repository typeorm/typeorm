import { isRequired, setRequired } from "./test-utils"

const wrapSuiteBeforeAllHooks = (suite: any): void => {
    for (const hook of suite._beforeAll ?? []) {
        if (hook.__requiredFlag) continue

        const originalHook = hook.fn
        hook.fn = async function (this: Mocha.Context): Promise<void> {
            await originalHook.call(this)
            if (!isRequired()) {
                setRequired(true)
                this.skip()
            }
        }
        hook.__requiredFlag = true
    }

    for (const childSuite of suite.suites ?? []) {
        wrapSuiteBeforeAllHooks(childSuite)
    }
}

export const mochaHooks = {
    beforeAll(this: Mocha.Context): void {
        const rootSuite = (this as any)?.test?.parent
        if (!rootSuite) return

        wrapSuiteBeforeAllHooks(rootSuite)
    },
}
