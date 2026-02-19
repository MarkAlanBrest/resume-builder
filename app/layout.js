export const metadata = {
  title: "Resume Builder",
  description: "NCST Resume Builder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
