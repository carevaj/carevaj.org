import { html } from "../deps.ts";
export default function() {
  return (env)=>{
    // deno-lint-ignore no-explicit-any
    env.filters.escape = (value)=>value ? html.escape(value.toString()) : "";
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvdmVudG9AdjAuMTIuNS9wbHVnaW5zL2VzY2FwZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBodG1sIH0gZnJvbSBcIi4uL2RlcHMudHNcIjtcbmltcG9ydCB0eXBlIHsgRW52aXJvbm1lbnQgfSBmcm9tIFwiLi4vc3JjL2Vudmlyb25tZW50LnRzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChlbnY6IEVudmlyb25tZW50KSA9PiB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBlbnYuZmlsdGVycy5lc2NhcGUgPSAodmFsdWU6IGFueSkgPT5cbiAgICAgIHZhbHVlID8gaHRtbC5lc2NhcGUodmFsdWUudG9TdHJpbmcoKSkgOiBcIlwiO1xuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsSUFBSSxRQUFRLGFBQWE7QUFHbEMsZUFBZTtFQUNiLE9BQU8sQ0FBQztJQUNOLG1DQUFtQztJQUNuQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxRQUNwQixRQUFRLEtBQUssTUFBTSxDQUFDLE1BQU0sUUFBUSxNQUFNO0VBQzVDO0FBQ0YifQ==