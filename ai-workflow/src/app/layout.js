import "./globals.css";

export const metadata = {
  title: "AI Workflow Builder",
  description: "Visual YES/NO AI decision workflows, executed with Inngest.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
