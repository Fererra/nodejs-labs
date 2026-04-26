class FinanceController {
    constructor(service) {
        this.service = service;
    }

    getAllRecords = async (req, res) => {
        try {
            const records = await this.service.getAllRecords();
            return records;
        } catch (error) {
            console.error("Error fetching all records:", error);
            return res.status(500).json({ message: "Failed to fetch records", error: error.message });
        }
    }

    getRecordById = async (req, res) =>{
        const id = Number(req.params.id)
        const result = await this.service.getRecordById(id)
        return res.status(200).json(result)
    }

    createRecord = async (req, res) => {
        try {
            const data = req.body;
            await this.service.createRecord(data);
            return res.redirect('/transactions');
        } catch (error) {
            console.error("Error creating record:", error);
            return res.status(500).json({ message: "Failed to create record", error: error.message });
        }
    }

    updateRecord = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const data = req.body;
            const result = await this.service.updateRecord(id, data);
            
            return res.status(200).json({
                message: "Record successfully updated",
                record: result
            });
        } catch (error) {
            console.error("Error updating record:", error);
            return res.status(500).json({ message: "Failed to update record", error: error.message });
        }
    }

    deleteRecord = async (req, res) => {
        try {
            const id = Number(req.params.id);
            await this.service.deleteRecord(id);
            return res.redirect('/transactions');
        } catch (error) {
            console.error("Error deleting record:", error);
            return res.status(500).json({ message: "Failed to delete record", error: error.message });
        }
    }

    getRecordsByPeriod = async (req, res) => {
        
    }

    getGroupedRecords = async (req, res) => {
        
    }
}

export default FinanceController;