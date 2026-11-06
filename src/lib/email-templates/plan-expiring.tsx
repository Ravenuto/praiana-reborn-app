import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';
import { accent, brand, button, container, h1, main, text } from './style';
const Email = ({ studentName = 'Aluna', planName = 'Plano', validUntil = '', credits = 0 }) => <Html lang="pt-BR"><Head /><Preview>Seu plano vence em 5 dias</Preview><Body style={main}><Container style={container}>
  <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
  <Heading style={h1}>Seu plano vence em 5 dias 💙</Heading>
  <Text style={text}>Olá, {studentName}! 💙 Passando para te avisar que o seu plano <strong>{planName}</strong> vence no dia <strong>{validUntil}</strong> (daqui a 5 dias).</Text>
  {Number(credits) > 0
    ? <Text style={text}>✨ <strong>Você ainda tem {credits} {Number(credits) === 1 ? 'crédito disponível' : 'créditos disponíveis'}!</strong></Text>
    : <Text style={text}>Você já usou todos os créditos deste ciclo. Arrasou! 🎉</Text>}
  <Text style={text}>⚠️ <strong>Lembrete importante:</strong> os créditos não são acumulativos. Use seus créditos até <strong>{validUntil}</strong> — depois dessa data eles expiram.</Text>
  <Text style={text}>🔄 <strong>Não fique de fora:</strong> fale com o studio para renovar o seu plano e já garantir seus horários para o próximo mês.</Text>
  <Button style={button} href="https://praianapoledance-app.com.br/agenda">Agendar minhas aulas</Button>
  <Text style={text}>Com carinho,<br /><strong>Studio Praiana Pole Dance</strong></Text>
</Container></Body></Html>;
export const template = { component: Email, subject: 'Seu plano vence em 5 dias — aproveite seus créditos! 💙 | Studio Praiana', displayName: 'Plano perto de vencer', previewData: { studentName: 'Naedja', planName: '8 aulas / mês', validUntil: '07/11/2026', credits: 1 } } satisfies TemplateEntry;
