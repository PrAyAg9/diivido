"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const authMiddleware = async (req, res, next) => {
    var _a;
    try {
        // Get token from header
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        // Check if no token
        if (!token) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from database
        const user = await user_model_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Token is not valid' });
        }
        // Set user info in request
        req.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
        };
        console.log('Authenticated user:', req.user);
        next();
    }
    catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ error: 'Token is not valid' });
    }
};
exports.authMiddleware = authMiddleware;
