export enum UserRoles {
  ADMIN = 'admin',
  LGU = 'lgu', // ops lead: edits sources, approves, manages users
  WATER_OFFICER = 'water_officer', // field editor: reads + updates sources
  USER = 'user', // read-only citizen/barangay member
  DRRM = 'drrm', // read-only citizen/barangay member
}
