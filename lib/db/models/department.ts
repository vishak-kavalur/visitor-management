import mongoose, { Schema } from 'mongoose';
import { IDepartment, DepartmentDocument, DepartmentModel } from '../../../types/database';

/**
 * Department Schema for MongoDB
 */
const DepartmentSchema = new Schema<DepartmentDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  floor: {
    type: String,
    trim: true
  },
  building: {
    type: String,
    trim: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  versionKey: false, // Don't include __v field
});

// Add text index for name field for text search capabilities
DepartmentSchema.index({ name: 'text' });

// Static method to find department by name
DepartmentSchema.statics.findByName = async function(name: string) {
  return this.findOne({ name: new RegExp(`^${name}$`, 'i') }); // Case-insensitive exact match
};

// Static method to get all departments sorted by name
DepartmentSchema.statics.getAllSorted = async function() {
  return this.find().sort({ name: 1 });
};

// Static method to check if a department has associated hosts
DepartmentSchema.statics.hasHosts = async function(departmentId: mongoose.Types.ObjectId) {
  const Host = mongoose.model('Host');
  const hostCount = await Host.countDocuments({ departmentId });
  return hostCount > 0;
};

// Static method to check if a department has associated visits
DepartmentSchema.statics.hasVisits = async function(departmentId: mongoose.Types.ObjectId) {
  const Visit = mongoose.model('Visit');
  const visitCount = await Visit.countDocuments({ departmentId });
  return visitCount > 0;
};

// Method to get basic details
DepartmentSchema.methods.getDetails = function() {
  const department = this as DepartmentDocument;
  return {
    _id: department._id,
    name: department.name,
    description: department.description,
    floor: department.floor,
    building: department.building
  };
};

// Create and export the model
const Department = (mongoose.models.Department as DepartmentModel) || 
  mongoose.model<DepartmentDocument, DepartmentModel>('Department', DepartmentSchema);

export default Department;