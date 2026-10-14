import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'
import { accent, brand, button, container, footer, h1, main, text } from './style'

interface WaitlistPromotedProps {
  studentName?: string
  classType?: string
  classDate?: string
  classTime?: string
  appUrl?: string
}

const WaitlistPromotedEmail = ({
  studentName = 'Aluna',
  classType = 'Aula',
  classDate = 'Data da aula',
  classTime = 'Horário da aula',
  appUrl = 'https://praianapoledance-app.com.br/minhas-reservas',
}: WaitlistPromotedProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <meta charSet="UTF-8" />
    </Head>
    <Preview>Você entrou na aula de {classType}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Sua vaga foi confirmada!</Heading>
        <Text style={text}>Oi, {studentName}. Uma vaga foi liberada e você entrou na aula:</Text>
        <Section style={details}>
          <Text style={detail}><strong>Modalidade:</strong> {classType}</Text>
          <Text style={detail}><strong>Dia:</strong> {classDate}</Text>
          <Text style={detail}><strong>Horário:</strong> {classTime}</Text>
        </Section>
        <Button style={button} href={appUrl}>Ver minhas aulas no app</Button>
        <Text style={footer}>Esta mensagem confirma uma reserva que você aguardava na fila de espera.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistPromotedEmail,
  subject: (data) => `Vaga confirmada: ${data.classType || 'aula'} | Studio Praiana Pole Dance`,
  displayName: 'Confirmação da fila de espera',
  previewData: {
    studentName: 'Monique',
    classType: 'Pole Dance',
    classDate: 'quarta-feira, 14 de outubro',
    classTime: '18:00',
  },
} satisfies TemplateEntry

const details = { borderLeft: '3px solid #f79021', padding: '4px 0 4px 18px', margin: '0 0 28px' }
const detail = { ...text, margin: '7px 0' }
