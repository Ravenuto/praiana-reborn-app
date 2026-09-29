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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Preview>Confirme seu e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={text}>
          Para confirmar seu acesso ao{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>, use o botão abaixo.
        </Text>
        <Text style={text}>
          Este convite foi enviado para{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar e-mail
        </Button>
        <Text style={footer}>
          Se você não esperava este e-mail, pode ignorá-lo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
