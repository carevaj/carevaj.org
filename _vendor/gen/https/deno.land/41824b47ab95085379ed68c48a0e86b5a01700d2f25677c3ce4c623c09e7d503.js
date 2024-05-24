import image from "./image/mod.ts";
import "lume/types.ts";
export default function imagePlugin(userOptions = {}) {
  return function(site) {
    site.hooks.addMarkdownItPlugin(image, userOptions);
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZV9tYXJrZG93bl9wbHVnaW5zQHYwLjcuMC9pbWFnZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW1hZ2UsIHsgT3B0aW9ucyB9IGZyb20gXCIuL2ltYWdlL21vZC50c1wiO1xuaW1wb3J0IFwibHVtZS90eXBlcy50c1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbWFnZVBsdWdpbih1c2VyT3B0aW9uczogUGFydGlhbDxPcHRpb25zPiA9IHt9KSB7XG4gIHJldHVybiBmdW5jdGlvbiAoc2l0ZTogTHVtZS5TaXRlKSB7XG4gICAgc2l0ZS5ob29rcy5hZGRNYXJrZG93bkl0UGx1Z2luKGltYWdlLCB1c2VyT3B0aW9ucyk7XG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxXQUF3QixpQkFBaUI7QUFDaEQsT0FBTyxnQkFBZ0I7QUFFdkIsZUFBZSxTQUFTLFlBQVksY0FBZ0MsQ0FBQyxDQUFDO0VBQ3BFLE9BQU8sU0FBVSxJQUFlO0lBQzlCLEtBQUssS0FBSyxDQUFDLG1CQUFtQixDQUFDLE9BQU87RUFDeEM7QUFDRiJ9