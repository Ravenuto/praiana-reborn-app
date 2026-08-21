import { useAuth } from "@/lib/AuthContext";

export function isTeacherUser(user) {
  return user?.role === "teacher" || user?.is_teacher === true;
}

export function isAdminUser(user) {
  return user?.role === "admin" || user?.is_admin === true;
}

/** Modo escolhido no login: "aluna" | "professor" | "admin" */
export function getLoginMode() {
  try {
    return window.localStorage.getItem("raissa_login_mode") || "";
  } catch {
    return "";
  }
}

/**
 * Professora navega como aluna (agenda, reservas, planos, perfil...),
 * mas sem créditos e sem poder reservar aulas.
 *
 * As abas de staff seguem o modo escolhido no login:
 * - aluna     -> nenhuma aba de staff
 * - professor -> só "Professora"
 * - admin     -> só "Admin"
 */
export function useRoles() {
  const { user } = useAuth();
  const isTeacher = isTeacherUser(user);
  const isAdmin = isAdminUser(user);
  const rawMode = getLoginMode();
  const mode = rawMode || (isAdmin ? "admin" : isTeacher ? "professor" : "aluna");

  return {
    user,
    isTeacher,
    isAdmin,
    isStaff: isTeacher || isAdmin,
    mode,
    /** Navegando como aluna: mostra créditos, plano e botões de reserva */
    viewAsStudent: mode === "aluna",
    showAdminTab: isAdmin && mode === "admin",
    showTeacherTab: (isTeacher || isAdmin) && mode === "professor",
  };
}

export default useRoles;
