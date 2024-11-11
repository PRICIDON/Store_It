"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { config } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const handleError = (err: unknown, message: string) => {
  console.log(err, message);
  throw err;
};
export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (e) {
    handleError(e, "Ошибка при отправке OTP");
  }
};
const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();
  const result = await databases.listDocuments(
    config.databaseId,
    config.usersCollectionId,
    [Query.equal("email", [email])],
  );
  return result.total > 0 ? result.documents[0] : null;
};
export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);
  const accountId = await sendEmailOTP({ email });
  if (!accountId) throw new Error("Ошибка при отправке OTP");
  if (!existingUser) {
    const { databases } = await createAdminClient();
    await databases.createDocument(
      config.databaseId,
      config.usersCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: "/assets/images/avatar.png",
        accountId,
      },
    );
  }
  return parseStringify({ accountId });
};
export const verifySecret = async ({
  accountId,
  password,
}: {
  accountId: string;
  password: string;
}) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createSession(accountId, password);
    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    return parseStringify({ sessionId: session.$id });
  } catch (e) {
    handleError(e, "Ошибка при отправке OTP");
  }
};

export const getCurrentUser = async () => {
  const { databases, account } = await createSessionClient();
  const result = await account.get();
  const user = await databases.listDocuments(
    config.databaseId,
    config.usersCollectionId,
    [Query.equal("accountId", result.$id)],
  );
  if (user.total <= 0) return null;
  return parseStringify(user.documents[0]);
};
export const logout = async () => {
  const { account } = await createSessionClient();
  try {
    await account.deleteSession("current");
    (await cookies()).delete("appwrite-session");
  } catch (e) {
    handleError(e, "Ошибка при выходе");
  } finally {
    redirect("/sign-in");
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    // Пользователь существует? Отправляем OTP
    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }
    return parseStringify({ accountId: null, error: "Пользователь не найден" });
  } catch (e) {
    handleError(e, "Ошибка при входе в аккаунт");
  }
};
