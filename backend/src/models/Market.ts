import mongoose, { Document, Schema } from 'mongoose';

export type VisitDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'
  | 'None';

export interface IMarket extends Document {
  name: string;
  visitDay: VisitDay;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MarketSchema = new Schema<IMarket>(
  {
    name: {
      type: String,
      required: [true, 'Market name is required'],
      trim: true,
      unique: true,
    },
    visitDay: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'None'],
      default: 'None',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMarket>('Market', MarketSchema);