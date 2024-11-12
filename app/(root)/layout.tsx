import React from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { Toaster } from "@/components/ui/toaster";
import { redirect } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";
const Layout = async ({ children }: { children: React.ReactNode }) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log("Error during layout rendering");
    }
    return (
      <main className="flex h-screen">
        <Sidebar {...currentUser} />
        <section className="flex h-full flex-1 flex-col">
          <MobileNavigation {...currentUser} />
          <Header {...currentUser} />
          <div className="main-content">{children}</div>
          <SpeedInsights />
        </section>
        <Toaster />
      </main>
    );
  } catch (error) {
    console.log("Error during layout rendering:", error);
    redirect("/sign-in");
  }
};
export default Layout;
