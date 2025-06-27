import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  createGroup,
  getGroups,
  getGroupById,
  addMember,
} from '../controllers/group.controller';

const router = Router();

router.use(auth);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/:id/members', addMember);

export default router;
