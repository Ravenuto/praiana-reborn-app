import { base44 } from "@/api/base44Client";
import { supabase } from "@/integrations/supabase/client";
import { sendWaitlistPromotionEmail } from "@/lib/notifications.functions";

/**
 * When a booking is cancelled, promote the first person in the waitlist
 * for that session/date into a confirmed booking and notify them.
 * Returns the promoted entry, if any.
 */
export async function promoteFromWaitlist({ session_id, session_date, session_time, class_type_name }) {
  try {
    const { data, error } = await supabase.rpc("promote_waitlist", {
      _session_id: session_id,
      _session_date: session_date,
    });
    if (error) throw error;
    const promoted = data?.[0];
    if (!promoted) return null;
    try {
      await sendWaitlistPromotionEmail({
        data: {
          bookingId: promoted.booking_id,
        },
      });
    } catch (emailError) {
      console.error("Não foi possível enviar o e-mail da fila de espera.", emailError);
    }
    return promoted;
  } catch (error) {
    console.error("Não foi possível promover a fila de espera.", error);
    return null;
  }
}
