import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import {
    getAllGearHandler,
    getGearByIdHandler,
    registerGearHandler
} from '../controllers/gear.controller';
import { registerGearSchema } from '../validators/gear.validator';

const router = Router();

// Todas las rutas de equipaje están protegidas
router.use(protect);

router.route('/')
    .get(getAllGearHandler)
    .post(validate(registerGearSchema), registerGearHandler);

router.route('/:id')
    .get(getGearByIdHandler);
    // PUT y DELETE se pueden añadir aquí en el futuro

export default router;
