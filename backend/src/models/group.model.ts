import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description?: string;
  avatarUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  members: {
    userId: mongoose.Types.ObjectId;
    role: 'admin' | 'member';
    joinedAt: Date;
  }[];
  budget?: {
    totalAmount: number;
    currency: string;
    description?: string;
    setBy: mongoose.Types.ObjectId;
    setAt: Date;
    lastAlertSent?: {
      percentage: number;
      sentAt: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    avatarUrl: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

export const Group = mongoose.model<IGroup>('Group', groupSchema);
