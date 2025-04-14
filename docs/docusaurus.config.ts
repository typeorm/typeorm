import { themes as prismThemes } from "prism-react-renderer"
import type { Config } from "@docusaurus/types"
import type * as Preset from "@docusaurus/preset-classic"
import { redirects } from "./redirects"

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: "TypeORM",
    tagline: "Code with Confidence. Query with Power.",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://typeorm.io",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "typeorm", // Usually your GitHub org/user name.
    projectName: "typeorm", // Usually your repo name.

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        "https://github.com/typeorm/typeorm/tree/master/docs/",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],
    themes: ["docusaurus-theme-search-typesense"],
    themeConfig: {
        // Replace with your project's social card
        image: "img/typeorm-social-card.jpg",
        colorMode: {
            defaultMode: "light",
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        announcementBar: {
            id: "future_of_typeorm",
            content:
                '📣 <b>Announcement: The Future of TypeORM</b> &mdash; We\'re excited to share our vision for a revitalized TypeORM! <a rel="noopener noreferrer" href="/docs/future-of-typeorm">Read the full announcement</a>',
            backgroundColor: "#180028",
            textColor: "#FFFFFF",
            isCloseable: true,
        },
        navbar: {
            title: "TypeORM",
            logo: {
                alt: "TypeORM Logo",
                src: "img/typeorm-icon-colored.png",
                srcDark: "img/typeorm-icon-white.png",
                width: 46,
                height: 64,
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "tutorialSidebar",
                    position: "left",
                    label: "Docs",
                },
                {
                    href: "https://github.com/typeorm/typeorm",
                    label: "GitHub",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Getting started",
                            to: "/docs/getting-started",
                        },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discord",
                            href: "https://discord.gg/cC9hkmUgNa",
                        },
                        {
                            label: "Stack Overflow",
                            href: "https://stackoverflow.com/questions/tagged/typeorm",
                        },
                    ],
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "GitHub",
                            href: "https://github.com/typeorm/typeorm",
                        },
                        {
                            label: "LinkedIn",
                            href: "https://www.linkedin.com/company/typeorm",
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} TypeORM. Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            additionalLanguages: ["typescript", "javascript", "bash", "json"],
        },
        typesense: {
            // Replace this with the name of your index/collection.
            // It should match the "index_name" entry in the scraper's "config.json" file.
            typesenseCollectionName: "typeorm-docs",

            typesenseServerConfig: {
                nodes: [
                    {
                        host: "a46qefxi7yzt3hlbp-1.a1.typesense.net",
                        port: 443,
                        protocol: "https",
                    },
                    {
                        host: "a46qefxi7yzt3hlbp-2.a1.typesense.net",
                        port: 443,
                        protocol: "https",
                    },
                    {
                        host: "a46qefxi7yzt3hlbp-3.a1.typesense.net",
                        port: 443,
                        protocol: "https",
                    },
                ],
                apiKey: "92eYxk4qbUKgDwS4dHFn1eMWd9qUYfd7", // SEARCH_ONLY_KEY
            },

            // Optional: Typesense search parameters: https://typesense.org/docs/0.24.0/api/search.html#search-parameters
            typesenseSearchParameters: {},

            // Optional
            contextualSearch: true,
        },
    } satisfies Preset.ThemeConfig,
    plugins: [
        [
            "@docusaurus/plugin-client-redirects",
            {
                redirects,
            },
        ],
    ],
}

export default config
