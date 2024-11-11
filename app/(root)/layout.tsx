import React from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { Toaster } from "@/components/ui/toaster";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
const Layout = async ({ children }: { children: React.ReactNode }) => {
  try {
    const currentUser = await getCurrentUser();
    const sessionCookie = (await cookies()).get("appwrite-session");
    if (!currentUser || !sessionCookie) {
      return redirect("/sign-in");
    }

    return (
      <main className="flex h-screen">
        <Sidebar {...currentUser} />
        <section className="flex h-full flex-1 flex-col">
          <MobileNavigation {...currentUser} />
          <Header {...currentUser} />
          <div className="main-content">{children}</div>
        </section>{" "}
        <Toaster />
      </main>
    );
  } catch (error) {
    console.error("Error during layout rendering:", error);
    return redirect("/sign-in");
  }
};
export default Layout;
