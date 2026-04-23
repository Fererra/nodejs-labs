import fs from "fs";

const extractFromFileAsync = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error('Error with reading data');
        return [];
    }
}

export default extractFromFileAsync;