import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { SessionProvider } from "@/components/session";
import { getSession } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saengdao Night Market · Vendor spot booking",
  description: "Pick a stall on the map, choose your night and set up shop.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <SessionProvider user={session?.user ?? null}>
          <Nav />
          <main className="mx-auto max-w-[1440px]">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
