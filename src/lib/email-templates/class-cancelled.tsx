import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';
import { accent, brand, button, container, h1, main, text } from './style';
const Email = ({ studentName = 'Aluna', classType = 'Aula', classDate = '', classTime = '', creditReturned = false }) => (
  <Html lang="pt-BR"><Head /><Preview>Sua aula foi cancelada pelo estúdio</Preview><Body style={main}><Container style={container}>
    <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
    <Heading style={h1}>Aula cancelada pelo estúdio</Heading>
    <Text style={text}>Oi, {studentName}! A aula de <strong>{classType}</strong> de <strong>{classDate} às {classTime}</strong> foi cancelada pelo estúdio.</Text>
    {creditReturned && <Text style={text}>Seu crédito de aula já foi devolvido ao saldo. Você pode escolher outro horário na agenda.</Text>}
    <Button style={button} href="https://praianapoledance-app.com.br/aulas">Abrir a agenda</Button>
  </Container></Body></Html>
);
export const template = { component: Email, subject: (data) => `Aula cancelada: ${data.classType || 'Aula'} | Studio Praiana`, displayName: 'Cancelamento pelo estúdio', previewData: { studentName: 'Aluna', classType: 'Pole Dance', classDate: '03/11/2026', classTime: '18:00', creditReturned: true } } satisfies TemplateEntry;