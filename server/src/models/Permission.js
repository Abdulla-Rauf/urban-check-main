import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    module: {
      type: String,
      required: [true, 'Module designation is required'],
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Permission = mongoose.model('Permission', permissionSchema);
