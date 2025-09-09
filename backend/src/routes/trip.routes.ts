// Archivo: src/routes/trip.routes.ts
// Propósito: Define las rutas para las operaciones CRUD de viajes.

import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';
import { 
    createTripHandler,
    deleteTripHandler,
    getAllTripsHandler,
    getTripByIdHandler,
    shareTripHandler,
    updateTripHandler,
    getTripMembersHandler,
    updateMemberRoleHandler,
    removeMemberHandler,
    acceptInvitationHandler,
    rejectInvitationHandler,
    cancelInvitationHandler,
    uploadTripImageHandler,
    deleteTripImageHandler
} from '../controllers/trip.controller';
import { createTripSchema, updateTripSchema, shareTripSchema } from '../validators/trip.validator';
import { uploadTripImage } from '../config/multer';

const router = Router();

// Todas las rutas de viajes están protegidas y requieren autenticación
router.use(protect);

router.route('/')
    .get(getAllTripsHandler)
    .post(validate(createTripSchema), createTripHandler);

router.route('/:id')
    .get(getTripByIdHandler)
    .put(validate(updateTripSchema), updateTripHandler)
    .delete(deleteTripHandler);
    
router.post('/:id/share', validate(shareTripSchema), shareTripHandler);
router.get('/:id/members', getTripMembersHandler);
router.patch('/:id/members/:memberId/role', updateMemberRoleHandler);
router.delete('/:id/members/:memberId', removeMemberHandler);

// Invitation management routes
router.post('/invitations/:invitationId/accept', acceptInvitationHandler);
router.post('/invitations/:invitationId/reject', rejectInvitationHandler);
router.delete('/invitations/:invitationId', cancelInvitationHandler);

// Image upload routes
router.post('/:id/image', uploadTripImage.single('image'), uploadTripImageHandler);
router.delete('/:id/image', deleteTripImageHandler);

export default router;
