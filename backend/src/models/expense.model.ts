import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  groupId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: mongoose.Types.ObjectId;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  receiptUrl?: string;
  date: Date;
  splits: {
    userId: mongoose.Types.ObjectId;
    amount: number;
    percentage?: number;
    shares?: number;
    paid: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    category: {
      type: String,
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      default: 'equal',
    },
    receiptUrl: String,
    date: {
      type: Date,
      default: Date.now,
    },
    splits: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        shares: {
          type: Number,
          min: 1,
        },
        paid: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
