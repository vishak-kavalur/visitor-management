/**
 * Models index file - exports all models from a single location
 * This makes it easier to import models throughout the application
 */

export { default as Visitor } from './visitor';
export { default as Host } from './host';
export { default as Department } from './department';
export { default as Visit } from './visit';

// Re-export types from the database types file
export * from '../../../types/database';