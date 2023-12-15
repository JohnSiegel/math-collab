import { GeistSans } from "geist/font/sans";
import "../../styles/globals.css";
import "../../styles/mathquill.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
