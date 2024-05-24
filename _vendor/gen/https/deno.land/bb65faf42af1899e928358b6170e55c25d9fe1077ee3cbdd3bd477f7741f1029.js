import plugins from "./plugins.ts";
import "lume/types.ts";
export default function(options = {}) {
  return (site)=>{
    // Configure the site
    site.use(plugins(options));
    // Add remote files
    const files = [
      "_includes/css/fonts.css",
      "_includes/css/navbar.css",
      "_includes/css/page.css",
      "_includes/css/post-list.css",
      "_includes/css/post.css",
      "_includes/css/reset.css",
      "_includes/css/badge.css",
      "_includes/css/variables.css",
      "_includes/css/search.css",
      "_includes/css/comments.css",
      "_includes/layouts/archive_result.vto",
      "_includes/layouts/archive.vto",
      "_includes/layouts/base.vto",
      "_includes/layouts/page.vto",
      "_includes/layouts/post.vto",
      "_includes/templates/post-details.vto",
      "_includes/templates/post-list.vto",
      "posts/_data.yml",
      "_data.yml",
      "_data/i18n.yml",
      "404.md",
      "archive_result.page.js",
      "archive.page.js",
      "index.vto",
      "styles.css",
      "favicon.png",
      "js/main.js"
    ];
    for (const file of files){
      site.remoteFile(file, import.meta.resolve(`./src/${file}`));
    }
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZV90aGVtZV9zaW1wbGVfYmxvZ0B2MC4xNS4yL21vZC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGx1Z2lucywgeyBPcHRpb25zIH0gZnJvbSBcIi4vcGx1Z2lucy50c1wiO1xuXG5pbXBvcnQgXCJsdW1lL3R5cGVzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIHsgT3B0aW9ucyB9IGZyb20gXCIuL3BsdWdpbnMudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdGlvbnM6IFBhcnRpYWw8T3B0aW9ucz4gPSB7fSkge1xuICByZXR1cm4gKHNpdGU6IEx1bWUuU2l0ZSkgPT4ge1xuICAgIC8vIENvbmZpZ3VyZSB0aGUgc2l0ZVxuICAgIHNpdGUudXNlKHBsdWdpbnMob3B0aW9ucykpO1xuXG4gICAgLy8gQWRkIHJlbW90ZSBmaWxlc1xuICAgIGNvbnN0IGZpbGVzID0gW1xuICAgICAgXCJfaW5jbHVkZXMvY3NzL2ZvbnRzLmNzc1wiLFxuICAgICAgXCJfaW5jbHVkZXMvY3NzL25hdmJhci5jc3NcIixcbiAgICAgIFwiX2luY2x1ZGVzL2Nzcy9wYWdlLmNzc1wiLFxuICAgICAgXCJfaW5jbHVkZXMvY3NzL3Bvc3QtbGlzdC5jc3NcIixcbiAgICAgIFwiX2luY2x1ZGVzL2Nzcy9wb3N0LmNzc1wiLFxuICAgICAgXCJfaW5jbHVkZXMvY3NzL3Jlc2V0LmNzc1wiLFxuICAgICAgXCJfaW5jbHVkZXMvY3NzL2JhZGdlLmNzc1wiLFxuICAgICAgXCJfaW5jbHVkZXMvY3NzL3ZhcmlhYmxlcy5jc3NcIixcbiAgICAgIFwiX2luY2x1ZGVzL2Nzcy9zZWFyY2guY3NzXCIsXG4gICAgICBcIl9pbmNsdWRlcy9jc3MvY29tbWVudHMuY3NzXCIsXG4gICAgICBcIl9pbmNsdWRlcy9sYXlvdXRzL2FyY2hpdmVfcmVzdWx0LnZ0b1wiLFxuICAgICAgXCJfaW5jbHVkZXMvbGF5b3V0cy9hcmNoaXZlLnZ0b1wiLFxuICAgICAgXCJfaW5jbHVkZXMvbGF5b3V0cy9iYXNlLnZ0b1wiLFxuICAgICAgXCJfaW5jbHVkZXMvbGF5b3V0cy9wYWdlLnZ0b1wiLFxuICAgICAgXCJfaW5jbHVkZXMvbGF5b3V0cy9wb3N0LnZ0b1wiLFxuICAgICAgXCJfaW5jbHVkZXMvdGVtcGxhdGVzL3Bvc3QtZGV0YWlscy52dG9cIixcbiAgICAgIFwiX2luY2x1ZGVzL3RlbXBsYXRlcy9wb3N0LWxpc3QudnRvXCIsXG4gICAgICBcInBvc3RzL19kYXRhLnltbFwiLFxuICAgICAgXCJfZGF0YS55bWxcIixcbiAgICAgIFwiX2RhdGEvaTE4bi55bWxcIixcbiAgICAgIFwiNDA0Lm1kXCIsXG4gICAgICBcImFyY2hpdmVfcmVzdWx0LnBhZ2UuanNcIixcbiAgICAgIFwiYXJjaGl2ZS5wYWdlLmpzXCIsXG4gICAgICBcImluZGV4LnZ0b1wiLFxuICAgICAgXCJzdHlsZXMuY3NzXCIsXG4gICAgICBcImZhdmljb24ucG5nXCIsXG4gICAgICBcImpzL21haW4uanNcIixcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICBzaXRlLnJlbW90ZUZpbGUoZmlsZSwgaW1wb3J0Lm1ldGEucmVzb2x2ZShgLi9zcmMvJHtmaWxlfWApKTtcbiAgICB9XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxhQUEwQixlQUFlO0FBRWhELE9BQU8sZ0JBQWdCO0FBSXZCLGVBQWUsU0FBVSxVQUE0QixDQUFDLENBQUM7RUFDckQsT0FBTyxDQUFDO0lBQ04scUJBQXFCO0lBQ3JCLEtBQUssR0FBRyxDQUFDLFFBQVE7SUFFakIsbUJBQW1CO0lBQ25CLE1BQU0sUUFBUTtNQUNaO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUNBO01BQ0E7TUFDQTtLQUNEO0lBRUQsS0FBSyxNQUFNLFFBQVEsTUFBTztNQUN4QixLQUFLLFVBQVUsQ0FBQyxNQUFNLFlBQVksT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztJQUMzRDtFQUNGO0FBQ0YifQ==