import express from 'express';
import jwt from 'jsonwebtoken';
import user from './user';
import trade from './trade';

const router = express.Router();
const secretKey = process.env.SECRET_KEY;

const authenticateToken = (req: any, res: any, next: any) => {
    if (req.url === '/user/signup' || req.url === '/user/signin') {
        next();
        return;
    }

    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    jwt.verify(token.split(' ')[1], secretKey, (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        req.user = user;
        next();
    });
};

router.use(authenticateToken);

router.use('/user', user);
router.use('/trade', trade);

export default router;