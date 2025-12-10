/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    arrowParens: "always",
    semi: false,
    trailingComma: "all",

    plugins: ["prettier-plugin-packagejson", "prettier-plugin-toml"],
}

module.exports = config
