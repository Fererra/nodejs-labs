import fs from "fs";

const extractFromFileSync = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error with reading data synchronously:", error);
    return [];
  }
};

export default extractFromFileSync;
