import { useDocumentHead, useLocation } from "@qwik.dev/router";
import { component$ } from "@qwik.dev/core";

/**
 * The RouterHead component is placed inside of the document `<head>` element.
 */
export const RouterHead = component$(() => {
  const head = useDocumentHead();
  const loc = useLocation();

  const imageSrc = "https://raw.githubusercontent.com/typeorm/typeorm/master/resources/logo_big.png";

  return (
    <>
      <title>{head.title}</title>
      <meta name="description" content="TypeORM Description" />
            
      <link rel="canonical" href={loc.url.href} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

      <link rel="canonical" href={loc.url.href} />

      <meta property="og:title" content={head.frontmatter.title} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={loc.url.href} />
      <meta property="og:locale" content={"en_US"} />
      <meta property="og:image" content={imageSrc} />
      <meta
        name="description"
        property="og:description"
        content={head.frontmatter.description || head.frontmatter.title}
      />
      <meta property="og:site_name" content={head.frontmatter.title} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@builderio" />
      <meta name="twitter:title" content={head.frontmatter.title} />
      <meta
        name="twitter:description"
        content={head.frontmatter.description || head.frontmatter.title}
      />
      <meta name="twitter:image" content={imageSrc} />
      <meta name="twitter:image:alt" content="TypeORM Logo" />

      {head.meta.map((m) => (
        <meta key={m.key} {...m} />
      ))}

      {head.links.map((l) => (
        <link key={l.key} {...l} />
      ))}

      {head.styles.map((s) => (
        <style key={s.key} {...s.props} dangerouslySetInnerHTML={s.style} />
      ))}
      <script
        dangerouslySetInnerHTML={`
          (function() {
            function setTheme(theme) {
              document.documentElement.className = theme;
              localStorage.setItem('theme', theme);
            }
            var theme = localStorage.getItem('theme');
            theme = theme === 'light' ? 'light' : 'dark';
            if (theme) {
              setTheme(theme);
            } else {
              setTheme('light');
            }
          })();
        `}
      />
    </>
  );
});
