import { Router } from 'express';
import { postUser } from '../controllers/user.controllers.js';

const router = Router();

router.post('/post', postUser);

export default Router;