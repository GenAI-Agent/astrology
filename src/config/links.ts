// 鏈接配置 - 控制哪些鏈接是活躍的
export interface LinkConfig {
  href: string;
  label: string;
  active: boolean;
}

export const headerLinks: LinkConfig[] = [
  { href: "/login", label: "Login", active: true },
  { href: "/price", label: "Price", active: true },
  { href: "/chat", label: "Start App", active: true }
];

export const footerQuickLinks: LinkConfig[] = [
  { href: "/chat", label: "Start Reading", active: true },
  { href: "/login", label: "Sign In", active: true },
  { href: "/price", label: "Pricing", active: true },
  { href: "#", label: "Horoscopes", active: false }
];

export const footerSupportLinks: LinkConfig[] = [
  { href: "#", label: "Help Center", active: false },
  { href: "#", label: "Contact Us", active: false },
  { href: "#", label: "Privacy Policy", active: false },
  { href: "#", label: "Terms of Service", active: false }
];

export const socialLinks: LinkConfig[] = [
  { href: "#", label: "Twitter", active: false },
  { href: "#", label: "Instagram", active: false },
  { href: "#", label: "Pinterest", active: false }
];