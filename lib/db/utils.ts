import mongoose, { FilterQuery, UpdateQuery, PipelineStage, PopulateOptions, SortOrder } from 'mongoose';
import { NextResponse } from 'next/server';
import dbConnect from './mongoose';

/**
 * Type for error details
 */
export type ErrorDetails = Record<string, unknown> | mongoose.Error.ValidationError['errors'] | null;

/**
 * Type for sort options
 */
export type SortOptions = Record<string, SortOrder | { $meta: 'textScore' }>;

/**
 * Type for populate options
 */
export type PopulateOption = string | PopulateOptions | (string | PopulateOptions)[];

/**
 * Error types for database operations
 */
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  GENERAL_ERROR = 'GENERAL_ERROR'
}

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  type: DatabaseErrorType;
  statusCode: number;
  details?: ErrorDetails;

  constructor(type: DatabaseErrorType, message: string, statusCode: number = 500, details?: ErrorDetails) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Process mongoose errors and convert them to custom DatabaseError
 */
export function processMongooseError(err: unknown): DatabaseError {
  if (err instanceof DatabaseError) {
    return err;
  }

  // Validation error
  if (err instanceof mongoose.Error.ValidationError) {
    return new DatabaseError(
      DatabaseErrorType.VALIDATION_ERROR,
      'Validation error occurred',
      400,
      err.errors
    );
  }

  // Duplicate key error
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
    const duplicateKeyError = err as { code: number; keyValue?: Record<string, unknown> };
    return new DatabaseError(
      DatabaseErrorType.DUPLICATE_KEY,
      'Duplicate key error',
      409,
      duplicateKeyError.keyValue || null
    );
  }

  // Cast error (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    return new DatabaseError(
      DatabaseErrorType.VALIDATION_ERROR,
      `Invalid ${err.kind}: ${err.value}`,
      400,
      {
        path: err.path,
        value: err.value,
        kind: err.kind
      }
    );
  }

  // General error
  const errorMessage = err instanceof Error ? err.message : 'Database operation failed';
  return new DatabaseError(
    DatabaseErrorType.GENERAL_ERROR,
    errorMessage,
    500
  );
}

/**
 * Create API response for database errors
 */
export function createErrorResponse(error: Error): NextResponse {
  const dbError = error instanceof DatabaseError
    ? error
    : processMongooseError(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        type: dbError.type,
        message: dbError.message,
        details: dbError.details
      }
    },
    { status: dbError.statusCode }
  );
}

/**
 * Wrapper for database operations with automatic connection and error handling
 */
export async function withDbConnection<T>(operation: () => Promise<T>): Promise<T> {
  try {
    // Connect to the database
    await dbConnect();
    
    // Execute the operation
    return await operation();
  } catch (error) {
    console.error('Database operation error:', error);
    throw processMongooseError(error);
  }
}

/**
 * Create a new document with error handling
 */
export async function createDocument<T>(
  model: mongoose.Model<T>,
  data: Partial<T>
): Promise<T> {
  return withDbConnection(async () => {
    try {
      const document = new model(data);
      await document.save();
      return document;
    } catch (error) {
      console.error('Create document error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Find documents with error handling
 */
export async function findDocuments<T>(
  model: mongoose.Model<T>,
  filter: FilterQuery<T> = {},
  options: {
    sort?: SortOptions;
    limit?: number;
    skip?: number;
    select?: string;
    populate?: PopulateOption;
  } = {}
): Promise<T[]> {
  return withDbConnection(async () => {
    try {
      let query = model.find(filter);
      
      if (options.sort) query = query.sort(options.sort);
      if (options.limit) query = query.limit(options.limit);
      if (options.skip) query = query.skip(options.skip);
      if (options.select) query = query.select(options.select);
      if (options.populate) query = query.populate(options.populate);
      
      return await query.exec();
    } catch (error) {
      console.error('Find documents error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Find a single document by ID with error handling
 */
export async function findDocumentById<T>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId,
  options: {
    select?: string;
    populate?: PopulateOption;
  } = {}
): Promise<T> {
  return withDbConnection(async () => {
    try {
      let query = model.findById(id);
      
      if (options.select) query = query.select(options.select);
      if (options.populate) query = query.populate(options.populate);
      
      const document = await query.exec();
      
      if (!document) {
        throw new DatabaseError(
          DatabaseErrorType.NOT_FOUND,
          `Document with ID ${id} not found`,
          404
        );
      }
      
      return document;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      
      console.error('Find document by ID error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Update a document by ID with error handling
 */
export async function updateDocumentById<T>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId,
  update: UpdateQuery<T>,
  options: {
    runValidators?: boolean;
    new?: boolean;
  } = { runValidators: true, new: true }
): Promise<T> {
  return withDbConnection(async () => {
    try {
      const document = await model.findByIdAndUpdate(id, update, options);
      
      if (!document) {
        throw new DatabaseError(
          DatabaseErrorType.NOT_FOUND,
          `Document with ID ${id} not found`,
          404
        );
      }
      
      return document;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      
      console.error('Update document error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Delete a document by ID with error handling
 */
export async function deleteDocumentById<T>(
  model: mongoose.Model<T>,
  id: string | mongoose.Types.ObjectId
): Promise<T> {
  return withDbConnection(async () => {
    try {
      const document = await model.findByIdAndDelete(id);
      
      if (!document) {
        throw new DatabaseError(
          DatabaseErrorType.NOT_FOUND,
          `Document with ID ${id} not found`,
          404
        );
      }
      
      return document;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      
      console.error('Delete document error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Count documents with error handling
 */
export async function countDocuments<T>(
  model: mongoose.Model<T>,
  filter: FilterQuery<T> = {}
): Promise<number> {
  return withDbConnection(async () => {
    try {
      return await model.countDocuments(filter);
    } catch (error) {
      console.error('Count documents error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Aggregate documents with error handling
 */
export async function aggregateDocuments<T, R = unknown>(
  model: mongoose.Model<T>,
  pipeline: PipelineStage[]
): Promise<R[]> {
  return withDbConnection(async () => {
    try {
      return await model.aggregate(pipeline);
    } catch (error) {
      console.error('Aggregate documents error:', error);
      throw processMongooseError(error);
    }
  });
}

/**
 * Perform transaction with error handling
 */
export async function performTransaction<T>(
  operations: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  return withDbConnection(async () => {
    const session = await mongoose.startSession();
    let result: T;
    
    try {
      await session.withTransaction(async () => {
        result = await operations(session);
      });
      
      return result!;
    } catch (error) {
      console.error('Transaction error:', error);
      throw processMongooseError(error);
    } finally {
      await session.endSession();
    }
  });
}

/**
 * Export all models
 */
export { default as Visitor } from './models/visitor';
export { default as Host } from './models/host';
export { default as Department } from './models/department';
export { default as Visit } from './models/visit';