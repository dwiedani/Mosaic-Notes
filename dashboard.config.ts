import { defineApp, defineWidget } from "@mosaic/sdk";

export default defineApp({
  id: "notes",
  name: "Notizen",
  description:
    "Gedanken festhalten, Notizen durchsuchen und Wichtiges anheften.",
  icon: "grid",
  requires: { dashboardApi: ">=1.0.0 <2.0.0" },
  app: { component: () => import("./src/app") },
  entityTypes: [{ type: "note", label: "Notiz", contextAware: true }],
  widgets: [
    defineWidget({
      id: "recent",
      title: "Letzte Notizen",
      icon: "grid",
      sizes: ["medium", "large"],
      settings: {
        limit: {
          type: "number",
          label: "Anzahl der Notizen",
          default: 3,
          min: 1,
          max: 8,
        },
        "pinned-only": {
          type: "boolean",
          label: "Nur angeheftete Notizen",
          default: false,
        },
      },
      component: () => import("./src/widgets/recent"),
    }),
    defineWidget({
      id: "quick-note",
      title: "Schnelle Notiz",
      icon: "plus",
      sizes: ["medium", "large"],
      component: () => import("./src/widgets/quick-note"),
    }),
  ],
});
