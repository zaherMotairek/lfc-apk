export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevTokenExposureAllowed(): boolean {
  return !isProduction();
}

export function requireSecret(value: string | undefined, name: string): string {
  if (!value || value.includes('change-me')) {
    if (isProduction()) {
      throw new Error(`${name} must be set to a strong unique value in production.`);
    }
    return value ?? `dev-${name.toLowerCase().replace(/_/g, '-')}`;
  }
  return value;
}
