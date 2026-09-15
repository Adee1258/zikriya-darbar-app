import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  shopId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  total: number;
  status: 'confirmed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      required: true,
    },
    // Rate is FROZEN at time of order — never changes even if product rate changes
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: 'Order must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast shop-based queries
OrderSchema.index({ shopId: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
