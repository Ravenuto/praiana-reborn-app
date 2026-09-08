import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Dicionário de textos/imagens editáveis pelo Admin.
// Cada grupo = uma página. Cada seção = um bloco visível para a aluna.
// Campo: { key, label, type: "text" | "textarea" | "image", default, help? }
export const CONTENT_GROUPS = [
  {
    id: "home",
    label: "Home",
    description: "A primeira tela que a aluna vê depois de entrar.",
    sections: [
      {
        id: "home_header",
        label: "Cabeçalho",
        hint: "Selo, saudação e frase de boas-vindas no topo da Home.",
        preview: "home_header",
        fields: [
          {
            key: "content_home_eyebrow",
            label: "Selo acima do título",
            type: "text",
            default: "Área da aluna",
            help: "Texto pequeno em azul que aparece acima do título.",
          },
          {
            key: "content_home_greeting",
            label: "Saudação",
            type: "text",
            default: "Olá,",
            help: "Vem antes do primeiro nome da aluna. Ex.: Olá, Maria.",
          },
          {
            key: "content_home_title_line2",
            label: "Segunda linha do título",
            type: "text",
            default: "bem-vinda de volta.",
            help: "Frase em itálico logo abaixo da saudação.",
          },
          {
            key: "content_home_subtitle",
            label: "Frase de apoio",
            type: "textarea",
            default: "Marque as suas aulas, gerencie seu plano e acompanhe as novidades do studio.",
            help: "Explica em uma frase o que a aluna pode fazer no app.",
          },
        ],
      },
      {
        id: "home_buttons",
        label: "Botões",
        hint: "Os dois botões grandes logo abaixo da frase de apoio.",
        preview: "home_buttons",
        fields: [
          {
            key: "content_home_cta_primary",
            label: "Botão principal",
            type: "text",
            default: "Agendar aula",
            help: "Leva para a agenda de aulas.",
          },
          {
            key: "content_home_cta_secondary",
            label: "Botão secundário",
            type: "text",
            default: "Minhas reservas",
            help: "Leva para as reservas da aluna.",
          },
        ],
      },
      {
        id: "home_links",
        label: "Redes e contato",
        hint: "Para onde vão os atalhos de Instagram e WhatsApp.",
        preview: "links",
        fields: [
          {
            key: "content_home_instagram_url",
            label: "Link do Instagram",
            type: "text",
            default: "https://instagram.com/raissa.poledance",
            help: "Endereço completo do perfil.",
          },
          {
            key: "content_home_whatsapp_url",
            label: "Link do WhatsApp",
            type: "text",
            default: "https://wa.me/5521999999999",
            help: "Use o formato https://wa.me/55DDNÚMERO. Este link também aparece no rodapé da tela de login.",
          },
        ],
      },
      {
        id: "home_logo",
        label: "Logo",
        hint: "Imagem redonda no topo da Home.",
        preview: "logo",
        fields: [
          {
            key: "content_home_logo",
            label: "Logo da Home",
            type: "image",
            default: "",
            help: "Deixe vazio para usar a logo padrão do studio.",
          },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "Sobre",
    description: "Página pública com a apresentação do studio.",
    sections: [
      {
        id: "about_header",
        label: "Cabeçalho",
        hint: "Selo, título e subtítulo no topo da página Sobre.",
        preview: "about_header",
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
            help: "Precisa ser uma palavra que já existe no título acima.",
          },
          {
            key: "content_about_subtitle",
            label: "Subtítulo",
            type: "textarea",
            default: "Conheça nosso estúdio e as modalidades que oferecemos",
          },
        ],
      },
      {
        id: "about_contact",
        label: "Contato",
        hint: "Os três cartões de endereço, telefone e email.",
        preview: "about_contact",
        fields: [
          {
            key: "content_about_address_title",
            label: "Título do cartão de endereço",
            type: "text",
            default: "Endereço",
          },
          {
            key: "content_about_address",
            label: "Endereço",
            type: "textarea",
            default: "Rua da Praia, 123\nRio de Janeiro, RJ",
            help: "Pode usar mais de uma linha.",
          },
          {
            key: "content_about_phone_title",
            label: "Título do cartão de telefone",
            type: "text",
            default: "Telefone",
          },
          {
            key: "content_about_phone",
            label: "Telefone",
            type: "text",
            default: "(21) 99999-9999",
            help: "Ao tocar, o celular já abre a ligação.",
          },
          {
            key: "content_about_email_title",
            label: "Título do cartão de email",
            type: "text",
            default: "Email",
          },
          {
            key: "content_about_email",
            label: "Email",
            type: "text",
            default: "contato@raissapoledance.com",
          },
        ],
      },
      {
        id: "about_modalities",
        label: "Modalidades",
        hint: "Cabeçalho da lista de modalidades (as aulas vêm da aba Modalidades).",
        preview: "about_modalities",
        fields: [
          {
            key: "content_about_modalities_title",
            label: "Título da seção",
            type: "text",
            default: "Modalidades",
          },
          {
            key: "content_about_modalities_subtitle",
            label: "Subtítulo da seção",
            type: "text",
            default: "Aulas que oferecemos",
          },
        ],
      },
      {
        id: "about_image",
        label: "Imagem",
        hint: "Imagem opcional de destaque da página.",
        preview: "logo",
        fields: [
          {
            key: "content_about_image",
            label: "Imagem de destaque (opcional)",
            type: "image",
            default: "",
          },
        ],
      },
    ],
  },
  {
    id: "login",
    label: "Login",
    description: "Tela de entrada, antes da aluna fazer login.",
    sections: [
      {
        id: "login_title",
        label: "Título do studio",
        hint: "O nome grande do studio. É montado em três partes.",
        preview: "login_title",
        fields: [
          {
            key: "content_login_title_prefix",
            label: "Parte 1 — antes da palavra laranja",
            type: "text",
            default: "Studio",
          },
          {
            key: "content_login_title_highlight",
            label: "Parte 2 — palavra em laranja",
            type: "text",
            default: "Praiana",
          },
          {
            key: "content_login_title_suffix",
            label: "Parte 3 — depois da palavra laranja",
            type: "text",
            default: "Pole Dance",
          },
        ],
      },
      {
        id: "login_texts",
        label: "Frases e botão",
        hint: "Frases de boas-vindas e o texto do botão de entrar.",
        preview: "login_texts",
        fields: [
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
        ],
      },
      {
        id: "login_footer",
        label: "Rodapé",
        hint: "Convite de matrícula no final da tela de login.",
        preview: "login_footer",
        fields: [
          {
            key: "content_login_signup_text",
            label: "Pergunta",
            type: "text",
            default: "Quer se matricular?",
          },
          {
            key: "content_login_signup_link_label",
            label: "Texto do link",
            type: "text",
            default: "Entre em contato pelo WhatsApp",
            help: "O endereço do link é o mesmo WhatsApp configurado na aba Home.",
          },
        ],
      },
      {
        id: "login_logo",
        label: "Logo",
        hint: "Imagem redonda no topo da tela de login.",
        preview: "logo",
        fields: [
          {
            key: "content_login_logo",
            label: "Logo da tela de login",
            type: "image",
            default: "",
            help: "Deixe vazio para usar a logo padrão do studio.",
          },
        ],
      },
    ],
  },
  {
    id: "rules",
    label: "Regras do Estúdio",
    description:
      "Textos do bloco Regras do Estúdio, que aparece no final da página Sobre. Você pode acrescentar ou retirar regras. Os números de horas e minutos continuam vindo da aba Regras.",
    dynamic: "rules",
    sections: [
      {
        id: "rules_header",
        label: "Título do bloco",
        hint: "Nome que aparece no topo do bloco de regras.",
        preview: "rules_header",
        fields: [
          {
            key: "content_rules_title",
            label: "Título",
            type: "text",
            default: "Regras do Estúdio",
          },
        ],
      },
    ],
  },
];

/** Regras padrão do estúdio (lista editável: dá para acrescentar e retirar). */
export const DEFAULT_RULE_BLOCKS = [
  {
    id: "booking",
    title: "Agendamento e Cancelamento",
    text: "O agendamento deve ser feito com no mínimo {horas_marcar} de antecedência.\nO cancelamento deve ser feito com no mínimo {horas_cancelar} de antecedência. Após esse prazo, o crédito não será devolvido.",
  },
  {
    id: "late",
    title: "Pontualidade",
    text: "Tolerância de atraso de até {minutos_tolerancia}. Após esse período não será possível entrar na aula.",
  },
  {
    id: "credits",
    title: "Créditos",
    text: "Os créditos têm validade igual à duração do plano contratado (mensal, trimestral, semestral ou anual), contada a partir da data de início. Créditos não utilizados dentro do período não são transferidos.",
  },
  {
    id: "waitlist",
    title: "Fila de espera",
    text: "Quando a aula estiver lotada, você pode entrar na fila de espera. Ao surgir uma vaga, você será notificada automaticamente.",
  },
  {
    id: "holidays",
    title: "Feriados",
    text: "Nos feriados marcados no sistema não haverá aulas. Verifique o calendário antes de reservar.",
  },
];

/** Chaves antigas (uma por regra) — mantidas para não perder textos já salvos. */
export const LEGACY_RULE_KEYS = {
  booking: ["content_rules_booking_title", "content_rules_booking_text", "content_rules_cancel_text"],
  late: ["content_rules_late_title", "content_rules_late_text"],
  credits: ["content_rules_credits_title", "content_rules_credits_text"],
  waitlist: ["content_rules_waitlist_title", "content_rules_waitlist_text"],
  holidays: ["content_rules_holidays_title", "content_rules_holidays_text"],
};

const LEGACY_RULE_DEFAULTS = {
  content_rules_booking_title: "Agendamento e Cancelamento",
  content_rules_booking_text:
    "O agendamento deve ser feito com no mínimo {horas_marcar} de antecedência.",
  content_rules_cancel_text:
    "O cancelamento deve ser feito com no mínimo {horas_cancelar} de antecedência. Após esse prazo, o crédito não será devolvido.",
  content_rules_late_title: "Pontualidade",
  content_rules_late_text:
    "Tolerância de atraso de até {minutos_tolerancia}. Após esse período não será possível entrar na aula.",
  content_rules_credits_title: "Créditos",
  content_rules_credits_text: DEFAULT_RULE_BLOCKS[2].text,
  content_rules_waitlist_title: "Fila de espera",
  content_rules_waitlist_text: DEFAULT_RULE_BLOCKS[3].text,
  content_rules_holidays_title: "Feriados",
  content_rules_holidays_text: DEFAULT_RULE_BLOCKS[4].text,
};

export const ALL_FIELDS = CONTENT_GROUPS.flatMap((g) => g.sections.flatMap((s) => s.fields));

export const CONTENT_DEFAULTS = {
  ...ALL_FIELDS.reduce((acc, f) => {
    acc[f.key] = f.default;
    return acc;
  }, {}),
  ...LEGACY_RULE_DEFAULTS,
  // Lista de regras em JSON. Vazio = usa os textos antigos/padrão.
  content_rules_blocks: "",
};

/** Lista de regras a exibir/editar, com migração dos textos antigos. */
export function getRuleBlocks(content = {}) {
  const raw = content.content_rules_blocks;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((b) => b && (b.title || b.text))
          .map((b, i) => ({
            id: b.id || `regra_${i}`,
            title: String(b.title || ""),
            text: String(b.text || ""),
          }));
      }
    } catch {
      /* usa o padrão */
    }
  }
  return DEFAULT_RULE_BLOCKS.map((b) => {
    const keys = LEGACY_RULE_KEYS[b.id] || [];
    const title = content[keys[0]] || b.title;
    const texts = keys.slice(1).map((k) => content[k]).filter(Boolean);
    return { id: b.id, title, text: texts.length ? texts.join("\n") : b.text };
  });
}

