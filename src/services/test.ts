import prisma from "../../prisma/prisma";

const main = async () => {
  const code = await prisma.code.findFirst({
    where: {
      code: "",
    },
  });

  console.log(code);
};

main();
