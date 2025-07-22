import mongoose, { Schema } from 'mongoose';
import { IVisitor, VisitorDocument, VisitorModel } from '../../../types/database';

/**
 * Visitor Schema for MongoDB
 */
const VisitorSchema = new Schema<VisitorDocument>({
  aadhaarNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true,
    trim: true 
  },
  fullName: { 
    type: String, 
    required: true,
    trim: true 
  },
  imageBase64: { 
    type: String, 
    required: true 
  },
  firstVisit: { 
    type: Date, 
    default: Date.now 
  },
  lastVisit: { 
    type: Date
  },
  createdTime: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  versionKey: false, // Don't include __v field
});

// Add indexes for common queries
VisitorSchema.index({ fullName: 'text' });
VisitorSchema.index({ createdTime: -1 });
VisitorSchema.index({ lastVisit: -1 });

// Pre-save hook to update lastVisit on subsequent visits
VisitorSchema.pre('save', function(next) {
  const visitor = this as VisitorDocument;
  
  // If this is not a new document, update lastVisit
  if (!visitor.isNew) {
    visitor.lastVisit = new Date();
  }
  
  next();
});

// Method to get visitor's full details
VisitorSchema.methods.getFullDetails = function() {
  const visitor = this as VisitorDocument;
  return {
    _id: visitor._id,
    aadhaarNumber: visitor.aadhaarNumber,
    fullName: visitor.fullName,
    imageBase64: visitor.imageBase64,
    firstVisit: visitor.firstVisit,
    lastVisit: visitor.lastVisit,
    createdTime: visitor.createdTime
  };
};

// Method to get visitor details without sensitive information
VisitorSchema.methods.getSafeDetails = function() {
  const visitor = this as VisitorDocument;
  return {
    _id: visitor._id,
    fullName: visitor.fullName,
    firstVisit: visitor.firstVisit,
    lastVisit: visitor.lastVisit
  };
};

// Create and export the model
const Visitor = (mongoose.models.Visitor as VisitorModel) || 
  mongoose.model<VisitorDocument, VisitorModel>('Visitor', VisitorSchema);

export default Visitor;