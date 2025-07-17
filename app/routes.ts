import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/themes", "routes/themes.tsx"),
  route("/builder", "routes/builder.tsx"),
  route("/sites", "routes/sites.tsx"),
  route("/billing", "routes/billing.tsx"),
  route("/profile", "routes/profile.tsx")
] satisfies RouteConfig;
