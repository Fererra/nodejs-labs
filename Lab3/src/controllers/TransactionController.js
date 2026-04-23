import { transactionRepository } from '../repositories/transactionRepository.js';

export const getTransactions = async (req, res) => {
  try {
    const filters = {
      categoryId: req.query.category,
      startDate: req.query.start,
      endDate: req.query.end
    };

    const transactions = await transactionRepository.findAll(filters);
    
    res.render('pages/transactions', { transactions });
  } catch (err) {
    console.error('Помилка при читанні з БД:', err);
    res.status(500).send("Не вдалося завантажити транзакції");
  }
};