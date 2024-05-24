/**
 * Class to load components from the _components folder.
 */ export default class ComponentsLoader {
  /** List of loaders and engines used by extensions */ formats;
  constructor(options){
    this.formats = options.formats;
  }
  /** Load a directory of components */ async load(dirEntry, data, components) {
    if (!components) {
      components = new Map();
    }
    for await (const entry of dirEntry.children.values()){
      if (entry.name.startsWith(".") || entry.name.startsWith("_")) {
        continue;
      }
      if (entry.type === "directory") {
        const name = entry.name.toLowerCase();
        const subComponents = components.get(name) || new Map();
        components.set(name, subComponents);
        await this.load(entry, data, subComponents);
        continue;
      }
      const component = await this.#loadComponent(entry, data);
      if (component) {
        components.set(component.name.toLowerCase(), component);
      }
    }
    return components;
  }
  /** Load a component file */ async #loadComponent(entry, inheritData) {
    const format = this.formats.search(entry.name);
    if (!format) {
      return;
    }
    if (!format.loader || !format.engines?.length) {
      return;
    }
    const component = await entry.getContent(format.loader);
    function getData(data) {
      if (component.inheritData === false) {
        return {
          ...data
        };
      }
      return {
        ...inheritData,
        ...data
      };
    }
    const { content } = component;
    return {
      name: component.name ?? entry.name.slice(0, -format.ext.length),
      render (data) {
        return format.engines.reduce((content, engine)=>engine.renderComponent(content, getData(data), entry.path), content);
      },
      css: component.css,
      js: component.js
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvbHVtZUB2Mi4yLjAvY29yZS9jb21wb25lbnRfbG9hZGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVudHJ5IH0gZnJvbSBcIi4vZnMudHNcIjtcblxuaW1wb3J0IHR5cGUgeyBEYXRhIH0gZnJvbSBcIi4vZmlsZS50c1wiO1xuaW1wb3J0IHR5cGUgRm9ybWF0cyBmcm9tIFwiLi9mb3JtYXRzLnRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3B0aW9ucyB7XG4gIC8qKiBUaGUgcmVnaXN0ZXJlZCBmaWxlIGZvcm1hdHMgKi9cbiAgZm9ybWF0czogRm9ybWF0cztcbn1cblxuLyoqXG4gKiBDbGFzcyB0byBsb2FkIGNvbXBvbmVudHMgZnJvbSB0aGUgX2NvbXBvbmVudHMgZm9sZGVyLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb21wb25lbnRzTG9hZGVyIHtcbiAgLyoqIExpc3Qgb2YgbG9hZGVycyBhbmQgZW5naW5lcyB1c2VkIGJ5IGV4dGVuc2lvbnMgKi9cbiAgZm9ybWF0czogRm9ybWF0cztcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgdGhpcy5mb3JtYXRzID0gb3B0aW9ucy5mb3JtYXRzO1xuICB9XG5cbiAgLyoqIExvYWQgYSBkaXJlY3Rvcnkgb2YgY29tcG9uZW50cyAqL1xuICBhc3luYyBsb2FkKFxuICAgIGRpckVudHJ5OiBFbnRyeSxcbiAgICBkYXRhOiBQYXJ0aWFsPERhdGE+LFxuICAgIGNvbXBvbmVudHM/OiBDb21wb25lbnRzLFxuICApOiBQcm9taXNlPENvbXBvbmVudHM+IHtcbiAgICBpZiAoIWNvbXBvbmVudHMpIHtcbiAgICAgIGNvbXBvbmVudHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZm9yIGF3YWl0IChjb25zdCBlbnRyeSBvZiBkaXJFbnRyeS5jaGlsZHJlbi52YWx1ZXMoKSkge1xuICAgICAgaWYgKGVudHJ5Lm5hbWUuc3RhcnRzV2l0aChcIi5cIikgfHwgZW50cnkubmFtZS5zdGFydHNXaXRoKFwiX1wiKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGVudHJ5LnR5cGUgPT09IFwiZGlyZWN0b3J5XCIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGVudHJ5Lm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY29uc3Qgc3ViQ29tcG9uZW50cyA9IChjb21wb25lbnRzLmdldChuYW1lKSB8fCBuZXcgTWFwKCkpIGFzIENvbXBvbmVudHM7XG4gICAgICAgIGNvbXBvbmVudHMuc2V0KG5hbWUsIHN1YkNvbXBvbmVudHMpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZChlbnRyeSwgZGF0YSwgc3ViQ29tcG9uZW50cyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjb21wb25lbnQgPSBhd2FpdCB0aGlzLiNsb2FkQ29tcG9uZW50KGVudHJ5LCBkYXRhKTtcblxuICAgICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgICBjb21wb25lbnRzLnNldChjb21wb25lbnQubmFtZS50b0xvd2VyQ2FzZSgpLCBjb21wb25lbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb21wb25lbnRzO1xuICB9XG5cbiAgLyoqIExvYWQgYSBjb21wb25lbnQgZmlsZSAqL1xuICBhc3luYyAjbG9hZENvbXBvbmVudChcbiAgICBlbnRyeTogRW50cnksXG4gICAgaW5oZXJpdERhdGE6IFBhcnRpYWw8RGF0YT4sXG4gICk6IFByb21pc2U8Q29tcG9uZW50IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZm9ybWF0ID0gdGhpcy5mb3JtYXRzLnNlYXJjaChlbnRyeS5uYW1lKTtcblxuICAgIGlmICghZm9ybWF0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFmb3JtYXQubG9hZGVyIHx8ICFmb3JtYXQuZW5naW5lcz8ubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50ID0gYXdhaXQgZW50cnkuZ2V0Q29udGVudChcbiAgICAgIGZvcm1hdC5sb2FkZXIsXG4gICAgKSBhcyBDb21wb25lbnRGaWxlO1xuXG4gICAgZnVuY3Rpb24gZ2V0RGF0YShkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgICAgaWYgKGNvbXBvbmVudC5pbmhlcml0RGF0YSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHsgLi4uZGF0YSB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyAuLi5pbmhlcml0RGF0YSwgLi4uZGF0YSB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgY29udGVudCB9ID0gY29tcG9uZW50O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IGNvbXBvbmVudC5uYW1lID8/IGVudHJ5Lm5hbWUuc2xpY2UoMCwgLWZvcm1hdC5leHQubGVuZ3RoKSxcbiAgICAgIHJlbmRlcihkYXRhKSB7XG4gICAgICAgIHJldHVybiBmb3JtYXQuZW5naW5lcyEucmVkdWNlKFxuICAgICAgICAgIChjb250ZW50LCBlbmdpbmUpID0+XG4gICAgICAgICAgICBlbmdpbmUucmVuZGVyQ29tcG9uZW50KGNvbnRlbnQsIGdldERhdGEoZGF0YSksIGVudHJ5LnBhdGgpLFxuICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgY3NzOiBjb21wb25lbnQuY3NzLFxuICAgICAganM6IGNvbXBvbmVudC5qcyxcbiAgICB9IGFzIENvbXBvbmVudDtcbiAgfVxufVxuXG5leHBvcnQgdHlwZSBDb21wb25lbnRzID0gTWFwPHN0cmluZywgQ29tcG9uZW50IHwgQ29tcG9uZW50cz47XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50IHtcbiAgLyoqIE5hbWUgb2YgdGhlIGNvbXBvbmVudCAodXNlZCB0byBnZXQgaXQgZnJvbSB0ZW1wbGF0ZXMpICovXG4gIG5hbWU6IHN0cmluZztcblxuICAvKiogVGhlIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgdG8gcmVuZGVyIHRoZSBjb21wb25lbnQgKi9cbiAgcmVuZGVyOiAocHJvcHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBzdHJpbmc7XG5cbiAgLyoqIE9wdGlvbmFsIENTUyBjb2RlIG5lZWRlZCB0byBzdHlsZSB0aGUgY29tcG9uZW50IChnbG9iYWwsIG9ubHkgaW5zZXJ0ZWQgb25jZSkgKi9cbiAgY3NzPzogc3RyaW5nO1xuXG4gIC8qKiBPcHRpb25hbCBKUyBjb2RlIG5lZWRlZCBmb3IgdGhlIGNvbXBvbmVudCBpbnRlcmFjdGl2aXR5IChnbG9iYWwsIG9ubHkgaW5zZXJ0ZWQgb25jZSkgKi9cbiAganM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50RmlsZSB7XG4gIC8qKiBOYW1lIG9mIHRoZSBjb21wb25lbnQgKHVzZWQgdG8gZ2V0IGl0IGZyb20gdGVtcGxhdGVzKSAqL1xuICBuYW1lPzogc3RyaW5nO1xuXG4gIC8qKiBUaGUgY29udGVudCBvZiB0aGUgY29tcG9uZW50ICovXG4gIGNvbnRlbnQ6IHVua25vd247XG5cbiAgLyoqIE9wdGlvbmFsIENTUyBjb2RlIG5lZWRlZCB0byBzdHlsZSB0aGUgY29tcG9uZW50IChnbG9iYWwsIG9ubHkgaW5zZXJ0ZWQgb25jZSkgKi9cbiAgY3NzPzogc3RyaW5nO1xuXG4gIC8qKiBPcHRpb25hbCBKUyBjb2RlIG5lZWRlZCBmb3IgdGhlIGNvbXBvbmVudCBpbnRlcmFjdGl2aXR5IChnbG9iYWwsIG9ubHkgaW5zZXJ0ZWQgb25jZSkgKi9cbiAganM/OiBzdHJpbmc7XG5cbiAgLyoqIElmIGZhbHNlLCB0aGUgZGF0YSBmcm9tIHRoZSBwYXJlbnQgZGlyZWN0b3J5IHdpbGwgbm90IGJlIGluaGVyaXRlZCAqL1xuICBpbmhlcml0RGF0YT86IGJvb2xlYW47XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUE7O0NBRUMsR0FDRCxlQUFlLE1BQU07RUFDbkIsbURBQW1ELEdBQ25ELFFBQWlCO0VBRWpCLFlBQVksT0FBZ0IsQ0FBRTtJQUM1QixJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsT0FBTztFQUNoQztFQUVBLG1DQUFtQyxHQUNuQyxNQUFNLEtBQ0osUUFBZSxFQUNmLElBQW1CLEVBQ25CLFVBQXVCLEVBQ0Y7SUFDckIsSUFBSSxDQUFDLFlBQVk7TUFDZixhQUFhLElBQUk7SUFDbkI7SUFFQSxXQUFXLE1BQU0sU0FBUyxTQUFTLFFBQVEsQ0FBQyxNQUFNLEdBQUk7TUFDcEQsSUFBSSxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTTtRQUM1RDtNQUNGO01BRUEsSUFBSSxNQUFNLElBQUksS0FBSyxhQUFhO1FBQzlCLE1BQU0sT0FBTyxNQUFNLElBQUksQ0FBQyxXQUFXO1FBQ25DLE1BQU0sZ0JBQWlCLFdBQVcsR0FBRyxDQUFDLFNBQVMsSUFBSTtRQUNuRCxXQUFXLEdBQUcsQ0FBQyxNQUFNO1FBRXJCLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLE1BQU07UUFDN0I7TUFDRjtNQUVBLE1BQU0sWUFBWSxNQUFNLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPO01BRW5ELElBQUksV0FBVztRQUNiLFdBQVcsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLFdBQVcsSUFBSTtNQUMvQztJQUNGO0lBRUEsT0FBTztFQUNUO0VBRUEsMEJBQTBCLEdBQzFCLE1BQU0sQ0FBQyxhQUFhLENBQ2xCLEtBQVksRUFDWixXQUEwQjtJQUUxQixNQUFNLFNBQVMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJO0lBRTdDLElBQUksQ0FBQyxRQUFRO01BQ1g7SUFDRjtJQUVBLElBQUksQ0FBQyxPQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sT0FBTyxFQUFFLFFBQVE7TUFDN0M7SUFDRjtJQUVBLE1BQU0sWUFBWSxNQUFNLE1BQU0sVUFBVSxDQUN0QyxPQUFPLE1BQU07SUFHZixTQUFTLFFBQVEsSUFBNkI7TUFDNUMsSUFBSSxVQUFVLFdBQVcsS0FBSyxPQUFPO1FBQ25DLE9BQU87VUFBRSxHQUFHLElBQUk7UUFBQztNQUNuQjtNQUVBLE9BQU87UUFBRSxHQUFHLFdBQVc7UUFBRSxHQUFHLElBQUk7TUFBQztJQUNuQztJQUVBLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRztJQUVwQixPQUFPO01BQ0wsTUFBTSxVQUFVLElBQUksSUFBSSxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxDQUFDLE1BQU07TUFDOUQsUUFBTyxJQUFJO1FBQ1QsT0FBTyxPQUFPLE9BQU8sQ0FBRSxNQUFNLENBQzNCLENBQUMsU0FBUyxTQUNSLE9BQU8sZUFBZSxDQUFDLFNBQVMsUUFBUSxPQUFPLE1BQU0sSUFBSSxHQUMzRDtNQUVKO01BQ0EsS0FBSyxVQUFVLEdBQUc7TUFDbEIsSUFBSSxVQUFVLEVBQUU7SUFDbEI7RUFDRjtBQUNGIn0=