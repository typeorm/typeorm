# Vite

Using TypeORM in a [Vite](https://vite.dev) project is pretty straight forward. However, when you use [migrations](../migrations/01-why.md), you will run into "...migration name is wrong. Migration class name should have a
JavaScript timestamp appended." errors when running the production build.
On production builds, files are [optimized by default](https://vite.dev/config/build-options#build-minify) which includes mangling your code in order to minimize file sizes.

You have 3 options to mitigate this. The 3 options are shown below as diff to this basic `vite.config.ts`

```typescript
import legacy from "@vitejs/plugin-legacy"
import vue from "@vitejs/plugin-vue"
import path from "path"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        sourcemap: true,
    },
    plugins: [vue(), legacy()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
```

### Option 1: Disable minify

This is the most crude option and will result in significantly larger files. Add `build.minify = false` to your config.

```diff
--- basic vite.config.ts
+++ disable minify vite.config.ts
@@ -7,6 +7,7 @@
 export default defineConfig({
   build: {
     sourcemap: true,
+    minify: false,
   },
   plugins: [vue(), legacy()],
   resolve: {
```

### Option 2: Disable esbuild minify identifiers

Vite uses esbuild as the default minifier. You can disable mangling of identifiers by adding `esbuild.minifyIdentifiers = false` to your config.
This will result in smaller file sizes, but depending on your code base you will get diminishing returns as all identifiers will be kept at full length.

```diff
--- basic vite.config.ts
+++ disable esbuild minify identifiers vite.config.ts
@@ -8,6 +8,7 @@
   build: {
     sourcemap: true,
   },
+  esbuild: { minifyIdentifiers: false },
   plugins: [vue(), legacy()],
   resolve: {
```

### Option 3: Use terser as minifier while keeping only the migration class names

Vite supports using terser as minifier. Terser is slower then esbuild, but offers more fine grained control over what to minify.
Add `minify: 'terser'` with `terserOptions.mangle.keep_classnames: /^Migrations\d+$/` and `terserOptions.compress.keep_classnames: /^Migrations\d+$/` to your config.
These options will make sure classnames that start with "Migrations" and end with numbers are not renamed during minification.

Make sure terser is available as dev dependency in your project: `npm add -D terser`.

```diff
--- basic vite.config.ts
+++ terser keep migration class names vite.config.ts
@@ -7,6 +7,11 @@
 export default defineConfig({
   build: {
     sourcemap: true,
+    minify: 'terser',
+    terserOptions: {
+      mangle: { keep_classnames: /^Migrations\d+$/ },
+      compress: { keep_classnames: /^Migrations\d+$/ },
+    },
   },
   plugins: [vue(), legacy()],
   resolve: {
```
