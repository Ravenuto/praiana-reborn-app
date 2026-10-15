import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { accent, brand, button, container, footer, h1, main, text } from './style'

interface PlanRenewedProps {
  studentName?: string
  planName?: string
  renewedOn?: string
  credits?: number | string
  validUntil?: string
  appUrl?: string
}

const PlanRenewedEmail = ({
  studentName = 'Aluna',
  planName = 'Plano',
  renewedOn = 'Data',
  credits = 0,
  validUntil = '',
  appUrl = 'https://praianapoledance-app.com.br/agenda',
}: PlanRenewedProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <meta charSet="UTF-8" />
    </Head>
    <Preview>Seu plano {planName} foi renovado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Seu plano foi renovado! 💙</Heading>
        <Text style={text}>Oi, {studentName}. Seu plano foi renovado no dia {renewedOn}:</Text>
        <Section style={details}>
          <Text style={detail}><strong>Plano:</strong> {planName}</Text>
          <Text style={detail}><strong>Créditos:</strong> {credits}</Text>
          {validUntil ? <Text style={detail}><strong>Válido até:</strong> {validUntil}</Text> : null}
        </Section>
        <Button style={button} href={appUrl}>Agendar minhas aulas</Button>
        <Text style={footer}>Obrigada por continuar com a gente!</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlanRenewedEmail,
  subject: (data) => `Plano renovado: ${data.planName || 'seu plano'} | Studio Praiana Pole Dance`,
  displayName: 'Renovação de plano',
  previewData: { studentName: 'Monique', planName: '4 aulas/mês', renewedOn: '15/10/2026', credits: 4, validUntil: '15/11/2026' },
} satisfies TemplateEntry

const details = { borderLeft: '3px solid #f79021', padding: '4px 0 4px 18px', margin: '0 0 28px' }
const detail = { ...text, margin: '7px 0' }
