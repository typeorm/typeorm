/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    semi: false,

    plugins: ["prettier-plugin-packagejson", "prettier-plugin-toml"],
}

module.exports = config
