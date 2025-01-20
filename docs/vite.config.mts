/**
 * This is the base config for vite.
 * When building, the adapter config is used which loads this file and extends it.
 */
import { qwikVite } from "@qwik.dev/core/optimizer";
import { qwikRouter } from "@qwik.dev/router/vite";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json";
import { recmaProvideComponents } from "./recma-provide-components";

type PkgDep = Record<string, string>;
const { dependencies = {}, devDependencies = {} } = pkg as any as {
  dependencies: PkgDep;
  devDependencies: PkgDep;
  [key: string]: unknown;
};
errorOnDuplicatesPkgDeps(devDependencies, dependencies);

/**
 * Note that Vite normally starts from `index.html` but the qwikRouter plugin makes start at `src/entry.ssr.tsx` instead.
 */
export default defineConfig(async () => {
  const { default: rehypePrettyCode } = await import("rehype-pretty-code");
  const { visit } = await import("unist-util-visit");

  return {
    plugins: [qwikRouter({
      mdxPlugins: {
        rehypeSyntaxHighlight: false,
        remarkGfm: true,
        rehypeAutolinkHeadings: true,
      },
      mdx: {
        providerImportSource: "~/state/MDXProvider",
        recmaPlugins: [recmaProvideComponents],
        rehypePlugins: [
          () => (tree) => {
            visit(tree, (node) => {
              if (node?.type === "element" && node?.tagName === "pre") {
                const [codeEl] = node.children;
                if (codeEl.tagName !== "code") {
                  return;
                }

                node.__rawString__ = codeEl.children?.[0].value;
              }
            });
          },
          [
            rehypePrettyCode,
            {
              onVisitLine(node: any) {
                // Prevent lines from collapsing in `display: grid` mode, and allow empty
                // lines to be copy/pasted
                if (node.children.length === 0) {
                  node.children = [{ type: "text", value: " " }];
                }
              },
              onVisitHighlightedLine(node: any) {
                // Each line node by default has `class="line"`.
                if (node.properties.className) {
                  node.properties.className.push("line--highlighted");
                }
              },
              onVisitHighlightedWord(node: any) {
                if (node.properties.className) {
                  node.properties.className = ["word--highlighted"];
                }
              },
            },
          ],
          () => (tree) => {
            visit(tree, (node) => {
              if (node?.type === "element" && node?.tagName === "div") {
                if (
                  !("data-rehype-pretty-code-fragment" in node.properties)
                ) {
                  return;
                }

                const preElement = node.children.at(-1);
                if (preElement.tagName !== "pre") {
                  return;
                }

                preElement.properties["__rawString__"] = node.__rawString__;
              }
            });
          },
        ],
      },
    }), qwikVite(), tsconfigPaths()],
    // This tells Vite which dependencies to pre-build in dev mode.
    optimizeDeps: {
      // Put problematic deps that break bundling here, mostly those with binaries.
      // For example ['better-sqlite3'] if you use that in server functions.
      exclude: [],
    },

    /**
     * This is an advanced setting. It improves the bundling of your server code. To use it, make sure you understand when your consumed packages are dependencies or dev dependencies. (otherwise things will break in production)
     */
    // ssr:
    //   command === "build" && mode === "production"
    //     ? {
    //         // All dev dependencies should be bundled in the server build
    //         noExternal: Object.keys(devDependencies),
    //         // Anything marked as a dependency will not be bundled
    //         // These should only be production binary deps (including deps of deps), CLI deps, and their module graph
    //         // If a dep-of-dep needs to be external, add it here
    //         // For example, if something uses `bcrypt` but you don't have it as a dep, you can write
    //         // external: [...Object.keys(dependencies), 'bcrypt']
    //         external: Object.keys(dependencies),
    //       }
    //     : undefined,

    server: {
      headers: {
        // Don't cache the server response in dev mode
        "Cache-Control": "public, max-age=0",
      },
    },
    preview: {
      headers: {
        // Do cache the server response in preview (non-adapter production build)
        "Cache-Control": "public, max-age=600",
      },
    },
  };
});

// *** utils ***

/**
 * Function to identify duplicate dependencies and throw an error
 * @param {Object} devDependencies - List of development dependencies
 * @param {Object} dependencies - List of production dependencies
 */
function errorOnDuplicatesPkgDeps(
  devDependencies: PkgDep,
  dependencies: PkgDep,
) {
  let msg = "";
  // Create an array 'duplicateDeps' by filtering devDependencies.
  // If a dependency also exists in dependencies, it is considered a duplicate.
  const duplicateDeps = Object.keys(devDependencies).filter(
    (dep) => dependencies[dep],
  );

  // include any known qwik packages
  const qwikPkg = Object.keys(dependencies).filter((value) =>
    /qwik/i.test(value),
  );

  // any errors for missing "qwik-router-config"
  // [PLUGIN_ERROR]: Invalid module "@qwik-router-config" is not a valid package
  msg = `Move qwik packages ${qwikPkg.join(", ")} to devDependencies`;

  if (qwikPkg.length > 0) {
    throw new Error(msg);
  }

  // Format the error message with the duplicates list.
  // The `join` function is used to represent the elements of the 'duplicateDeps' array as a comma-separated string.
  msg = `
    Warning: The dependency "${duplicateDeps.join(", ")}" is listed in both "devDependencies" and "dependencies".
    Please move the duplicated dependencies to "devDependencies" only and remove it from "dependencies"
  `;

  // Throw an error with the constructed message.
  if (duplicateDeps.length > 0) {
    throw new Error(msg);
  }
}
