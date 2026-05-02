import fs from "fs/promises";

const extractFromFileWithPromise = (filePath) => {
  const transactions = fs
    .readFile(filePath, "utf-8")
    .then((data) => JSON.parse(data))
    .catch((err) => {
      console.error("Error with reading data");
      return [];
    });

  return transactions;
};

export default extractFromFileWithPromise;
