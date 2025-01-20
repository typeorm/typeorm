import {
  Slot,
  component$,
  createContextId,
  useContextProvider,
  useStore,
  useVisibleTask$,
} from "@qwik.dev/core";
import { useLocation, type RequestHandler, useContent } from "@qwik.dev/router";
import { Aside } from "~/components/Aside/Aside";
import { Footer } from "~/components/Footer/Footer";
import { Header } from "~/components/Header/Header";
import { components } from "~/components/MdxComponents/MdxComponents";
import { TOC } from "~/components/Toc/Toc";
import { MDXProvider } from "~/state/MDXProvider";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.builder.io/docs/caching/
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

type Store = {
  theme: "light" | "dark";
};

export const StoreContext = createContextId<Store>("Store");

export default component$(() => {
  const store = useStore<Store>({ theme: "light" });
  const { headings } = useContent();
  useContextProvider(StoreContext, store);
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const theme = localStorage.getItem("theme") as Store["theme"];
    store.theme = theme;
  });



  return (
    <MDXProvider components={components}>
      <div class="h-screen bg-[#F8F8FF] dark:bg-[#0D0F12]">
        <Header />
        <main class="flex min-h-[100%] bg-[#F8F8FF] dark:bg-[#0D0F12] lg:grid lg:grid-cols-content xl:grid-cols-[260px_1fr_240px]">
          <aside
            class={`hidden border-r-[2px] border-zinc-100 dark:border-zinc-900 lg:block`}
          >
            <Aside />
          </aside>
          <article class="docs w-full pb-10 pt-28">
            <Slot />
            <Footer />
          </article>
          <TOC headings={headings ?? []} />
        </main>
      </div>
    </MDXProvider>
  );
});
