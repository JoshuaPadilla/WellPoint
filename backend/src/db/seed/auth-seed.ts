import { UserRoles } from '../../common/enum/user_roles.enum';

export interface DemoAccount {
  email: string;
  name: string;
  role: UserRoles;
  barangayPsgc: string | null;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'water.officer@wellpoint.demo',
    name: 'Maria Santos',
    role: UserRoles.WATER_OFFICER,
    barangayPsgc: null,
  },
  {
    email: 'drrm.officer@wellpoint.demo',
    name: 'Jose Ramirez',
    role: UserRoles.DRRM_OFFICER,
    barangayPsgc: null,
  },
  {
    email: 'barangay.official@wellpoint.demo',
    name: 'Luz Villanueva',
    role: UserRoles.BARANGAY_OFFICIAL,
    barangayPsgc: '0806005051',
  },
  {
    email: 'resident@wellpoint.demo',
    name: 'Ana Cruz',
    role: UserRoles.RESIDENT,
    barangayPsgc: '0806005014',
  },
];
