import { versions } from "./index"
import { fail } from "../cli/error"
import { listTransforms } from "../cli/list-transforms"
import { getTransformPath, getCompositeTransformPath } from "./scan"

export const resolveTransforms = (
    version: string,
    transform?: string,
): string[] => {
    if (!versions[version]) {
        fail(`no transforms found for version "${version}"`)
    }

    if (transform) {
        const transformPath = getTransformPath(version, transform)

        if (!transformPath) {
            fail(
                `transform "${transform}" not found for version "${version}"`,
                () => listTransforms(version),
            )
        }

        return [transformPath!]
    }

    return [getCompositeTransformPath(version)]
}
