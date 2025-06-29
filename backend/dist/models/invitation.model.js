"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invitation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const invitationSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    invitedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    groupId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Group',
        required: false, // Can be null for general app invitations
    },
    groupName: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending',
    },
    invitationToken: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
}, {
    timestamps: true,
});
// Index for efficient queries
invitationSchema.index({ email: 1 });
invitationSchema.index({ invitationToken: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.Invitation = mongoose_1.default.model('Invitation', invitationSchema);
