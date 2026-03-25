import path from "node:path"
import { versions } from "./index"
import { fail } from "../lib/error"
import { listTransforms } from "../cli/list-transforms"

const getExt = () => (__filename.endsWith(".ts") ? ".ts" : ".js")

export const resolveTransforms = (
    version: string,
    transform?: string,
): string[] => {
    if (!versions[version]) {
        fail(`no transforms found for version "${version}"`)
    }

    const dir = path.join(__dirname, version)
    const ext = getExt()

    if (transform) {
        const found = versions[version].transforms.some(
            (t) => t.name === transform,
        )
        if (!found) {
            fail(
                `transform "${transform}" not found for version "${version}"`,
                () => listTransforms(version),
            )
        }
        return [`${dir}/${transform}${ext}`]
    }

    return [`${dir}/index${ext}`]
}
