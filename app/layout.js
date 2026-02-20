export const metadata = {
  title: "Resume Builder",
  description: "Generate your resume",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
