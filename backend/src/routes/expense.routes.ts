import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    createExpenseHandler,
    deleteExpenseHandler,
    getExpensesHandler,
    updateExpenseHandler
} from '../controllers/expense.controller';
import validate from '../middleware/validate.middleware';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expense.validator';

const router = Router();

// Todas las rutas de gastos están protegidas
router.use(protect);

router.route('/')
    .get(getExpensesHandler)
    .post(validate(createExpenseSchema), createExpenseHandler);

router.route('/:id')
    .put(validate(updateExpenseSchema), updateExpenseHandler)
    .delete(deleteExpenseHandler);

export default router;