export function serializeRuleBlocks(blocks) {
  return JSON.stringify(
    (blocks || []).map((b) => ({ id: b.id, title: b.title || "", text: b.text || "" })),
  );
}


/** Substitui os marcadores {horas_marcar}, {horas_cancelar} e {minutos_tolerancia}. */
export function fillPlaceholders(text, { bookingHours, cancelHours, lateMinutes } = {}) {
  const plural = (n, one, many) => `${n} ${String(n) === "1" ? one : many}`;
  return String(text ?? "")
    .replaceAll("{horas_marcar}", plural(bookingHours, "hora", "horas"))
    .replaceAll("{horas_cancelar}", plural(cancelHours, "hora", "horas"))
    .replaceAll("{minutos_tolerancia}", plural(lateMinutes, "minuto", "minutos"));
}

let _cache = null;
const listeners = new Set();

export async function getSiteContent({ fresh = false } = {}) {
  if (_cache && !fresh) return _cache;
  const map = { ...CONTENT_DEFAULTS };
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
    // Migração: o WhatsApp do login agora usa o mesmo campo da Home.
    if (
      map.content_home_whatsapp_url === CONTENT_DEFAULTS.content_home_whatsapp_url &&
      map.content_login_signup_link_url !== CONTENT_DEFAULTS.content_login_signup_link_url
    ) {
      map.content_home_whatsapp_url = map.content_login_signup_link_url;
    }
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
