import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { accent, brand, button, container, footer, h1, main, text } from './style'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Preview>Seu link de acesso ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={text}>
          Use o botão abaixo para entrar no {siteName}. Este link expira em breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar no app
        </Button>
        <Text style={footer}>
          Se você não solicitou este link, pode ignorar este e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
