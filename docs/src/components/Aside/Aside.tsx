import { component$ } from "@qwik.dev/core";
import { useContent } from "@qwik.dev/router";

export const Aside = component$(() => {
  const { menu } = useContent();

  return (
    <div
      class={`fixed top-20 mt-8 flex h-full flex-col overflow-hidden overflow-y-auto pl-6 pr-2 text-black dark:text-white`}
    >
      {(menu?.items || []).map(({ text, items }, idx) => {
        const [title, href] = text.split("|");
        return (
          <ul key={idx} class="mb-6">
            <li>
              {href ? (
                <a
                  class="mb-2 block rounded bg-blue-700 dark:bg-blue-600 px-4 py-1 text-base font-bold uppercase text-white no-underline"
                  href={href}
                >
                  {title}
                </a>
              ) : (
                <span class="mb-2 block rounded bg-blue-700 px-4 py-1 text-base font-bold uppercase text-white no-underline">
                  {text}
                </span>
              )}
              {(items || []).map(({ text, href }, idx) => (
                <ul key={idx}>
                  <li class="py-1 text-black dark:text-white">
                    <a href={href}>
                      <span class="text-md pl-2">
                        <span>{text}</span>
                      </span>
                    </a>
                  </li>
                </ul>
              ))}
            </li>
          </ul>
        );
      })}
    </div>
  );
});
