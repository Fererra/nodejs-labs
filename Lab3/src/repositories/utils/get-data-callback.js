import fs from "fs";

const extractFromFileCallback = (filePath, callback) => {
  fs.readFile(filePath, "utf-8", (error, data) => {
    if (error) {
      console.error("Error with reading data via callback:", error);
      callback(error, []);
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      callback(null, parsedData);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      callback(parseError, []);
    }
  });
};

export default extractFromFileCallback;
