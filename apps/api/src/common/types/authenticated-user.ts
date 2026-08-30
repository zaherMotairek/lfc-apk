import { PermissionCode, RoleCode } from '@kop/shared';

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleCode[];
  permissions: PermissionCode[];
};
