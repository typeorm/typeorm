import { versions } from "../transforms"

export const listTransforms = (version: string): void => {
    const info = versions[version]

    if (!info) {
        throw new Error(`No transforms found for version "${version}"`)
    }

    console.log(`Available transforms for ${version}:`)
    info.transforms.forEach((t) => console.log(`  - ${t.name}`))
}
