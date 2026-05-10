class Transaction {
  constructor(id, amount, description, typeId, categoryId, dateId) {
    this.id = id;
    this.amount = amount;
    this.description = description;

    this.typeId = typeId;
    this.categoryId = categoryId;
    this.dateId = dateId;
  }
}

export { Category, OperationDate, TransactionType, Transaction };
