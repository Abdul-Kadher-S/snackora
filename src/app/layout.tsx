import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { HostelProvider } from "@/context/HostelContext";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CheckoutModal } from "@/components/cart/CheckoutModal";

export const metadata: Metadata = {
  title: "Snackora — The World of Snacks, Delivered.",
  description:
    "Snackora delivers snacks, chocolates, beverages, ice cream, and combos straight to your hostel room. Cash on Delivery. Free delivery on eligible orders.",
  keywords: [
    "hostel snacks",
    "snack delivery",
    "hostel delivery",
    "Snackora",
    "chocolates",
    "beverages",
    "ice cream",
    "campus delivery",
    "cash on delivery",
  ],
  openGraph: {
    title: "Snackora — The World of Snacks, Delivered.",
    description: "Your snacks. Your room. Delivered. Free hostel room delivery on eligible orders!",
    url: "https://snackora.com",
    siteName: "Snackora",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <ToastProvider>
          <HostelProvider>
            <CartProvider>
              {children}
              <CartDrawer />
              <CheckoutModal />
            </CartProvider>
          </HostelProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
