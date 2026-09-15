import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Other';

export interface IPayment extends Document {
  shopId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Other'],
      required: [true, 'Payment method is required'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
