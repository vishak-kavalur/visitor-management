import mongoose, { Schema } from 'mongoose';
import { IVisit, VisitDocument, VisitModel, VisitStatus } from '../../../types/database';

/**
 * Visit Schema for MongoDB
 */
const VisitSchema = new Schema<VisitDocument>({
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut'] as VisitStatus[], 
    default: 'Pending',
    index: true
  },
  visitorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Visitor', 
    required: true,
    index: true
  },
  hostId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Host', 
    required: true,
    index: true
  },
  departmentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Department', 
    required: true,
    index: true
  },
  purposeOfVisit: { 
    type: String, 
    required: true,
    trim: true
  },
  submissionTimestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  approval: {
    approvedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Host' 
    },
    timestamp: { 
      type: Date 
    }
  },
  checkInTimestamp: { 
    type: Date,
    index: true
  },
  checkOutTimestamp: { 
    type: Date,
    index: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
  versionKey: false, // Don't include __v field
});

// Compound indexes for common queries
VisitSchema.index({ status: 1, submissionTimestamp: -1 });
VisitSchema.index({ hostId: 1, status: 1 });
VisitSchema.index({ departmentId: 1, status: 1 });
VisitSchema.index({ visitorId: 1, status: 1 });

// Static method to find pending visits for a host
VisitSchema.statics.findPendingByHost = async function(hostId: mongoose.Types.ObjectId) {
  return this.find({ hostId, status: 'Pending' })
    .sort({ submissionTimestamp: 1 })
    .populate('visitorId')
    .populate('departmentId');
};

// Static method to find today's visits
VisitSchema.statics.findTodayVisits = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    $or: [
      { checkInTimestamp: { $gte: today, $lt: tomorrow } },
      { status: 'Approved', submissionTimestamp: { $gte: today, $lt: tomorrow } }
    ]
  })
    .populate('visitorId')
    .populate('hostId')
    .populate('departmentId')
    .sort({ submissionTimestamp: 1 });
};

// Static method to find visits by status
VisitSchema.statics.findByStatus = async function(status: VisitStatus) {
  return this.find({ status })
    .populate('visitorId')
    .populate('hostId')
    .populate('departmentId')
    .sort({ submissionTimestamp: -1 });
};

// Static method to find visits by visitor
VisitSchema.statics.findByVisitor = async function(visitorId: mongoose.Types.ObjectId) {
  return this.find({ visitorId })
    .populate('hostId')
    .populate('departmentId')
    .sort({ submissionTimestamp: -1 });
};

// Static method to find visits by department
VisitSchema.statics.findByDepartment = async function(departmentId: mongoose.Types.ObjectId) {
  return this.find({ departmentId })
    .populate('visitorId')
    .populate('hostId')
    .sort({ submissionTimestamp: -1 });
};

// Method to approve a visit
VisitSchema.methods.approve = async function(approvedBy: mongoose.Types.ObjectId) {
  const visit = this as VisitDocument;
  visit.status = 'Approved';
  visit.approval = {
    approvedBy,
    timestamp: new Date()
  };
  return visit.save();
};

// Method to reject a visit
VisitSchema.methods.reject = async function(approvedBy: mongoose.Types.ObjectId) {
  const visit = this as VisitDocument;
  visit.status = 'Rejected';
  visit.approval = {
    approvedBy,
    timestamp: new Date()
  };
  return visit.save();
};

// Method to check in a visitor
VisitSchema.methods.checkIn = async function() {
  const visit = this as VisitDocument;
  
  // Can only check in if the visit is approved
  if (visit.status !== 'Approved') {
    throw new Error('Visit must be approved before check-in');
  }
  
  visit.status = 'CheckedIn';
  visit.checkInTimestamp = new Date();
  
  // Update the visitor's last visit time
  const Visitor = mongoose.model('Visitor');
  await Visitor.findByIdAndUpdate(visit.visitorId, { 
    lastVisit: new Date() 
  });
  
  return visit.save();
};

// Method to check out a visitor
VisitSchema.methods.checkOut = async function() {
  const visit = this as VisitDocument;
  
  // Can only check out if the visit is checked in
  if (visit.status !== 'CheckedIn') {
    throw new Error('Visit must be checked in before check-out');
  }
  
  visit.status = 'CheckedOut';
  visit.checkOutTimestamp = new Date();
  return visit.save();
};

// Method to get full visit details
VisitSchema.methods.getDetails = function() {
  const visit = this as VisitDocument;
  return {
    _id: visit._id,
    status: visit.status,
    visitorId: visit.visitorId,
    hostId: visit.hostId,
    departmentId: visit.departmentId,
    purposeOfVisit: visit.purposeOfVisit,
    submissionTimestamp: visit.submissionTimestamp,
    approval: visit.approval,
    checkInTimestamp: visit.checkInTimestamp,
    checkOutTimestamp: visit.checkOutTimestamp
  };
};

// Create and export the model
const Visit = (mongoose.models.Visit as VisitModel) || 
  mongoose.model<VisitDocument, VisitModel>('Visit', VisitSchema);

export default Visit;