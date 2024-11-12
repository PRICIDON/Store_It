import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import FileUploader from "@/components/FileUploader";
import { logout } from "@/lib/actions/user.actions";

interface Props {
  $id: string;
  accountId: string;
}
const Header = ({ $id: ownerId, accountId }: Props) => {
  return (
    <header className="header">
      <Search />
      <div className="header-wrapper">
        <FileUploader ownerId={ownerId} accountId={accountId} />
        <form
          action={async () => {
            "use server";
            await logout();
          }}
        >
          <Button type="submit" className="sign-out-button">
            <Image
              src="assets/icons/logout.svg"
              alt="logo"
              width={24}
              height={24}
              className="size-6"
            />
          </Button>
        </form>
      </div>
    </header>
  );
};
export default Header;
