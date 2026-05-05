/**
 * Клас для опису фінансової транзакції (витрати чи надходження)
 */
class Transaction {
  /**
   * @param {string} id - Унікальний ідентифікатор
   * @param {'income' | 'expense'} type - Тип: надходження або витрата
   * @param {number} amount - Сума
   * @param {string} purchase - Назва покупки / опис надходження
   * @param {string} category - Категорія
   * @param {string} date - Дата у форматі YYYY-MM-DD
   */
  constructor(id, type, amount, purchase, category, date) {
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.purchase = purchase;
    this.category = category;
    this.date = date;
  }
}

export default Transaction;
