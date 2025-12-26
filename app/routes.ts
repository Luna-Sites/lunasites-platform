import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/themes", "routes/themes.tsx"),
  route("/builder", "routes/builder.tsx"),
  route("/login", "routes/login.tsx"),
  route("/signup", "routes/signup.tsx"),
  route("/sites", "routes/sites.tsx"),
  route("/sites/:siteId/edit", "routes/sites.$siteId.edit.tsx"),
  route("/sites/:siteId/settings", "routes/sites.$siteId.settings.tsx"),
  route("/profile", "routes/profile.tsx"),
  route("/templates", "routes/templates.tsx")
] satisfies RouteConfig;
