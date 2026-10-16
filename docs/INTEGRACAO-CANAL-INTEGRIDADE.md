# Credvix V2 — Canal de Integridade (frontend integrado)

## Origem auditada

- Codigo existente: `https://github.com/Dev-CredVix/canal-integridade` (`main`).
- Frontend de producao: `https://github.com/DevCredvix/site-credvix` (`master`).
- Contrato reutilizado: `assets/formulario.js` e `assets/consultar.js` do canal antigo.
- Backend original: `https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel`.
- Storage de evidencias: bucket privado `channel-evidencias`, usando URL de upload assinada.
- **Nao criamos outro banco, tabela ou bucket.** Todos os registros continuam no projeto Supabase original.

> A README do repositorio antigo descreve anexos como fora de escopo, mas os scripts atuais implementam `attachment_init`, `attachment_complete` e `attachment_list`. Estes scripts, e nao a README desatualizada, foram usados como referencia. O codigo servidor da Edge Function **nao esta neste repositorio**. A conexao Supabase disponivel para auditoria retornou falta de permissao; portanto, implantacao e politicas do backend precisam de verificacao por um administrador.

## Variaveis de ambiente da Vercel (Production)

Configurar em `Vercel -> dev-credvix/site-credvix -> Settings -> Environment Variables`:

```dotenv
VITE_INTEGRIDADE_API_URL=https://uexvojgictmkuackpofk.supabase.co/functions/v1/reporting-channel
VITE_INTEGRIDADE_SUPABASE_URL=https://uexvojgictmkuackpofk.supabase.co
VITE_INTEGRIDADE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_o9X7Cc1xo4eJUAjdKMW5TQ_JzIcQLJp
```

A chave acima e **publishable**, ja distribuida no frontend antigo. NUNCA configurar `service_role`, chave secreta, JWT de administrador ou `DATABASE_URL` com prefixo `VITE_`.

Se estas variaveis nao estiverem configuradas durante o build da Vercel, a UI bloqueia consultas/envio (ou bloqueia anexos) em vez de simular sucesso.

Em **Preview**, recomendamos um projeto Supabase separado de homologacao, com sua propria Edge Function e Storage. **Nao enviar denuncias ficticias ou testes com dados reais ao banco de producao**. Se a homologacao usar a funcao real, organize com o responsavel do canal um protocolo de teste autorizado e descarte seguro.

## Pre-requisitos no backend ORIGINAL

Verificar, na instancia `uexvojgictmkuackpofk`:

1. A Edge Function `reporting-channel` esta publicada e continua aceitando: `submit`, `lookup`, `attachment_init`, `attachment_complete`, `attachment_list`.
2. `CHANNEL_ALLOWED_ORIGINS` da funcao contem `https://credvix.com` (e `https://www.credvix.com` somente se utilizado). A origem deve ser exata, sem wildcard desnecessario. Caso a Vercel Preview use a mesma funcao em homologacao, autorizar explicitamente a URL de Preview correspondente.
3. O bucket `channel-evidencias` existe e **nao e publico**. O servidor gera URLs assinadas apenas apos validar o segredo do relato.
4. Restricoes de tamanho, quantidade, MIME, limite por relato, prazo de URL assinada, fechamento de relato e rate limiting sao aplicados **no servidor**, nao apenas no navegador.
5. `attachment_list` devolve URLs assinadas de curta duracao e nao expõe evidencias a pessoas sem o codigo valido.
6. `lookup` devolve exclusivamente status, protocolo e atualizacoes destinadas ao denunciante; notas internas e dados de terceiros nao devem integrar essa resposta.
7. A Edge Function trata idempotencia de `requestId`/reenvios e permite realizar upload apos o envio inicial.
8. Confirmar privacidade, retencao dos dados, controle de acesso aos anexos, antimalware e LGPD com o gestor responsavel antes de habilitar em producao.

## Contrato de operacoes utilizado

- `submit`: `{action, requestId, secret, website, report:{category,identity,description,unit,when,people,name,email}}` -> `{protocol}`.
- `lookup`: `{action:'lookup',protocol,secret}` -> `{protocol,status,created_at,updates,attachment_count}`.
- `attachment_init`: `{action:'attachment_init',protocol,secret,fileName,mimeType,sizeBytes}` -> `{path,token}`.
- Upload: `PUT /storage/v1/object/upload/sign/channel-evidencias/<path>?token=<token>` em `multipart/form-data`, com a chave publishable (mesmo mecanismo do `uploadToSignedUrl` do Supabase JS original).
- `attachment_complete`: `{action,protocol,secret,path,fileName,mimeType,sizeBytes,sha256}`.
- `attachment_list`: `{action:'attachment_list',protocol,secret}` -> `{attachments:[{name,mime_type,size_bytes,created_at,url}]}`.

Um relato e persistido **antes** dos uploads. Se um anexo falhar, o codigo permanece visivel e a UI orienta tentar anexar pela rota `/canal-de-integridade/acompanhar`, sem recriar o relato.

## Validacao manual de homologacao (sem dados reais)

- [ ] Confirmar Preview Deployment Ready e build `npm run build` concluido.
- [ ] Visitar `/canal-de-integridade`, abrir formulario e validar categoria, descricao, identidade e boa-fe.
- [ ] Validar tipos de arquivo, 25 MB/arquivo, maximo 10 e remocao antes do envio.
- [ ] Usar um relato de teste **expressamente autorizado** pelo responsavel do canal para validar protocolo e uploads.
- [ ] Com o codigo de teste, consultar `/canal-de-integridade/acompanhar` e confirmar status/historico.
- [ ] Anexar mais um arquivo na consulta e validar que o limite e aplicado pelo backend.
- [ ] Verificar que protocolo incorreto e segredo incorreto nao expõem dados.
- [ ] Verificar que relato encerrado impede novas evidencias.
- [ ] Testar refresh da URL de acompanhamento (fallback de SPA na Vercel).
- [ ] Verificar que links assinados expiram e que URLs nao assinadas nao acessam arquivos.
- [ ] Revisar CORS e logs para garantir que segredos/codigos nao estejam registrados.

## Como aplicar em uma branch, sem publicar de imediato

```powershell
cd C:\Users\dev\Projetos\credvix-vercel-producao
git switch master
git pull --ff-only origin master
git switch -c feat/canal-integridade-completo
git apply --check "C:\CAMINHO\credvix-integridade-v2.patch"
git apply "C:\CAMINHO\credvix-integridade-v2.patch"
npm ci
npm run build
git diff --check
git add -A
git commit -m "feat: integrar relatos anexos e acompanhamento do canal"
git push -u origin feat/canal-integridade-completo
```

A Vercel deve gerar um Preview. **Nao fazer merge na master ate concluir a homologacao.**

## Rollback

O branch/commit original da master permanece intacto ate o merge. Depois do merge, use o rollback da Vercel e/ou `git revert -m 1 <SHA_DO_MERGE>` em master (se houve merge commit), com a aprovacao do responsavel.
