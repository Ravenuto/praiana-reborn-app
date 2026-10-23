import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';
import type { TemplateEntry } from './registry';
import { accent, brand, button, container, h1, main, text } from './style';

const Email = ({ studentName = 'Aluna', classType = 'Aula', classDate = '', classTime = '', bookingHours = 4 }) => (
  <Html lang="pt-BR"><Head /><Preview>Você está na fila de espera de {classType}</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
      <Heading style={h1}>Você está na fila de espera!</Heading>
      <Text style={text}>Oi, {studentName}! Confirmamos a sua entrada na fila de espera da aula de <strong>{classType}</strong> para <strong>{classDate} às {classTime}</strong>.</Text>
      <Text style={text}>Seu crédito ficou reservado para garantir sua vaga. Se alguma aluna cancelar e uma vaga abrir, você entrará automaticamente na turma e receberá um e-mail com a confirmação!</Text>
      <Text style={text}>Caso o horário de agendamento feche ({bookingHours}h antes) e a vaga não surja, a turma é encerrada e <strong>seu crédito volta automaticamente</strong> para a sua conta.</Text>
      <Button style={button} href="https://praianapoledance-app.com.br/aulas">Ver minha posição no app</Button>
    </Container></Body>
  </Html>
);
export const template = { component: Email, subject: (data) => `Você está na fila de espera: ${data.classType || 'Aula'} | Studio Praiana`, displayName: 'Entrada na fila de espera', previewData: { studentName: 'Aluna', classType: 'Pole Dance', classDate: 'terça-feira, 03 de novembro', classTime: '18:00', bookingHours: 4 } } satisfies TemplateEntry;