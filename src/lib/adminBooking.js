import { base44 } from "@/api/base44Client";
import { promoteFromWaitlist } from "@/lib/waitlist";
import { getCredits } from "@/utils";

const active = (booking) => booking.status !== "cancelada";

export async function addManualBooking({ session, date, student, guestName, guestType }) {
  const existing = await base44.entities.Booking.filter({
    session_id: session.id,
    session_date: date,
  });
  const activeBookings = existing.filter(active);
  if (activeBookings.length >= (Number(session.max_students) || 8))
    throw new Error("Esta aula está lotada.");

  let studentName;
  let studentEmail;
  let creditDebited = false;
  if (student) {
    studentName = student.full_name || student.email;
    studentEmail = student.email;
    if (
      activeBookings.some(
        (booking) => booking.student_email?.toLowerCase() === studentEmail?.toLowerCase(),
      )
    ) {
      throw new Error("Esta aluna já está nesta aula.");
    }
    const latest = await base44.entities.User.get(student.id);
    if (!latest || !latest.is_active) throw new Error("Aluna não encontrada ou inativa.");
    if (latest.role !== "admin") {
      if (getCredits(latest) < 1) throw new Error("Esta aluna não tem créditos disponíveis.");
      creditDebited = true;
    }
  } else {
    studentName = guestName?.trim();
    if (!studentName) throw new Error("Informe o nome da participante.");
    if (!["experimental", "avulsa"].includes(guestType))
      throw new Error("Escolha Experimental ou Avulsa.");
    studentEmail = `convidada-${crypto.randomUUID()}@participante.invalid`;
  }

  const booking = await base44.entities.Booking.create({
    session_id: session.id,
    session_date: date,
    session_time: session.time,
    class_type_name: session.class_type_name,
    student_name: studentName,
    student_email: studentEmail,
    guest_type: student ? null : guestType,
    credit_debited: creditDebited,
    status: "confirmada",
  });
  return booking;
}

export async function removeManualBooking(booking) {
  if (!active(booking)) throw new Error("Esta participante já foi retirada.");
  await base44.entities.Booking.update(booking.id, { status: "cancelada" });
  await promoteFromWaitlist({
    session_id: booking.session_id,
    session_date: booking.session_date,
    cancelled_booking_id: booking.id,
  });
}

export function invalidateManualBookings(queryClient) {
  for (const key of [
    "bookings",
    "adminBookingsAtt",
    "adminBookingsPeriod",
    "activeStudentsForAttendance",
    "userCredits",
    "myBookings",
    "myAllBookings",
    "myProfile",
    "allWaitlist",
    "myWaitlist",
    "adminSessionWaitlist",
  ]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
