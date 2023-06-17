const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNewUser = async () => {
  let newUser = await prisma.user.create({
    data: {},
  });

  console.log("Successful creation", newUser);
};

const deleteUser = async (id) => {
  users = await prisma.user.delete({
    where: { id: id },
  });
};

module.exports = { createNewUser, deleteUser };
