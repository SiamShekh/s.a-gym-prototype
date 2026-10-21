import { expensesService } from './expenses.service.js';
import { actionsService } from '../actions/actions.service.js';

export const expensesController = {
  async list(req, res) {
    const { page, limit, category, from, to } = req.query;
    const result = await expensesService.list({
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      category,
      from,
      to,
    });
    res.json({ success: true, ...result });
  },

  async create(req, res) {
    const expense = await expensesService.create(req.body, req.admin);
    await actionsService.record({
      admin: req.admin,
      type: 'create_expense',
      summary: `খরচ যোগ করেছেন: ${expense.title} (৳${expense.amount})`,
      meta: {
        expenseId: expense.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
      },
    });
    res.status(201).json({ success: true, expense });
  },

  async remove(req, res) {
    const expense = await expensesService.remove(req.params.id);
    await actionsService.record({
      admin: req.admin,
      type: 'delete_expense',
      summary: `খরচ মুছেছেন: ${expense.title}`,
      meta: { expenseId: expense.id, title: expense.title, amount: expense.amount },
    });
    res.status(204).send();
  },
};
