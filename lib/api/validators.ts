import { NextRequest } from 'next/server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const toIsoDate = (value: Date): string => value.toISOString().split('T')[0];

const ensureDateComponents = (value: string): void => {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error('Date contains invalid numbers');
  }
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error('Date must be a real calendar day');
  }
};

export const parseJsonBody = async (request: NextRequest): Promise<Record<string, unknown>> => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON payload');
  }
};

export const normalizeUuid = (value: unknown, fieldName = 'userId'): string => {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} is required and must be a valid UUID`);
  }
  return value;
};

export const normalizeMonth = (value: unknown, fieldName = 'month'): string => {
  if (typeof value !== 'string' || !MONTH_PATTERN.test(value)) {
    throw new Error(`${fieldName} is required and must use the YYYY-MM format`);
  }
  return value;
};

export const normalizeDate = (value: unknown, fieldName = 'date'): string => {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${fieldName} is required and must use the YYYY-MM-DD format`);
  }
  ensureDateComponents(value);
  return value;
};

export const normalizeStringField = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
};

export const normalizeNumberField = (value: unknown, fieldName: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${fieldName} is required and must be a number`);
  }
  return value;
};

export const normalizeOptionalDate = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    throw new Error(`${fieldName} must use the YYYY-MM-DD format`);
  }
  ensureDateComponents(value);
  return value;
};

export const normalizeOptionalMonth = (value: unknown, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !MONTH_PATTERN.test(value)) {
    throw new Error(`${fieldName} must use the YYYY-MM format`);
  }
  return value;
};

export const normalizePeriod = (value: unknown, fieldName = 'period'): 'MONTHLY' | 'ROLLING' | 'MULTI' => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} is required and must be a string`);
  }
  if (value !== 'MONTHLY' && value !== 'ROLLING' && value !== 'MULTI') {
    throw new Error(`${fieldName} must be one of: MONTHLY, ROLLING, MULTI`);
  }
  return value;
};

export const buildMonthBounds = (month: string): { start: string; end: string } => {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
  };
};
