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

router.post('/', createGroup as any);
router.get('/', getGroups as any);
router.get('/:id', getGroupById as any);
router.post('/:id/members', addMember as any);

export default router;
