"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const auth = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            throw new Error();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_model_1.User.findById(decoded.userId);
        if (!user) {
            throw new Error();
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};
exports.auth = auth;
