import mongoose, { Document, Schema } from 'mongoose';

export interface IShop extends Document {
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  userId: mongoose.Types.ObjectId;
  marketId: mongoose.Types.ObjectId | null;
  openingBalance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    marketId: {
      type: Schema.Types.ObjectId,
      ref: 'Market',
      default: null,
    },
    openingBalance: {
      type: Number,
      default: 0,
      min: [0, 'Opening balance cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShop>('Shop', ShopSchema);
