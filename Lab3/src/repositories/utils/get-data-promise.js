import fs from "fs";

const extractFromFileWithPromise = (filePath) => {
    const transactions = fs.readFile(filePath, 'utf-8')
        .then(data => JSON.parse(data))
        .catch(err => {
            console.error('Error with reading data:', err);
            return [];
        });

    return transactions;
}

export default extractFromFileWithPromise;