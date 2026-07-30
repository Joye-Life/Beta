import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Joye Life",
    short_name: "Joye",
    description: "Your life. One clear next move.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f8fc",
    theme_color: "#070916",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
