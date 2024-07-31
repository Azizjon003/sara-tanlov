import xlsx from "xlsx";
function generateRandomCode() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateProductCodes(count: number) {
  const codes = new Set();

  while (codes.size < count) {
    codes.add(generateRandomCode());
  }

  return Array.from(codes);
}

export function saveToExcel(codes: any[], filename: string) {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(codes.map((code) => [code]));
  xlsx.utils.book_append_sheet(workbook, worksheet, "Product Codes");
  xlsx.writeFile(workbook, filename);
}
// const productCodes = generateProductCodes(25000);

// saveToExcel(productCodes, "product_codes.xlsx");

// console.log(
//   `25000 ta unikal mahsulot kodi yaratildi va product_codes.xlsx fayliga saqlandi.`
// );
