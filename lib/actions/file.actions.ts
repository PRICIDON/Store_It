"use server";

import { createAdminClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { config } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/user.actions";

const handleError = (err: unknown, message: string) => {
  console.log(err, message);
  throw err;
};
export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
  const { storage, databases } = await createAdminClient();

  try {
    const inputFile = InputFile.fromBuffer(file, file.name);

    const bucketFile = await storage.createFile(
      config.bucketId,
      ID.unique(),
      inputFile,
    );

    const fileDocument = {
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      owner: ownerId,
      accountId,
      users: [],
      bucketFileId: bucketFile.$id,
    };

    const newFile = await databases
      .createDocument(
        config.databaseId,
        config.filesCollectionId,
        ID.unique(),
        fileDocument,
      )
      .catch(async (error: unknown) => {
        await storage.deleteFile(config.bucketId, bucketFile.$id);
        handleError(error, "Failed to create file document");
      });

    revalidatePath(path);
    return parseStringify(newFile);
  } catch (error) {
    handleError(error, "Failed to upload file");
  }
};

function createQueries(curUser: Models.Document) {
  const queries = [
    Query.or([
      Query.equal("owner", curUser.$id),
      Query.contains("users", curUser.email),
    ]),
  ];

  // TODO: Search, sort, limits...
  return queries;
}

export const getFiles = async () => {
  const { databases } = await createAdminClient();
  try {
    const curUser = await getCurrentUser();

    if (!curUser) throw new Error("Пользователь не найден");
    const queries = createQueries(curUser);
    console.log({ curUser, queries });
    const files = await databases.listDocuments(
      config.databaseId,
      config.filesCollectionId,
      queries,
    );
    console.log({ files });
    return parseStringify(files);
  } catch (e) {
    handleError(e, "Ошибка при получение файлов");
  }
};
export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  const { databases } = await createAdminClient();
  try {
    const newName = `${name}.${extension}`;
    const updatedFile = await databases.updateDocument(
      config.databaseId,
      config.filesCollectionId,
      fileId,
      {
        name: newName,
      },
    );
    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (e) {
    handleError(e, "Ошибка при переименование файла");
  }
};
