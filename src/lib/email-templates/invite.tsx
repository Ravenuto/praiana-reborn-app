import {
  Body,
  Button,
  Container,
  Head,
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
    <Head>
      <meta charSet="UTF-8" />
    </Head>
    <Preview>Crie sua senha para acessar o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Você recebeu um convite</Heading>
        <Text style={text}>
          Você foi convidada para acessar o{' '}
          <Link href={siteUrl} style={link}>
            <strong>Praiana Pole Dance App</strong>
          </Link>. Clique no botão abaixo para aceitar o convite e criar sua senha.
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
