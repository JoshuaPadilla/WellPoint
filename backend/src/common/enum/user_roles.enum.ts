export enum UserRoles {
  ADMIN = 'admin',
  MANAGER = 'manager', // ops lead: edits sources, approves, manages users
  STAFF = 'staff', // field editor: reads + updates sources
  VIEWER = 'viewer', // read-only citizen/barangay member
  PENDING = 'pending', // signed in via Google, no access until a role is granted
}
