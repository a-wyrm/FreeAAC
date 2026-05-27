module.exports = {
  globDirectory: "dist",
  globPatterns: ["**/*.{html,ico,png,js}"],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
}
