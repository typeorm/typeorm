/*
 * WHAT IS THIS FILE?
 *
 * It's the bundle entry point for `npm run preview`.
 * That is, serving your app built in production mode.
 *
 * Feel free to modify this file, but don't remove it!
 *
 * Learn more about Vite's preview command:
 * - https://vitejs.dev/config/preview-options.html#preview-options
 *
 */
import qwikRouterConfig from "@qwik-router-config";
import { createQwikRouter } from "@qwik.dev/router/middleware/node";
// make sure qwikRouterConfig is imported before entry
import render from "./entry.ssr";

/**
 * The default export is the QwikRouter adapter used by Vite preview.
 */
export default createQwikRouter({ render, qwikRouterConfig });
