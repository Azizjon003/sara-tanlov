import fs from "fs";
import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
import {
  generateProductCodes,
  saveToExcel,
} from "../utils/generateRandomNumber";
const scene = new Scenes.BaseScene("getCodes");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.hears(/\d/, async (ctx: any) => {
  const code = Number(ctx.message.text);

  const getCode = generateProductCodes(code);

  let codes = [];
  for (let i = 0; i < getCode.length; i++) {
    try {
      await prisma.code.create({
        data: {
          code: String(getCode[i]),
        },
      });

      codes.push(getCode[i]);
    } catch (error) {
      ctx.reply("Xatolik yuz berdi");
    }
  }

  const text = `Kodlar yaratildi va product_codes.xlsx fayliga saqlandi.Bir necha daqiqada yuboraman faylni`;

  await saveToExcel(codes, "product_codes.xlsx");

  await ctx.reply(text);

  const file = `product_codes.xlsx`;

  const fileData = fs.readFileSync(file);

  await ctx.telegram.sendDocument(
    ctx.from.id,
    {
      source: fileData,
      filename: `${file}.xlsx`,
    },
    {
      caption: `${code} ta kodlar yaratildi`,
      parse_mode: "HTML",
    }
  );
});

export default scene;
