# Trocar o favicon do site

## Objetivo
Substituir o favicon atual (`public/favicon.png`) por uma nova imagem enviada pela Raissa, adaptada para formato quadrado e tamanho adequado de favicon.

## Passos

1. **Receber a nova imagem**
   - Aguardar o upload da imagem no chat.

2. **Processar a imagem**
   - Abrir a imagem enviada.
   - Adaptá-la para um quadrado proporcional (crop ou pad, sem distorcer).
   - Gerar versões raster em 64x64 e 32x32 pixels, mantendo transparência se apropriado.
   - Salvar o resultado como `public/favicon.png`.

3. **Ajustar a referência no site**
   - Verificar `src/routes/__root.tsx`: o link do favicon já aponta para `/favicon.png`.
   - Garantir que o `type="image/png"` continue correto.

4. **Limpar o favicon antigo**
   - Remover `public/favicon.ico` se ainda existir, para evitar que navegadores usem o ícone antigo.

5. **Validar**
   - Verificar visualmente o novo favicon.
   - Confirmar que o build não quebra e que a tag `<link rel="icon">` está correta.

## Entregável
- Novo arquivo `public/favicon.png` quadrado, derivado da imagem enviada.
- `src/routes/__root.tsx` mantido/apontando corretamente.
- `public/favicon.ico` removido.
