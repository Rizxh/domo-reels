// File-name title: title case, acronyms (DNS, IP, VPN, 2FA, ...) kept upper case.
const ACRONYMS = new Set(["DNS", "IP", "OS", "VPN", "CPU", "RAM", "2FA", "HTTP", "HTTPS", "IT", "AI", "SSD", "HDD", "URL", "USB", "LAN", "WAN", "PC", "HP", "UMKM", "OTP", "APK", "PIN", "SMS", "ML", "DL", "GPS", "PBB"]);
// Words with their own fixed spelling.
const SPECIAL: Record<string, string> = { "WI-FI": "Wi-Fi", IPHONE: "iPhone", ANDROID: "Android", WHATSAPP: "WhatsApp", LINUX: "Linux", WINDOWS: "Windows" };
const SMALL = new Set(["dan", "di", "ke", "dari", "itu", "yang", "atau", "vs", "untuk", "dengan"]);

export const niceTitle = (title: string) =>
  title
    .split(" ")
    .map((w, i) => {
      const bare = w.replace(/[^\p{L}\p{N}-]/gu, "");
      const special = SPECIAL[bare.toUpperCase()];
      if (special) return w.replace(new RegExp(bare.replace(/[-]/g, "\\-"), "i"), special);
      if (ACRONYMS.has(bare.toUpperCase()) || /\d/.test(bare)) return w.toUpperCase();
      const low = w.toLowerCase();
      return i > 0 && SMALL.has(bare.toLowerCase()) ? low : low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(" ");
