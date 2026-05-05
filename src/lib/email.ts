/**
 * Client-side utility to send emails via the JDAutoPilot backend API.
 * 
 * @param to recipient email
 * @param subject email subject
 * @param html or text content
 * @param attachments optional array of { filename, content, encoding }
 */
export async function sendEmail({ to, subject, html, text, attachments }: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        attachments,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email");
    }

    return data;
  } catch (error) {
    console.error("Error calling send-email API:", error);
    throw error;
  }
}
