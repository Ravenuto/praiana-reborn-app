import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';
import { accent, brand, button, container, h1, main, text } from './style';
const Email = ({ studentName = 'Aluna', classType = 'Aula', classDate = '', classTime = '' }) => (
  <Html lang="pt-BR"><Head /><Preview>A aula fechou e seu crédito voltou!</Preview><Body style={main}><Container style={container}>
    <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
    <Heading style={h1}>A aula fechou e seu crédito voltou!</Heading>
    <Text style={text}>Oi, {studentName}! O período de agendamento para a aula de <strong>{classType}</strong> de <strong>{classDate} às {classTime}</strong> encerrou e, infelizmente, nenhuma vaga surgiu desta vez.</Text>
    <Text style={text}>Não se preocupe: <strong>1 crédito de aula já retornou integralmente para o seu saldo</strong> e está disponível para você escolher outro dia ou horário na agenda!</Text>
    <Button style={button} href="https://praianapoledance-app.com.br/aulas">Abrir a agenda e escolher outra aula</Button>
  </Container></Body></Html>
);
export const template = { component: Email, subject: 'Fila encerrada: seu crédito retornou | Studio Praiana', displayName: 'Fila encerrada e crédito devolvido', previewData: { studentName: 'Aluna', classType: 'Pole Dance', classDate: '03/11/2026', classTime: '18:00' } } satisfies TemplateEntry;