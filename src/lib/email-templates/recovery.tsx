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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Preview>Crie uma nova senha para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STUDIO <span style={accent}>PRAIANA</span> POLE DANCE</Text>
        <Heading style={h1}>Redefina sua senha</Heading>
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta no {siteName}. Abra o link abaixo para escolher uma nova senha.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Criar nova senha
        </Button>
        <Text style={footer}>
          Se você não solicitou essa alteração, pode ignorar este e-mail. Sua senha atual continuará válida.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
