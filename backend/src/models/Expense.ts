import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory =
  | 'Petrol'
  | 'Loading'
  | 'Food'
  | 'Repair'
  | 'Salary'
  | 'Rent'
  | 'Utility'
  | 'Other';

export interface IExpense extends Document {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: Date;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    category: {
      type: String,
      enum: ['Petrol', 'Loading', 'Food', 'Repair', 'Salary', 'Rent', 'Utility', 'Other'],
      default: 'Other',
    },
    // The actual date of the expense (can be backdated)
    date: {
      type: Date,
      required: [true, 'Date is required'],
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

// Index for fast date-range queries
ExpenseSchema.index({ date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
