import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';
import { accent, brand, button, container, h1, main, text } from './style';
const Email = ({ studentName = 'Aluna', classType = 'Aula', classDate = '', classTime = '' }) => <Html lang="pt-BR"><Head /><Preview>Sua aula é hoje!</Preview><Body style={main}><Container style={container}>
  <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
  <Heading style={h1}>Hoje é dia de aula!</Heading>
  <Text style={text}>Oi, {studentName}! Sua aula de <strong>{classType}</strong> é hoje, <strong>{classDate} às {classTime}</strong>. Te esperamos no estúdio!</Text>
  <Button style={button} href="https://praianapoledance-app.com.br/minhas-reservas">Ver minhas aulas no app</Button>
</Container></Body></Html>;
export const template = { component: Email, subject: (data) => `Sua aula de ${data.classType || 'Pole Dance'} é hoje | Studio Praiana`, displayName: 'Lembrete de aula', previewData: { studentName: 'Aluna', classType: 'Pole Dance', classDate: '03/11/2026', classTime: '18:00' } } satisfies TemplateEntry;