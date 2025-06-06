import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/themes", "routes/themes.tsx")
] satisfies RouteConfig;
