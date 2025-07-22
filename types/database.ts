import { Document, Model, Types } from 'mongoose';

/**
 * Role type for host users
 */
export type HostRole = 'SuperAdmin' | 'Admin' | 'Host';

/**
 * Visit status type
 */
export type VisitStatus = 'Pending' | 'Approved' | 'Rejected' | 'CheckedIn' | 'CheckedOut';

/**
 * Visitor interface without MongoDB specific fields
 */
export interface IVisitor {
  aadhaarNumber: string;
  fullName: string;
  imageBase64: string;
  firstVisit: Date;
  lastVisit?: Date;
  createdTime: Date;
}

/**
 * Host interface without MongoDB specific fields
 */
export interface IHost {
  email: string;
  password: string;
  fullName: string;
  departmentId: Types.ObjectId | null;
  role: HostRole;
}

/**
 * Department interface without MongoDB specific fields
 */
export interface IDepartment {
  name: string;
  description?: string;
  floor?: string;
  building?: string;
}

/**
 * Approval details interface
 */
export interface IApproval {
  approvedBy?: Types.ObjectId;
  timestamp?: Date;
}

/**
 * Visit interface without MongoDB specific fields
 */
export interface IVisit {
  status: VisitStatus;
  visitorId: Types.ObjectId;
  hostId: Types.ObjectId;
  departmentId: Types.ObjectId;
  purposeOfVisit: string;
  submissionTimestamp: Date;
  approval?: IApproval;
  checkInTimestamp?: Date;
  checkOutTimestamp?: Date;
}

/**
 * Notification interface without MongoDB specific fields
 */
export interface INotification {
  recipientId: Types.ObjectId;
  recipientType: 'Host' | 'Visitor';
  message: string;
  isRead: boolean;
  relatedVisitId?: Types.ObjectId;
  createdAt: Date;
}

/**
 * Mongoose document types - extends both the interface and Document
 * Uses type intersection to avoid _id conflict
 */
export type VisitorDocument = Document & IVisitor;
export type HostDocument = Document & IHost;
export type DepartmentDocument = Document & IDepartment;
export type VisitDocument = Document & IVisit;
export type NotificationDocument = Document & INotification;

/**
 * Mongoose model types with static methods
 */
// Using type for models that don't have additional methods to avoid linting errors
export type VisitorModel = Model<VisitorDocument> & {
  findByAadhaar?(aadhaarNumber: string): Promise<VisitorDocument | null>;
};

export interface HostModel extends Model<HostDocument> {
  findByEmail(email: string): Promise<HostDocument | null>;
  findByDepartment(departmentId: Types.ObjectId): Promise<HostDocument[]>;
  findByRole(role: HostRole): Promise<HostDocument[]>;
}

export type DepartmentModel = Model<DepartmentDocument> & {
  findByName?(name: string): Promise<DepartmentDocument | null>;
};

export type VisitModel = Model<VisitDocument> & {
  findPendingVisits?(departmentId?: Types.ObjectId): Promise<VisitDocument[]>;
};

export type NotificationModel = Model<NotificationDocument> & {
  findUnreadByRecipient?(recipientId: Types.ObjectId): Promise<NotificationDocument[]>;
};

/**
 * Document with ID type helper
 * For use in API responses where we need the _id field
 */
export type WithId<T> = T & { _id: Types.ObjectId };