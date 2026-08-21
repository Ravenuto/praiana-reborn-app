import { useAuth } from "@/lib/AuthContext";

export function isTeacherUser(user) {
  return user?.role === "teacher" || user?.is_teacher === true;
}

export function isAdminUser(user) {
  return user?.role === "admin" || user?.is_admin === true;
}

/**
 * Professora navega como aluna (agenda, reservas, planos, perfil...),
 * mas sem créditos e sem poder reservar aulas.
 */
export function useRoles() {
  const { user } = useAuth();
  const isTeacher = isTeacherUser(user);
  const isAdmin = isAdminUser(user);
  return { user, isTeacher, isAdmin, isStaff: isTeacher || isAdmin };
}

export default useRoles;
