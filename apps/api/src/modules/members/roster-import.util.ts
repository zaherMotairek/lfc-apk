import { BadRequestException } from '@nestjs/common';
import { normalizeMemberId, normalizePhoneNumber, splitFullName } from '../../common/utils/member-identity';

export type RosterImportRow = {
  olscId: string;
  lfcId: string | null;
  fullName: string;
  phoneNumber: string | null;
  rawStatus: string | null;
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function detectDelimiter(headerLine: string) {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  if (tabs >= commas && tabs >= semis) {
    return '\t';
  }
  if (semis > commas) {
    return ';';
  }
  return ',';
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function mapHeaderIndexes(headers: string[]) {
  const normalized = headers.map(normalizeHeader);
  const find = (...candidates: string[]) =>
    normalized.findIndex((header) => candidates.some((candidate) => header === candidate || header.includes(candidate)));

  return {
    olscId: find('olsc id', 'olsc', 'official member id', 'member id'),
    lfcId: find('allred support id', 'allred', 'lfc id', 'lfc'),
    name: find('name', 'full name', 'member name'),
    phone: find('phone number', 'phone', 'mobile'),
    status: find('status'),
  };
}

export function parseOfficialMembersCsv(content: string): RosterImportRow[] {
  const text = content.replace(/^\uFEFF/, '').trim();
  if (!text) {
    throw new BadRequestException('Uploaded file is empty');
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new BadRequestException('File must include a header row and at least one member');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const indexes = mapHeaderIndexes(headers);

  if (indexes.olscId < 0 || indexes.name < 0) {
    throw new BadRequestException(
      'CSV/Excel export must include at least OLSC ID and Name columns',
    );
  }

  const rows: RosterImportRow[] = [];

  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line, delimiter);
    const olscId = normalizeMemberId(values[indexes.olscId]);
    const fullName = (values[indexes.name] ?? '').trim();
    if (!olscId || !fullName) {
      continue;
    }

    rows.push({
      olscId,
      lfcId: indexes.lfcId >= 0 ? normalizeMemberId(values[indexes.lfcId]) : null,
      fullName,
      phoneNumber: indexes.phone >= 0 ? normalizePhoneNumber(values[indexes.phone]) : null,
      rawStatus: indexes.status >= 0 ? (values[indexes.status] ?? '').trim() || null : null,
    });
  }

  if (!rows.length) {
    throw new BadRequestException('No valid member rows found in file');
  }

  return rows;
}

export function guessNamesFromRoster(fullName: string) {
  return splitFullName(fullName);
}
