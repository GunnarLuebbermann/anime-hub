import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "AnimeHub",
  description: "Entdecke, bewerte und teile deine Lieblingsanimes!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-950 text-gray-100">
        <Header />
        <div className="pt-4">{children}</div>
      </body>
    </html>
  );
}
