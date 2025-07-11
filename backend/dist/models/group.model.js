"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const groupSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    avatarUrl: String,
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [
        {
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            role: {
                type: String,
                enum: ['admin', 'member'],
                default: 'member',
            },
            joinedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    budget: {
        totalAmount: {
            type: Number,
            required: false,
        },
        currency: {
            type: String,
            default: 'USD',
        },
        description: String,
        setBy: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
        setAt: {
            type: Date,
            default: Date.now,
        },
        lastAlertSent: {
            percentage: Number,
            sentAt: Date,
        },
    },
}, {
    timestamps: true,
});
exports.Group = mongoose_1.default.model('Group', groupSchema);
