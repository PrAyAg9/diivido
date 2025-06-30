"use strict";
// src/routes/notification.routes.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const router = express_1.default.Router();
// Demo middleware (same as in ai.routes.ts)
const demoAuth = async (req, res, next) => {
    try {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models/user.model')));
        const firstUser = await User.findOne().limit(1);
        if (firstUser) {
            req.user = {
                id: firstUser._id.toString(),
                _id: firstUser._id,
                fullName: firstUser.fullName,
                email: firstUser.email,
            };
        }
        else {
            req.user = { id: null, fullName: 'Anonymous User' };
        }
        next();
    }
    catch (error) {
        console.error('Demo auth error:', error);
        req.user = { id: null, fullName: 'Anonymous User' };
        next();
    }
};
router.use(demoAuth);
// Notification routes
router.post('/register', notification_controller_1.default.registerDevice);
router.post('/quickdraw', notification_controller_1.default.sendQuickDrawNotification);
router.post('/nudge', notification_controller_1.default.sendNudgeNotification);
router.post('/game-result', notification_controller_1.default.sendGameResultNotification);
exports.default = router;
