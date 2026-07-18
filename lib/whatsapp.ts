type LoginMessagePayload = {
  email: string;
  name: string;
  password: string;
  phone: string;
  roleLabel: string;
};

type SendResult = { skipped?: boolean; error?: string };

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

const buildLoginMessage = ({ email, name, password, roleLabel }: LoginMessagePayload) => [
  `Halo ${name}, akun ${roleLabel} Anda di Manajemen Bimbel sudah dibuat.`,
  "",
  `Email: ${email}`,
  `Password: ${password}`,
  "",
  "Silakan login dan segera simpan data akun ini dengan aman."
].join("\n");

export async function sendWhatsAppLoginMessage(payload: LoginMessagePayload): Promise<SendResult> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const provider = process.env.WHATSAPP_API_PROVIDER ?? "generic";
  const enabled = process.env.WHATSAPP_SEND_LOGIN !== "false";

  if (!enabled || !apiUrl) return { skipped: true };

  const phone = normalizePhone(payload.phone);
  const message = buildLoginMessage(payload);

  try {
    const response = provider === "fonnte"
      ? await sendFonnte(apiUrl, apiToken, phone, message)
      : await sendGeneric(apiUrl, apiToken, phone, message);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { error: text || `Gateway WhatsApp membalas status ${response.status}.` };
    }

    if (provider === "fonnte") {
      const result = await response.json().catch(() => null) as { status?: boolean; reason?: string; detail?: string } | null;
      if (result?.status === false) {
        return { error: result.reason ?? result.detail ?? "Fonnte menolak pengiriman pesan." };
      }
    }

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gateway WhatsApp tidak bisa dihubungi." };
  }
}

const sendGeneric = (apiUrl: string, apiToken: string | undefined, phone: string, message: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;

  return fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, message })
  });
};

const sendFonnte = (apiUrl: string, apiToken: string | undefined, phone: string, message: string) => {
  const body = new FormData();
  body.append("target", phone);
  body.append("message", message);

  const headers: Record<string, string> = {};
  if (apiToken) headers.Authorization = apiToken;

  return fetch(apiUrl, {
    method: "POST",
    headers,
    body
  });
};
