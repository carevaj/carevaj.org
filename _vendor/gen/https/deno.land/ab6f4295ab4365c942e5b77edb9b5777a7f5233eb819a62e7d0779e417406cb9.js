// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
/** Object structure for a list of HTML entities. */ const rawToEntityEntries = [
  [
    "&",
    "&amp;"
  ],
  [
    "<",
    "&lt;"
  ],
  [
    ">",
    "&gt;"
  ],
  [
    '"',
    "&quot;"
  ],
  [
    "'",
    "&#39;"
  ]
];
const defaultEntityList = Object.fromEntries([
  ...rawToEntityEntries.map(([raw, entity])=>[
      entity,
      raw
    ]),
  [
    "&apos;",
    "'"
  ],
  [
    "&nbsp;",
    "\xa0"
  ]
]);
const rawToEntity = new Map(rawToEntityEntries);
const rawRe = new RegExp(`[${[
  ...rawToEntity.keys()
].join("")}]`, "g");
/**
 * Escapes text for safe interpolation into HTML text content and quoted attributes.
 *
 * @example
 * ```ts
 * import { escape } from "https://deno.land/std@$STD_VERSION/html/entities.ts";
 *
 * escape("<>'&AA"); // "&lt;&gt;&#39;&amp;AA"
 *
 * // Characters that don't need to be escaped will be left alone,
 * // even if named HTML entities exist for them.
 * escape("þð"); // "þð"
 * ```
 */ export function escape(str) {
  return str.replaceAll(rawRe, (m)=>rawToEntity.get(m));
}
const defaultUnescapeOptions = {
  entityList: defaultEntityList
};
const MAX_CODE_POINT = 0x10ffff;
const RX_DEC_ENTITY = /&#([0-9]+);/g;
const RX_HEX_ENTITY = /&#x(\p{AHex}+);/gu;
const entityListRegexCache = new WeakMap();
/**
 * Unescapes HTML entities in text.
 *
 * @example
 * ```ts
 * import { unescape } from "https://deno.land/std@$STD_VERSION/html/entities.ts";
 *
 * // Default options (only handles &<>'" and numeric entities)
 * unescape("&lt;&gt;&apos;&amp;&#65;&#x41;"); // "<>'&AA"
 * unescape("&thorn;&eth;"); // "&thorn;&eth;"
 *
 * // Using the full named entity list from the HTML spec (~47K un-minified)
 * import entityList from "https://deno.land/std@$STD_VERSION/html/named_entity_list.json" with { type: "json" };
 *
 * unescape("&thorn;&eth;", { entityList }); // "þð"
 * ```
 */ export function unescape(str, options = {}) {
  const { entityList } = {
    ...defaultUnescapeOptions,
    ...options
  };
  let entityRe = entityListRegexCache.get(entityList);
  if (!entityRe) {
    entityRe = new RegExp(`(${Object.keys(entityList).sort((a, b)=>b.length - a.length).join("|")})`, "g");
    entityListRegexCache.set(entityList, entityRe);
  }
  return str.replaceAll(entityRe, (m)=>entityList[m]).replaceAll(RX_DEC_ENTITY, (_, dec)=>codePointStrToChar(dec, 10)).replaceAll(RX_HEX_ENTITY, (_, hex)=>codePointStrToChar(hex, 16));
}
function codePointStrToChar(codePointStr, radix) {
  const codePoint = parseInt(codePointStr, radix);
  return codePoint > MAX_CODE_POINT ? "�" : String.fromCodePoint(codePoint);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIyMS4wL2h0bWwvZW50aXRpZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyNCB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuLyoqIE9iamVjdCBzdHJ1Y3R1cmUgZm9yIGEgbGlzdCBvZiBIVE1MIGVudGl0aWVzLiAqL1xuZXhwb3J0IHR5cGUgRW50aXR5TGlzdCA9IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbmNvbnN0IHJhd1RvRW50aXR5RW50cmllcyA9IFtcbiAgW1wiJlwiLCBcIiZhbXA7XCJdLFxuICBbXCI8XCIsIFwiJmx0O1wiXSxcbiAgW1wiPlwiLCBcIiZndDtcIl0sXG4gIFsnXCInLCBcIiZxdW90O1wiXSxcbiAgW1wiJ1wiLCBcIiYjMzk7XCJdLFxuXSBhcyBjb25zdDtcblxuY29uc3QgZGVmYXVsdEVudGl0eUxpc3Q6IEVudGl0eUxpc3QgPSBPYmplY3QuZnJvbUVudHJpZXMoW1xuICAuLi5yYXdUb0VudGl0eUVudHJpZXMubWFwKChbcmF3LCBlbnRpdHldKSA9PiBbZW50aXR5LCByYXddKSxcbiAgW1wiJmFwb3M7XCIsIFwiJ1wiXSxcbiAgW1wiJm5ic3A7XCIsIFwiXFx4YTBcIl0sXG5dKTtcblxuY29uc3QgcmF3VG9FbnRpdHkgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPihyYXdUb0VudGl0eUVudHJpZXMpO1xuXG5jb25zdCByYXdSZSA9IG5ldyBSZWdFeHAoYFske1suLi5yYXdUb0VudGl0eS5rZXlzKCldLmpvaW4oXCJcIil9XWAsIFwiZ1wiKTtcblxuLyoqXG4gKiBFc2NhcGVzIHRleHQgZm9yIHNhZmUgaW50ZXJwb2xhdGlvbiBpbnRvIEhUTUwgdGV4dCBjb250ZW50IGFuZCBxdW90ZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHNcbiAqIGltcG9ydCB7IGVzY2FwZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAJFNURF9WRVJTSU9OL2h0bWwvZW50aXRpZXMudHNcIjtcbiAqXG4gKiBlc2NhcGUoXCI8PicmQUFcIik7IC8vIFwiJmx0OyZndDsmIzM5OyZhbXA7QUFcIlxuICpcbiAqIC8vIENoYXJhY3RlcnMgdGhhdCBkb24ndCBuZWVkIHRvIGJlIGVzY2FwZWQgd2lsbCBiZSBsZWZ0IGFsb25lLFxuICogLy8gZXZlbiBpZiBuYW1lZCBIVE1MIGVudGl0aWVzIGV4aXN0IGZvciB0aGVtLlxuICogZXNjYXBlKFwiw77DsFwiKTsgLy8gXCLDvsOwXCJcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlQWxsKHJhd1JlLCAobSkgPT4gcmF3VG9FbnRpdHkuZ2V0KG0pISk7XG59XG5cbi8qKiBPcHRpb25zIGZvciB7QGxpbmtjb2RlIHVuZXNjYXBlfS4gKi9cbmV4cG9ydCB0eXBlIFVuZXNjYXBlT3B0aW9ucyA9IHsgZW50aXR5TGlzdDogRW50aXR5TGlzdCB9O1xuXG5jb25zdCBkZWZhdWx0VW5lc2NhcGVPcHRpb25zOiBVbmVzY2FwZU9wdGlvbnMgPSB7XG4gIGVudGl0eUxpc3Q6IGRlZmF1bHRFbnRpdHlMaXN0LFxufTtcblxuY29uc3QgTUFYX0NPREVfUE9JTlQgPSAweDEwZmZmZjtcblxuY29uc3QgUlhfREVDX0VOVElUWSA9IC8mIyhbMC05XSspOy9nO1xuY29uc3QgUlhfSEVYX0VOVElUWSA9IC8mI3goXFxwe0FIZXh9Kyk7L2d1O1xuXG5jb25zdCBlbnRpdHlMaXN0UmVnZXhDYWNoZSA9IG5ldyBXZWFrTWFwPEVudGl0eUxpc3QsIFJlZ0V4cD4oKTtcblxuLyoqXG4gKiBVbmVzY2FwZXMgSFRNTCBlbnRpdGllcyBpbiB0ZXh0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgdW5lc2NhcGUgfSBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQCRTVERfVkVSU0lPTi9odG1sL2VudGl0aWVzLnRzXCI7XG4gKlxuICogLy8gRGVmYXVsdCBvcHRpb25zIChvbmx5IGhhbmRsZXMgJjw+J1wiIGFuZCBudW1lcmljIGVudGl0aWVzKVxuICogdW5lc2NhcGUoXCImbHQ7Jmd0OyZhcG9zOyZhbXA7JiM2NTsmI3g0MTtcIik7IC8vIFwiPD4nJkFBXCJcbiAqIHVuZXNjYXBlKFwiJnRob3JuOyZldGg7XCIpOyAvLyBcIiZ0aG9ybjsmZXRoO1wiXG4gKlxuICogLy8gVXNpbmcgdGhlIGZ1bGwgbmFtZWQgZW50aXR5IGxpc3QgZnJvbSB0aGUgSFRNTCBzcGVjICh+NDdLIHVuLW1pbmlmaWVkKVxuICogaW1wb3J0IGVudGl0eUxpc3QgZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAkU1REX1ZFUlNJT04vaHRtbC9uYW1lZF9lbnRpdHlfbGlzdC5qc29uXCIgd2l0aCB7IHR5cGU6IFwianNvblwiIH07XG4gKlxuICogdW5lc2NhcGUoXCImdGhvcm47JmV0aDtcIiwgeyBlbnRpdHlMaXN0IH0pOyAvLyBcIsO+w7BcIlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmVzY2FwZShcbiAgc3RyOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFBhcnRpYWw8VW5lc2NhcGVPcHRpb25zPiA9IHt9LFxuKTogc3RyaW5nIHtcbiAgY29uc3QgeyBlbnRpdHlMaXN0IH0gPSB7IC4uLmRlZmF1bHRVbmVzY2FwZU9wdGlvbnMsIC4uLm9wdGlvbnMgfTtcblxuICBsZXQgZW50aXR5UmUgPSBlbnRpdHlMaXN0UmVnZXhDYWNoZS5nZXQoZW50aXR5TGlzdCk7XG5cbiAgaWYgKCFlbnRpdHlSZSkge1xuICAgIGVudGl0eVJlID0gbmV3IFJlZ0V4cChcbiAgICAgIGAoJHtcbiAgICAgICAgT2JqZWN0LmtleXMoZW50aXR5TGlzdClcbiAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYi5sZW5ndGggLSBhLmxlbmd0aClcbiAgICAgICAgICAuam9pbihcInxcIilcbiAgICAgIH0pYCxcbiAgICAgIFwiZ1wiLFxuICAgICk7XG5cbiAgICBlbnRpdHlMaXN0UmVnZXhDYWNoZS5zZXQoZW50aXR5TGlzdCwgZW50aXR5UmUpO1xuICB9XG5cbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlQWxsKGVudGl0eVJlLCAobSkgPT4gZW50aXR5TGlzdFttXSEpXG4gICAgLnJlcGxhY2VBbGwoUlhfREVDX0VOVElUWSwgKF8sIGRlYykgPT4gY29kZVBvaW50U3RyVG9DaGFyKGRlYywgMTApKVxuICAgIC5yZXBsYWNlQWxsKFJYX0hFWF9FTlRJVFksIChfLCBoZXgpID0+IGNvZGVQb2ludFN0clRvQ2hhcihoZXgsIDE2KSk7XG59XG5cbmZ1bmN0aW9uIGNvZGVQb2ludFN0clRvQ2hhcihjb2RlUG9pbnRTdHI6IHN0cmluZywgcmFkaXg6IG51bWJlcikge1xuICBjb25zdCBjb2RlUG9pbnQgPSBwYXJzZUludChjb2RlUG9pbnRTdHIsIHJhZGl4KTtcblxuICByZXR1cm4gY29kZVBvaW50ID4gTUFYX0NPREVfUE9JTlQgPyBcIu+/vVwiIDogU3RyaW5nLmZyb21Db2RlUG9pbnQoY29kZVBvaW50KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLGtEQUFrRCxHQUdsRCxNQUFNLHFCQUFxQjtFQUN6QjtJQUFDO0lBQUs7R0FBUTtFQUNkO0lBQUM7SUFBSztHQUFPO0VBQ2I7SUFBQztJQUFLO0dBQU87RUFDYjtJQUFDO0lBQUs7R0FBUztFQUNmO0lBQUM7SUFBSztHQUFRO0NBQ2Y7QUFFRCxNQUFNLG9CQUFnQyxPQUFPLFdBQVcsQ0FBQztLQUNwRCxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sR0FBSztNQUFDO01BQVE7S0FBSTtFQUMxRDtJQUFDO0lBQVU7R0FBSTtFQUNmO0lBQUM7SUFBVTtHQUFPO0NBQ25CO0FBRUQsTUFBTSxjQUFjLElBQUksSUFBb0I7QUFFNUMsTUFBTSxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsRUFBRTtLQUFJLFlBQVksSUFBSTtDQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFFbEU7Ozs7Ozs7Ozs7Ozs7Q0FhQyxHQUNELE9BQU8sU0FBUyxPQUFPLEdBQVc7RUFDaEMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBTSxZQUFZLEdBQUcsQ0FBQztBQUN0RDtBQUtBLE1BQU0seUJBQTBDO0VBQzlDLFlBQVk7QUFDZDtBQUVBLE1BQU0saUJBQWlCO0FBRXZCLE1BQU0sZ0JBQWdCO0FBQ3RCLE1BQU0sZ0JBQWdCO0FBRXRCLE1BQU0sdUJBQXVCLElBQUk7QUFFakM7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQkMsR0FDRCxPQUFPLFNBQVMsU0FDZCxHQUFXLEVBQ1gsVUFBb0MsQ0FBQyxDQUFDO0VBRXRDLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRztJQUFFLEdBQUcsc0JBQXNCO0lBQUUsR0FBRyxPQUFPO0VBQUM7RUFFL0QsSUFBSSxXQUFXLHFCQUFxQixHQUFHLENBQUM7RUFFeEMsSUFBSSxDQUFDLFVBQVU7SUFDYixXQUFXLElBQUksT0FDYixDQUFDLENBQUMsRUFDQSxPQUFPLElBQUksQ0FBQyxZQUNULElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBTSxFQUFFLE1BQU0sR0FBRyxFQUFFLE1BQU0sRUFDbEMsSUFBSSxDQUFDLEtBQ1QsQ0FBQyxDQUFDLEVBQ0g7SUFHRixxQkFBcUIsR0FBRyxDQUFDLFlBQVk7RUFDdkM7RUFFQSxPQUFPLElBQ0osVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFNLFVBQVUsQ0FBQyxFQUFFLEVBQ3pDLFVBQVUsQ0FBQyxlQUFlLENBQUMsR0FBRyxNQUFRLG1CQUFtQixLQUFLLEtBQzlELFVBQVUsQ0FBQyxlQUFlLENBQUMsR0FBRyxNQUFRLG1CQUFtQixLQUFLO0FBQ25FO0FBRUEsU0FBUyxtQkFBbUIsWUFBb0IsRUFBRSxLQUFhO0VBQzdELE1BQU0sWUFBWSxTQUFTLGNBQWM7RUFFekMsT0FBTyxZQUFZLGlCQUFpQixNQUFNLE9BQU8sYUFBYSxDQUFDO0FBQ2pFIn0=