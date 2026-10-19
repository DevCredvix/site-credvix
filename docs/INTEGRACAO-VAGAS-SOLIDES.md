# Vagas Credvix — integracao com a Solides

## Fonte unica

- Portal publico oficial: https://credvix.vagas.solides.com.br/
- O site NAO possui cadastro proprio de vagas; apresenta o manifesto `public/vagas-solides.json`, alimentado a partir da Solides.
- O manifesto antigo tem apenas 4 URLs catalogadas manualmente. **Nao e uma listagem completa**. E indispensavel executar a sincronizacao real antes de publicar este patch; nao adicionar IDs descobertos em buscadores como substituto de vagas atuais.
- Nao use um total estimado (por exemplo, "cerca de 32 vagas") como criterio de publicacao. A fonte oficial determina o total a cada sincronizacao.
- Cards usam apenas vagas presentes na listagem publica da empresa e verificadas individualmente.
- O card inteiro e o botao visual `Ver vaga` sao o **mesmo link**, exatamente no dominio oficial.
- Sem data, salario ou senioridade confirmados? O campo nao e exibido.
- O filtro de categoria/banco de talentos foi removido; o banco de talentos tera uma etapa propria.

## Sincronizacao automatica

GitHub Actions > **Atualizar vagas da Solides** > **Run workflow** executa
`scripts/sync_solides.py`. O workflow tambem roda a cada 6 horas.

O script usa Playwright Chromium para ler o portal como um candidato: aguarda
o JavaScript, percorre a paginacao, tenta carregar novas vagas por scroll/botao,
extrai as URLs do **indice oficial** e confere cada pagina individual.
A candidatura pode estar temporariamente indisponivel ou exigir login;
a ausencia momentanea de CTA nao encerra uma vaga que continua na listagem
oficial e na pagina de detalhe. Mensagens explicitas de encerramento invalidam
os anuncios.

**Regra obrigatoria:** a quantidade de vagas e **dinamica**, sem numero fixo
ou limite artificial de 12 paginas/120 vagas. O total publicado pela Solides
(`N`) deve coincidir com o numero de IDs distintos encontrados e com o numero
de detalhes verificados: **N = IDs encontrados = vagas validadas**.
Qualquer falha/interrupcao mantem o manifesto anterior sem publicar uma
listagem parcial. Nunca usar o fallback de apenas 4 URLs antigas, nem
buscadores como fonte de vagas abertas.
O sincronizador somente atualiza `public/vagas-solides.json` quando a coleta
for integral e consistente. O workflow faz commit deste arquivo em `master` e o
deployment na Vercel se atualiza automaticamente (se GitHub Actions puder gravar
na branch e a integracao automatica da Vercel estiver habilitada).

### Primeiro uso

1. Fazer merge do patch, validar build, conferir as configuracoes de Actions.
2. No GitHub, abrir `Actions > Atualizar vagas da Solides > Run workflow`.
3. Conferir os logs, que devem mostrar `LISTAGEM COMPLETA: N` e
   `VALIDACAO COMPLETA: N de N`, com `N` lido da Solides em cada execucao.
   Se falhar, **nao fazer deploy com o conjunto manual antigo**.
4. Revalidar no Preview e Production a categoria removida, cards e links.

O manifesto atual (4 registros) foi gerado manualmente e esta incompleto.
**Antes de publicar em producao**, faca a sincronizacao real no seu ambiente
ou em GitHub Actions e confira `verificationMethod: live-browser-index`,
`indexCount` e o total de vagas (todos precisam corresponder). Nao fazer deploy
com o manifesto manual de 4 vagas se a fonte anunciar mais vagas.
O manifesto fica invalido depois de 18 horas sem sincronizacao.
Se a Solides indicar que nao ha vagas, nao mantenha os quatro registros iniciais.
Nenhum link para a homepage da Solides e exibido como substituto dos cards.

### Comportamento em falhas

- Se nao puder confirmar a listagem, a paginacao ou os detalhes das vagas,
  a rotina falha e **nao altera** o manifesto.
- Se o manifesto tiver mais de 18h, o frontend oculta os cards ate nova
  verificacao para evitar anunciar vagas encerradas.
- Nao existe garantia de verificacao instante a instante. Entre as sincronizacoes,
  uma vaga pode encerrar na Solides. A pagina final da vaga e a fonte definitiva.
- Se Sólides mudar a estrutura do HTML/rotas, sera preciso atualizar o extrator.

## Executar localmente (desenvolvimento)

Instalar `pip install playwright==1.56.0` e `python -m playwright install chromium`.
Rodar `python -m unittest discover -s scripts -p test_sync_solides.py`, depois
`python scripts/sync_solides.py` e conferir as contagens antes de `npm run build`.
O sincronizador deve coletar todas as paginas; falhas nao geram arquivo parcial.
Se falhar no GitHub Actions, baixar o artifact **diagnostico-solides-listagem**
com a captura publica da listagem para verificar seletores/paginacao.
O script nao utiliza credenciais ou cookies de recrutadores.

## Dados e seguranca

A rota `/vagas` nunca recebe dados pessoais de candidatos. O scraping se limita
a conteudo publico de vagas da Credvix. Nenhuma `service_role`, token de RH, ou
login da Solides fica no browser, no GitHub ou no manifesto.

O site nao armazena candidaturas. Para se inscrever, o usuario e enviado para a
pagina exata da oportunidade no dominio oficial da Solides.

## Novo estado inicial e CTA final

- Ao entrar em `/vagas`, mostra o convite inicial da referencia visual; os cards
  so aparecem quando a pessoa usa os filtros ou clica em `Ver todas as vagas`.
- Continua sem o filtro Categoria, removido na etapa anterior. O layout e os
  cards permanecem limitados ao `cvx-shell`, com largura de 920px.
- O CTA final da pagina aponta para `https://credvix.vagas.solides.com.br/`.

## Banco de talentos — redirecionamento oficial

- O botao laranja `Banco de talentos`, ao lado de `Ver todas as vagas`, abre
  diretamente `https://credvix.vagas.solides.com.br/#banco-de-talentos`.
- O seletor de arquivos local, feedback de curriculo anexado e validacao de
  PDF/DOCX/JPEG foram removidos. Nenhum curriculo e recebido ou armazenado
  pela pagina da Credvix.
- Todo cadastro e consentimento do candidato acontecem diretamente na Solides.
- A area inicial de filtros mantem a largura de 920px e o `cvx-shell`.
- O filtro Categoria segue removido conforme a decisao anterior; somente
  Localidade e Nome da vaga foram mantidos.
