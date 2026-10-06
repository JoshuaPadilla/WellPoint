export const PERMISSIONS = [
  'dashboard:read',
  'barangay:read',
  'vulnerability:read',
  'alert:read',
  'source:read',
  'report:read',
  'report:ack',
  'report:resolve',
  'demo:simulate',
  'demo:reset',
  'barangay:read:own',
  'vulnerability:read:own',
  'alert:read:own',
  'source:read:own',
  'report:read:own',
  'report:create',
  'status:read:public',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
