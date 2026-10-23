import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';
import { accent, brand, button, container, h1, main, text } from './style';
const Email = ({ studentName = 'Aluna', planName = 'Plano', validUntil = '' }) => <Html lang="pt-BR"><Head /><Preview>Seu plano está perto de vencer</Preview><Body style={main}><Container style={container}>
  <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
  <Heading style={h1}>Seu plano está perto de vencer</Heading>
  <Text style={text}>Oi, {studentName}! Seu plano <strong>{planName}</strong> vence em <strong>{validUntil}</strong>. Fale com a Raissa para renovar e não perder seus horários.</Text>
  <Button style={button} href="https://praianapoledance-app.com.br/perfil">Ver meu plano</Button>
</Container></Body></Html>;
export const template = { component: Email, subject: 'Seu plano está perto de vencer | Studio Praiana', displayName: 'Plano perto de vencer', previewData: { studentName: 'Aluna', planName: '4 aulas/mês', validUntil: '05/11/2026' } } satisfies TemplateEntry;