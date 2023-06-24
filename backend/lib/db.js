const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNewUser = async () => {
  let newUser = await prisma.user.create({
    data: {},
  });

  return newUser;
};

const deleteUser = async (id) => {
  users = await prisma.user.delete({
    where: { id: id },
  });
};

const validateUser = async (userId) => {
  user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user == null) return false;

  return true;
};

const getFilesByUserId = async (userId) => {
  users = await prisma.file.findMany({
    where: { id: userId },
  });
};

const createFile = async (fileName, userId, url) => {
  // id         String       @id @default(uuid())
  // fileName   String
  // uploadedAt DateTime     @default(now())
  // User       User         @relation(fields: [userId], references: [id])
  // userId     String
  // deleted    Boolean      @default(false)
  // status     UploadStatus @default(PENDING)
  // url        String       @unique
  // password   String?

  const file = await prisma.file.create({
    data: {
      fileName: fileName,
      userId: userId,
      url: url,
      deleted: false,
      status: "SUCCESSFUL",
    },
  });

  return file;
};

const findFileByUrl = async (url) => {
  const file = await prisma.file.findUnique({
    where: {
      url: url,
    },
  });

  return file;
};

const getFileListByUserId = async (userId) => {
  const file = await prisma.file.findMany({
    where: {
      userId: userId,
    },
  });

  return file;
};

const getFileById = async (fileId) => {
  const file = await prisma.file.findUnique({
    where: {
      id: fileId,
    },
  });

  return file;
};

const updateFile = async (fileId, fileContent) => {
  const file = await prisma.file.update({
    where: {
      id: fileId,
    },
    data: {
      ...fileContent,
    },
  });
  return file;
};

module.exports = { createNewUser, deleteUser, getFilesByUserId, validateUser, createFile, findFileByUrl, getFileListByUserId, getFileById, updateFile };
