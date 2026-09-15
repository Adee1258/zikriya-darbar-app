import mongoose, { Document, Schema } from 'mongoose';

export type LedgerType = 'OPENING_BALANCE' | 'ORDER' | 'PAYMENT';

export interface ILedgerTransaction extends Document {
  shopId: mongoose.Types.ObjectId;
  type: LedgerType;
  referenceId: mongoose.Types.ObjectId | null;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  createdBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const LedgerTransactionSchema = new Schema<ILedgerTransaction>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    type: {
      type: String,
      enum: ['OPENING_BALANCE', 'ORDER', 'PAYMENT'],
      required: true,
    },
    // referenceId points to Order._id or Payment._id
    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // ORDER → debit > 0, credit = 0
    // PAYMENT → debit = 0, credit > 0
    // OPENING_BALANCE → debit > 0, credit = 0
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Running balance AFTER this transaction
    balanceAfter: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

LedgerTransactionSchema.index({ shopId: 1, createdAt: 1 });

export default mongoose.model<ILedgerTransaction>(
  'LedgerTransaction',
  LedgerTransactionSchema
);
