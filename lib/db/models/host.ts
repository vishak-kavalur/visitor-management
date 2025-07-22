import mongoose, { Schema } from 'mongoose';
import { IHost, HostDocument, HostModel, HostRole } from '../../../types/database';

/**
 * Host Schema for MongoDB
 */
const HostSchema = new Schema<HostDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true
    // WARNING: In a production environment, ensure passwords are properly hashed
    // This is plaintext for PoC only as mentioned in requirements
  },
  fullName: { 
    type: String, 
    required: true,
    trim: true 
  },
  departmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Department', 
    default: null
  },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'Admin', 'Host'] as HostRole[], 
    required: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  versionKey: false, // Don't include __v field
});

// Add indexes for common queries
HostSchema.index({ fullName: 'text' });
HostSchema.index({ role: 1 });
HostSchema.index({ departmentId: 1 });

// Static method to find host by email
HostSchema.statics.findByEmail = async function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find hosts by department
HostSchema.statics.findByDepartment = async function(departmentId: mongoose.Types.ObjectId) {
  return this.find({ departmentId });
};

// Static method to find hosts by role
HostSchema.statics.findByRole = async function(role: HostRole) {
  return this.find({ role });
};

// Method to get host's full details (including password - use with caution)
HostSchema.methods.getFullDetails = function() {
  const host = this as HostDocument;
  return {
    _id: host._id,
    email: host.email,
    password: host.password, // WARNING: Never expose this in API responses
    fullName: host.fullName,
    departmentId: host.departmentId,
    role: host.role
  };
};

// Method to get host details without sensitive information
HostSchema.methods.getSafeDetails = function() {
  const host = this as HostDocument;
  return {
    _id: host._id,
    email: host.email,
    fullName: host.fullName,
    departmentId: host.departmentId,
    role: host.role
  };
};

// Method to check if host has admin privileges
HostSchema.methods.isAdmin = function() {
  const host = this as HostDocument;
  return host.role === 'Admin' || host.role === 'SuperAdmin';
};

// Method to check if host is a super admin
HostSchema.methods.isSuperAdmin = function() {
  const host = this as HostDocument;
  return host.role === 'SuperAdmin';
};

// Create and export the model
const Host = (mongoose.models.Host as HostModel) || 
  mongoose.model<HostDocument, HostModel>('Host', HostSchema);

export default Host;