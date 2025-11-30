import "./globals.css";

export const metadata = {
  title: "Wallpaper Gallery - Beautiful High-Quality Wallpapers",
  description: "Discover stunning high-quality wallpapers for your devices. Download beautiful images in various resolutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
