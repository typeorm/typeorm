import { cloudflarePagesAdapter } from "@qwik.dev/router/adapters/cloudflare-pages/vite";
import { extendConfig } from "@qwik.dev/router/vite";
import baseConfig from "../../vite.config.mts";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.cloudflare-pages.tsx", "@qwik-router-config"],
      },
    },
    plugins: [
      cloudflarePagesAdapter({
        ssg: {
          include: ["/*"],
          origin: "https://typeorm.io/",
        },
      }),
    ],
  };
});
