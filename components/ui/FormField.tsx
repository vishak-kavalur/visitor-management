'use client';

import React from 'react';
import { 
  TextField, 
  TextFieldProps, 
  FormControl, 
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  SelectProps,
  FormControlLabel,
  Checkbox,
  CheckboxProps,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Controller, ControllerProps, FieldPath, FieldValues } from 'react-hook-form';

// Base props for all field types
interface BaseFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control: ControllerProps<TFieldValues, TName>['control'];
  label?: string;
  helperText?: string;
  loading?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}

// Text field props
interface TextFieldComponentProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFieldProps<TFieldValues, TName> {
  type?: TextFieldProps['type'];
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

// Select field props
interface SelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFieldProps<TFieldValues, TName> {
  options: { value: string | number; label: string }[];
  multiple?: boolean;
}

// Checkbox field props
interface CheckboxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFieldProps<TFieldValues, TName> {
  checkboxLabel?: string;
}

/**
 * Text input field with validation integration
 */
export function FormTextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  helperText,
  loading = false,
  required = false,
  fullWidth = true,
  disabled = false,
  type = 'text',
  multiline = false,
  rows,
  placeholder,
  startAdornment,
  endAdornment,
  ...rest
}: TextFieldComponentProps<TFieldValues, TName> & Omit<TextFieldProps, 'name' | 'control' | 'fullWidth'>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          id={`field-${name}`}
          label={label}
          variant="outlined"
          fullWidth={fullWidth}
          type={type}
          multiline={multiline}
          rows={rows}
          error={!!error}
          helperText={error ? error.message : helperText}
          disabled={disabled || loading}
          required={required}
          placeholder={placeholder}
          InputProps={{
            startAdornment: startAdornment ? (
              <InputAdornment position="start">{startAdornment}</InputAdornment>
            ) : undefined,
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : endAdornment ? (
              <InputAdornment position="end">{endAdornment}</InputAdornment>
            ) : undefined,
          }}
          {...rest}
        />
      )}
    />
  );
}

/**
 * Select field with validation integration
 */
export function FormSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  helperText,
  options,
  loading = false,
  required = false,
  fullWidth = true,
  disabled = false,
  multiple = false,
  ...rest
}: SelectFieldProps<TFieldValues, TName> & Omit<SelectProps, 'name' | 'control' | 'fullWidth'>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl 
          fullWidth={fullWidth} 
          error={!!error} 
          disabled={disabled || loading}
          required={required}
        >
          <InputLabel id={`select-label-${name}`}>{label}</InputLabel>
          <Select
            {...field}
            labelId={`select-label-${name}`}
            id={`select-${name}`}
            label={label}
            multiple={multiple}
            endAdornment={loading ? <CircularProgress size={20} /> : null}
            {...rest}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{error ? error.message : helperText}</FormHelperText>
        </FormControl>
      )}
    />
  );
}

/**
 * Checkbox field with validation integration
 */
export function FormCheckboxField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  checkboxLabel,
  helperText,
  loading = false,
  required = false,
  disabled = false,
  ...rest
}: CheckboxFieldProps<TFieldValues, TName> & Omit<CheckboxProps, 'name' | 'control'>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl error={!!error} required={required}>
          {label && <InputLabel shrink>{label}</InputLabel>}
          <FormControlLabel
            control={
              <Checkbox
                {...field}
                id={`checkbox-${name}`}
                checked={field.value}
                disabled={disabled || loading}
                {...rest}
              />
            }
            label={checkboxLabel || ''}
          />
          {(error || helperText) && (
            <FormHelperText>{error ? error.message : helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}