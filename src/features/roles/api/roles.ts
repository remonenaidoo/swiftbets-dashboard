import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../../shared/lib/apiClient";

export interface RolesView {
  roles: { role: string; permissions: string[] }[];
  permissions: { name: string; allows: string }[];
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<RolesView>("/admin/roles"),
  });
}

export function useSetPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      role,
      permission,
      granted,
    }: {
      role: string;
      permission: string;
      granted: boolean;
    }) =>
      apiRequest<undefined>(`/admin/roles/${role}/permissions/${permission}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granted }),
      }),
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export async function findStaff(email: string) {
  const user = await apiRequest<{ userId: string; email: string | null }>(
    `/admin/users?email=${encodeURIComponent(email)}`,
  );
  const roles = await apiRequest<string[]>(`/admin/users/${user.userId}/roles`);
  return { ...user, roles };
}

export function useSetStaffRoles() {
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      apiRequest<undefined>(`/admin/users/${userId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      }),
  });
}
