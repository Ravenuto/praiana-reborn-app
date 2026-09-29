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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Preview>Seu convite para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Seu convite chegou</Heading>
        <Text style={text}>
          Você recebeu um convite para acessar o{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>. Para entrar pela primeira vez, abra o link abaixo e crie sua senha.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceitar convite e criar senha
        </Button>
        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este e-mail. Não compartilhe o link com outras pessoas.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
