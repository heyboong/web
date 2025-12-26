const publicRoutes = {
  id: "public",
  children: [
    {
      path: "landing",
      lazy: async () => ({
        Component: (await import("app/pages/landing")).default,
      }),
    },
  ],
};

export { publicRoutes };
