import mongoose, { Document, Schema } from 'mongoose';

export type ProductUnit = 'KG' | 'Packet' | 'Bag' | 'Box' | 'Piece';

export interface IProduct extends Document {
  name: string;
  unit: ProductUnit;
  defaultRate: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      unique: true,
    },
    unit: {
      type: String,
      enum: ['KG', 'Packet', 'Bag', 'Box', 'Piece'],
      required: [true, 'Unit is required'],
    },
    defaultRate: {
      type: Number,
      required: [true, 'Default rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
