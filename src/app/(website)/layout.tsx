import Navbar from "@/components/website/Navbar";
import Footer from "@/components/website/Footer";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>{children}</main>

      <Footer />
    </div>
  );
}