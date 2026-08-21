import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Dicionário de textos/imagens editáveis pelo Admin.
// Cada campo: { key, label, type: "text" | "textarea" | "image", default, help? }
export const CONTENT_GROUPS = [
  {
    id: "home",
    label: "Home",
    fields: [
      {
        key: "content_home_eyebrow",
        label: "Selo acima do título",
        type: "text",
        default: "Área da aluna",
      },
      {
        key: "content_home_greeting",
        label: "Saudação (antes do nome)",
        type: "text",
        default: "Olá,",
      },
      {
        key: "content_home_title_line2",
        label: "Segunda linha do título",
        type: "text",
        default: "bem-vinda de volta.",
      },
      {
        key: "content_home_subtitle",
        label: "Frase de apoio",
        type: "textarea",
        default: "Marque as suas aulas, gerencie seu plano e acompanhe as novidades do studio.",
      },
      {
        key: "content_home_cta_primary",
        label: "Botão principal",
        type: "text",
        default: "Agendar aula",
      },
      {
        key: "content_home_cta_secondary",
        label: "Botão secundário",
        type: "text",
        default: "Minhas reservas",
      },
      {
        key: "content_home_instagram_url",
        label: "Link do Instagram",
        type: "text",
        default: "https://instagram.com/raissa.poledance",
      },
      {
        key: "content_home_whatsapp_url",
        label: "Link do WhatsApp",
        type: "text",
        default: "https://wa.me/5521999999999",
      },
      { key: "content_home_logo", label: "Logo da Home", type: "image", default: "" },
    ],
  },
  {
    id: "about",
    label: "Sobre",
    fields: [
      {
        key: "content_about_eyebrow",
        label: "Selo acima do título",
        type: "text",
        default: "Conheça o estúdio",
      },
      {
        key: "content_about_title",
        label: "Título da página",
        type: "text",
        default: "Sobre Praiana Pole Dance",
      },
      {
        key: "content_about_gold_word",
        label: "Palavra destacada em laranja",
        type: "text",
        default: "Praiana",
      },
      {
        key: "content_about_subtitle",
        label: "Subtítulo",
        type: "textarea",
        default: "Conheça nosso estúdio e as modalidades que oferecemos",
      },
      {
        key: "content_about_address_title",
        label: "Contato — título do endereço",
        type: "text",
        default: "Endereço",
      },
      {
        key: "content_about_address",
        label: "Endereço",
        type: "textarea",
        default: "Rua da Praia, 123\nRio de Janeiro, RJ",
      },
      {
        key: "content_about_phone_title",
        label: "Contato — título do telefone",
        type: "text",
        default: "Telefone",
      },
      { key: "content_about_phone", label: "Telefone", type: "text", default: "(21) 99999-9999" },
      {
        key: "content_about_email_title",
        label: "Contato — título do email",
        type: "text",
        default: "Email",
      },
      {
        key: "content_about_email",
        label: "Email",
        type: "text",
        default: "contato@raissapoledance.com",
      },
      {
        key: "content_about_modalities_title",
        label: "Título da seção Modalidades",
        type: "text",
        default: "Modalidades",
      },
      {
        key: "content_about_modalities_subtitle",
        label: "Subtítulo da seção Modalidades",
        type: "text",
        default: "Aulas que oferecemos",
      },
      {
        key: "content_about_image",
        label: "Imagem de destaque (opcional)",
        type: "image",
        default: "",
      },
    ],
  },
  {
    id: "login",
    label: "Login",
    fields: [
      {
        key: "content_login_title_prefix",
        label: "Título — antes da palavra laranja",
        type: "text",
        default: "Studio",
      },
      {
        key: "content_login_title_highlight",
        label: "Título — palavra em laranja",
        type: "text",
        default: "Praiana",
      },
      {
        key: "content_login_title_suffix",
        label: "Título — depois da palavra laranja",
        type: "text",
        default: "Pole Dance",
      },
      {
        key: "content_login_script",
        label: "Frase manuscrita",
        type: "text",
        default: "bem-vinda de volta",
      },
      {
        key: "content_login_subtitle",
        label: "Frase de apoio",
        type: "text",
        default: "Entre na sua conta",
      },
      {
        key: "content_login_submit",
        label: "Texto do botão entrar",
        type: "text",
        default: "Entrar",
      },
      {
        key: "content_login_signup_text",
        label: "Rodapé — pergunta",
        type: "text",
        default: "Quer se matricular?",
      },
      {
        key: "content_login_signup_link_label",
        label: "Rodapé — texto do link",
        type: "text",
        default: "Entre em contato pelo WhatsApp",
      },
      {
        key: "content_login_signup_link_url",
        label: "Rodapé — link",
        type: "text",
        default: "https://wa.me/5500000000000",
      },
      { key: "content_login_logo", label: "Logo da tela de login", type: "image", default: "" },
    ],
  },
];

export const ALL_FIELDS = CONTENT_GROUPS.flatMap((g) => g.fields);

export const CONTENT_DEFAULTS = ALL_FIELDS.reduce((acc, f) => {
  acc[f.key] = f.default;
  return acc;
}, {});

let _cache = null;
const listeners = new Set();

export async function getSiteContent({ fresh = false } = {}) {
  if (_cache && !fresh) return _cache;
  let map = { ...CONTENT_DEFAULTS };
  try {
    const rows = await base44.entities.StudioSettings.list();
    rows.forEach((r) => {
      if (
        r.key in CONTENT_DEFAULTS &&
        r.value !== undefined &&
        r.value !== null &&
        r.value !== ""
      ) {
        map[r.key] = r.value;
      }
    });
  } catch {
    /* usa defaults */
  }
  _cache = map;
  return map;
}

export function clearContentCache() {
  _cache = null;
  listeners.forEach((fn) => fn());
}

/** Hook: retorna um objeto com todos os textos (defaults até carregar). */
export function useSiteContent() {
  const [content, setContent] = useState(_cache || CONTENT_DEFAULTS);

  useEffect(() => {
    let alive = true;
    const load = () => {
      getSiteContent().then((c) => {
        if (alive) setContent(c);
      });
    };
    load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, []);

  return content;
}
