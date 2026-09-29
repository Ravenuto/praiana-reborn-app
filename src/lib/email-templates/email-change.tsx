import {
  Body,
  Button,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import { accent, brand, button, container, footer, h1, link, main, text } from './style'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Preview>Confirme a alteração de e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Confirme seu novo e-mail</Heading>
        <Text style={text}>
          Você solicitou a alteração do e-mail da sua conta no {siteName} de{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>Use o botão abaixo para confirmar a alteração.</Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar novo e-mail
        </Button>
        <Text style={footer}>
          Se você não solicitou essa alteração, proteja sua conta e entre em contato com o estúdio.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
