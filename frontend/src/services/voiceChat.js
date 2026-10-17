// Handles one chat turn, including transcript, tool visibility, and guarded speech.
import { CALL_STATUS } from "../constants/callStatus";
import { sendChatMessage } from "./api";
import { speakText } from "./speech";

export async function sendVoiceMessage(
  text,
  sessionId,
  { refs, setCallStatus, setError, addMessage, startRecognition }
) {
  if (!refs.active.current || refs.busy.current || sessionId !== refs.sessionId.current) return;
  refs.busy.current = true;
  setCallStatus(CALL_STATUS.THINKING);
  setError("");
  addMessage("You", text);

  try {
    const result = await sendChatMessage(text, refs.history.current);
    if (sessionId !== refs.sessionId.current || !refs.active.current) return;
    refs.history.current = [
      ...refs.history.current,
      { role: "user", parts: [{ text }] },
      { role: "model", parts: [{ text: result.reply }] },
    ].slice(-20);

    if (result.toolUsed && result.toolName === "get_order_details") {
      const orderId = result.toolInput?.order_id || "unknown order";
      addMessage(
        "tool",
        result.toolResult?.found ? `Looked up ${orderId}` : `No order found for ${orderId}`
      );
    }

    addMessage("Aria", result.reply);
    setCallStatus(CALL_STATUS.SPEAKING);
    await speakText(result.reply, () => sessionId === refs.sessionId.current);
  } catch (requestError) {
    if (sessionId !== refs.sessionId.current || !refs.active.current) return;
    const message =
      requestError.message || "Unable to reach Aria. Please check the backend server.";
    setError(message);
    addMessage("System", message);
  } finally {
    if (sessionId === refs.sessionId.current) {
      refs.busy.current = false;
      if (refs.active.current) startRecognition(sessionId);
    }
  }
}
