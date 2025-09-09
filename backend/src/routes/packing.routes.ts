import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
    createPackingListHandler,
    getPackingListHandler,
    getPackingListsHandler,
    patchPackingListHandler,
} from '../controllers/packing.controller';
import validate from '../middleware/validate.middleware';
import { createPackingListSchema, patchPackingListSchema } from '../validators/packing.validator';

const router = Router();

// Todas las rutas de listas de empaque están protegidas
router.use(protect);

router.route('/')
    .get(getPackingListsHandler)
    .post(validate(createPackingListSchema), createPackingListHandler);

router.route('/:id')
    .get(getPackingListHandler)
    .patch(validate(patchPackingListSchema), patchPackingListHandler);

export default router;
