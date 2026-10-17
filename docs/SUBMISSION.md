# Submission Pack

## Approach note

The browser handles microphone permission, Web Speech API recognition and speech synthesis, while an Express backend keeps the Gemini credential and order lookup logic server-side. Gemini function calling requests a read-only order lookup, and backend code computes return and cancellation eligibility from the configured policies before sending verified order data back to Gemini. A separate post-call summary endpoint validates structured model output and provides a deterministic fallback when the returned JSON is invalid.

## Email draft

**To:** ozair.shaikh@datastraw.in; aryan.jaiswal@datastraw.in  
**CC:** talent@datastraw.in  
**Subject:** AI Voice Agent Assignment - Altaf Shaikh

Hello,

Please find my AI Voice Agent assignment submission below.

- **Application URL:** https://aura-voice-agent-topaz.vercel.app/
- **GitHub Repository:** https://github.com/altafshaikh7/aura-voice-agent
- **Demo Video Link:** https://drive.google.com/file/d/1BEj39UNuxErzuE_qs17EI5IJ32GmKvLV/view?usp=sharing
- **LinkedIn Profile Link:** [LinkedIn Profile Link]

**Approach:** The browser handles microphone permission, Web Speech API recognition and speech synthesis, while an Express backend keeps the Gemini credential and order lookup logic server-side. Gemini function calling requests a read-only order lookup, and backend code computes return and cancellation eligibility from the configured policies before sending verified order data back to Gemini. A separate post-call summary endpoint validates structured model output and provides a deterministic fallback when the returned JSON is invalid.

Regards,  
[Your Full Name]

## Demo video script

Target length: approximately 4 minutes 30 seconds. Use the deployed HTTPS site in desktop Chrome or Edge, and grant microphone access before recording.

| Time      | Demonstration and exact phrase                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00-0:20 | Introduce the project: “This is Aria, a browser-based Aura Skincare voice support assistant. I’ll demonstrate verified order lookup, policy-based answers, cancellation eligibility, and the structured call summary.”                                                                                                                                                                                                                                 |
| 0:20-0:55 | Start the call, allow microphone access, wait for the greeting and listening status, then say: **“Where is ORD-101?”** Show the transcript, the order lookup tool chip, Aria's spoken answer, and the `Out for Delivery` details.                                                                                                                                                                                                                      |
| 0:55-1:35 | Ask: **“Can I return ORD-102?”** Show the response that the order was delivered 14 days ago and the return window is 7 days. Then say: **“Book me a flight to Goa.”** Show the out-of-scope refusal and redirection to Aura Skincare support.                                                                                                                                                                                                          |
| 1:35-1:55 | Say: **“Where is ORD-999?”** Show the not-found tool chip and Aria asking you to verify the order ID.                                                                                                                                                                                                                                                                                                                                                  |
| 1:55-2:35 | Say: **“Cancel ORD-103.”** Show that it is eligible under the policy but that Aria cannot perform the cancellation. Then say: **“Cancel ORD-101.”** Show its ineligible status and the policy-permitted doorstep-refusal information.                                                                                                                                                                                                                  |
| 2:35-3:00 | Say: **“What is your shipping fee?”** Show the answer from the configured shipping policy.                                                                                                                                                                                                                                                                                                                                                             |
| 3:00-3:25 | Select **End Call**. Show the retained transcript, intent and resolution badges, the structured JSON, and the **Copy JSON** control. Mention that malformed model JSON is handled by a deterministic fallback, while a failed summary request can be retried.                                                                                                                                                                                          |
| 3:25-4:30 | Walk through the README architecture diagram and point to `frontend/src/hooks/useVoiceAgent.js` for lifecycle coordination, `backend/services/gemini.service.js` for Gemini/tool orchestration, `backend/services/orders.service.js` for verified lookup and deterministic eligibility, and `backend/prompts/system.prompt.js` for chat guardrails. Close by stating that order data is a mock fixture and no real cancellation or refund is executed. |

## Pre-submission checklist

- [ ] Public application URL loads over HTTPS.
- [ ] Open the backend URL (https://aura-voice-agent-usrh.onrender.com/) once before submitting and before recording the video; the free Render instance may take 30-50 seconds to wake after inactivity.
- [ ] Microphone permission works on the deployed site in desktop Chrome or Edge.
- [ ] GitHub repository is public and has `backend/`, `frontend/`, and the root `README.md`.
- [ ] `backend/.env.example` and `frontend/.env.example` are present.
- [ ] No real `.env` file, API key, or other secret is committed.
- [ ] README reflection sections have been rewritten in the author's own words.
- [ ] LinkedIn profile link is accessible to the recipients.

## Likely interview questions

1. **Why is the application split into a React client and Express backend?** — See README **Design Decisions** and the architecture diagram.
2. **How does a voice turn travel through the application?** — See README **How It Works: End-to-end flow** and `frontend/src/hooks/useVoiceAgent.js`.
3. **How does browser speech recognition and speech synthesis work here?** — See `frontend/src/services/speech.js` and README **Known limitations**.
4. **How does Gemini decide to call the order tool?** — See `backend/tools/orderTools.js`, `backend/prompts/system.prompt.js`, and README **Tool calling in detail**.
5. **How are return and cancellation decisions kept deterministic?** — See `backend/services/orders.service.js` and README **Layered guardrails**.
6. **What happens when an order ID is missing or unknown?** — See `backend/services/gemini.service.js` and README **Tool calling in detail**.
7. **How are invented support processes prevented?** — See `backend/prompts/system.prompt.js` and README **Challenges**.
8. **How is conversation state protected when a call ends during a request?** — See `frontend/src/hooks/useVoiceInteractions.js` and `frontend/src/services/voiceChat.js`.
9. **How is the call summary validated and what happens when JSON is invalid?** — See `backend/services/summaryParser.js` and README **Post-call summary**.
10. **How are API errors and abuse limits handled?** — See `backend/routes/ai.routes.js`, `backend/server.js`, and `backend/utils/errorHandler.js`.
11. **What deployment settings control CORS and proxy-aware rate limiting?** — See `backend/config/env.js`, `backend/server.js`, `render.yaml`, and README **Deployment guide**.
12. **What would you change to serve 1,000 conversations per day?** — See README **Scaling Considerations**.
