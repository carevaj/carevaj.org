import lume from "lume/mod.ts";
import relativeUrls from "lume/plugins/relative_urls.ts";
import multilanguage from "lume/plugins/multilanguage.ts";
import blog from "blog/mod.ts";

const site = lume({
  location: new URL("https://carevaj.org"),
});


site.copy("img");

site.use(relativeUrls());
site.use(multilanguage({
  languages: ["en", "es"], // Available languages
  defaultLanguage: "es", // The default language
}));
site.use(blog());


export default site;
