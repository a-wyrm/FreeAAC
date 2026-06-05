module.exports = {
  globDirectory: "dist",
  globPatterns: ["**/*.{ico,png,js,jpg,webm}"],
  globIgnores: [],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "offline-html-cache",
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 1,
        },
      },
    },
  ],
}
