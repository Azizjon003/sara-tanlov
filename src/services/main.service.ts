import * as XLSX from "xlsx";
import prisma from "../../prisma/prisma";

const workbook = XLSX.readFile("product_codes-bugun.xlsx.xlsx");

// Birinchi varaqni olish
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Ma'lumotlarni JSONga o'tkazish
const data = XLSX.utils.sheet_to_json(sheet);

console.log(data[data.length - 1]);

const productsCodesFunk = async () => {
  try {
    const codes = data.map((product: any) => ({
      code: product.Elp9gR,
    }));

    const result = await prisma.code.createMany({
      data: codes,
      skipDuplicates: true, // Agar kerak bo'lsa, takroriy kodlarni o'tkazib yuborish uchun
    });

    console.log(`${result.count} ta kod muvaffaqiyatli yaratildi.`);
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
  } finally {
    await prisma.$disconnect();
  }
};

// productsCodesFunk();
