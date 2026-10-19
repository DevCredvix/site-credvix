import asyncio
import unittest

from sync_solides import (
    PORTAL, listing_count, parse_details, safe_job_url, read_visible_links,
    has_open_application_button, collect_listed_jobs,
)


class SyncVagasTests(unittest.TestCase):
    def test_aceita_apenas_link_da_empresa(self):
        self.assertEqual(safe_job_url('/vaga/550013'), (PORTAL + 'vaga/550013', '550013'))
        self.assertIsNone(safe_job_url('https://outro.vagas.solides.com.br/vaga/550013'))
        self.assertIsNone(safe_job_url('https://credvix.vagas.solides.com.br.evil.test/vaga/550013'))
        self.assertIsNone(safe_job_url('javascript:alert(1)'))
        self.assertIsNone(safe_job_url('/vaga/codigo-invalido'))

    def test_extraia_dados_confirmados_sem_inventar(self):
        text = '''SUPERVISOR DE VENDAS - COLATINA - ES
MIRIAN SILVA TEIXEIRA
Quero me candidatar
Colatina - ES
1 posição
R$ 2.139
Integral
CLT
Presencial
Junior
Comercial
Descrição da vaga'''
        job = parse_details(text, 'SUPERVISOR DE VENDAS - COLATINA - ES',
                            PORTAL + 'vaga/550013', 'Postada há 9 dias')
        self.assertEqual(job['state'], 'ES')
        self.assertEqual(job['location'], 'Colatina - ES')
        self.assertEqual(job['salary'], 'R$ 2.139')
        self.assertEqual(job['postedLabel'], 'Postada há 9 dias')
        self.assertEqual(job['workMode'], 'Presencial')
        self.assertEqual(job['seniority'], 'Junior')
        self.assertTrue(job['open'])

    def test_nao_inventa_salario_ou_data(self):
        job = parse_details('Cargo X\nSão Paulo - SP\nIntegral\nPresencial', 'Cargo X',
                            PORTAL + 'vaga/358758', '')
        self.assertEqual(job['salary'], '')
        self.assertEqual(job['postedLabel'], '')

    def test_paginacao(self):
        self.assertEqual(listing_count('Mostrando 1 - 12 de 24 vagas encontradas'), 24)
        self.assertEqual(listing_count('0 vagas encontradas'), 0)
        self.assertIsNone(listing_count('Faça parte da nossa equipe'))

    def test_vaga_so_e_ativa_com_candidatura_habilitada(self):
        async def run():
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                import os
                browser = await p.chromium.launch(
                    executable_path='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None,
                    args=['--no-sandbox'],
                )
                page = await browser.new_page()
                await page.set_content('<button type="button">Quero me candidatar</button>')
                active = await has_open_application_button(page)
                await page.set_content('<button disabled>Quero me candidatar</button>')
                blocked = await has_open_application_button(page)
                await page.set_content('<button>Vaga encerrada</button>')
                no_cta = await has_open_application_button(page)
                await browser.close()
                return active, blocked, no_cta
        self.assertEqual(asyncio.run(run()), (True, False, False))

    def test_link_e_data_em_dom(self):
        async def run():
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                import os
                browser = await p.chromium.launch(
                    executable_path='/usr/bin/chromium' if os.path.exists('/usr/bin/chromium') else None,
                    args=['--no-sandbox'],
                )
                page = await browser.new_page()
                await page.set_content('''
                    <article><h3>Consultor de Vendas</h3><p>Vila Velha - ES</p>
                    <p>Postada há 2 dias</p>
                    <a href="https://credvix.vagas.solides.com.br/vaga/358758">Ver vaga</a></article>
                    <article><a href="https://exemplo.com/vaga/123456">Outra empresa</a></article>
                ''')
                result = await read_visible_links(page)
                await browser.close()
                return result
        result = asyncio.run(run())
        self.assertEqual(list(result), ['358758'])
        self.assertEqual(result['358758']['posted'], 'Postada há 2 dias')

    def test_coleta_32_vagas_em_3_paginas_reais_de_dom(self):
        """Teste de navegador sem acessar a Solides: 12 + 12 + 8, pagina numerada."""
        async def run():
            from playwright.async_api import async_playwright
            from os import path
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    executable_path='/usr/bin/chromium' if path.exists('/usr/bin/chromium') else None,
                    args=['--no-sandbox'],
                )
                page = await browser.new_page()
                markup = r'''<!doctype html><html lang="pt-BR"><head><base href="https://credvix.vagas.solides.com.br/"></head><body>
                    <p id="total"></p><main id="jobs"></main><nav id="nav"></nav>
                    <script>
                    let pageNo = 0;
                    function render(){
                      const start = pageNo * 12;
                      const end = Math.min(start + 12, 32);
                      document.getElementById('total').innerText =
                        `Mostrando ${start+1} - ${end} de 32 vagas encontradas`;
                      document.getElementById('jobs').innerHTML =
                        Array.from({length: end-start}, (_, i) => {
                          const id = 600000 + start + i;
                          return `<article><p>Postada há 3 dias</p><a href="/vaga/${id}">Ver Vaga</a></article>`;
                        }).join('');
                      document.getElementById('nav').innerHTML = end < 32
                        ? `<button type="button" onclick="pageNo++;render()">${pageNo+2}</button>` : '';
                    }
                    render();
                    </script></body></html>'''
                from unittest.mock import AsyncMock, patch
                await page.set_content(markup)
                with patch.object(page, 'goto', new=AsyncMock(return_value=type('FakeResponse', (), {'status': 200})())):
                    found = await collect_listed_jobs(page)
                await browser.close()
                return found
        found = asyncio.run(run())
        self.assertEqual(len(found), 32)
        self.assertEqual(len(set(found)), 32)
        self.assertEqual(found['600031']['url'], PORTAL + 'vaga/600031')
        self.assertEqual(found['600000']['posted'], 'Postada há 3 dias')

    def test_indice_que_mostra_32_mas_traz_12_rejeita_coleta_parcial(self):
        async def run():
            from playwright.async_api import async_playwright
            from os import path
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    executable_path='/usr/bin/chromium' if path.exists('/usr/bin/chromium') else None,
                    args=['--no-sandbox'],
                )
                page = await browser.new_page()
                markup = '<head><base href="https://credvix.vagas.solides.com.br/"></head><body><p>Mostrando 1 - 12 de 32 vagas encontradas</p>' + ''.join(
                    f'<a href="/vaga/{600000 + index}">Ver Vaga</a>' for index in range(12)) + '</body>'
                from unittest.mock import AsyncMock, patch
                await page.set_content(markup)
                with patch.object(page, 'goto', new=AsyncMock(return_value=type('FakeResponse', (), {'status': 200})())):
                    try:
                        await collect_listed_jobs(page)
                    except RuntimeError as exc:
                        result = str(exc)
                    else:
                        result = ''
                await browser.close()
                return result
        self.assertIn('12 de 32', asyncio.run(run()))


    def test_coleta_quantidade_dinamica_sem_limite_de_12_paginas_ou_120_vagas(self):
        """157 vagas em 14 paginas: nenhum teto artificial para vagas ou paginas."""
        async def run(total):
            from os import path
            from unittest.mock import AsyncMock, patch
            from playwright.async_api import async_playwright
            async with async_playwright() as playwright:
                browser = await playwright.chromium.launch(
                    executable_path='/usr/bin/chromium' if path.exists('/usr/bin/chromium') else None,
                    args=['--no-sandbox'],
                )
                page = await browser.new_page()
                # O numero de resultados e informado pela propria pagina simulada.
                # Os testes nao entram no portal da Solides.
                markup = f"""<!doctype html><html lang='pt-BR'>
                <head><base href='https://credvix.vagas.solides.com.br/'></head>
                <body><p id='total'></p><main id='jobs'></main><nav id='nav'></nav>
                <script>
                let pageNo = 0;
                const total = {total};
                function render() {{
                  const start = pageNo * 12;
                  const end = Math.min(start + 12, total);
                  document.getElementById('total').innerText =
                    `Mostrando ${{start+1}} - ${{end}} de ${{total}} vagas encontradas`;
                  document.getElementById('jobs').innerHTML =
                    Array.from({{length: end-start}}, (_, i) => {{
                      const id = 600000 + start + i;
                      return `<article><a href='/vaga/${{id}}'>Ver Vaga</a></article>`;
                    }}).join('');
                  document.getElementById('nav').innerHTML = end < total
                    ? `<button type='button' onclick='pageNo++;render()'>${{pageNo+2}}</button>` : '';
                }}
                render();
                </script></body></html>"""
                await page.set_content(markup)
                with patch.object(page, 'goto', new=AsyncMock(
                    return_value=type('FakeResponse', (), {'status': 200})()
                )), patch.object(page, 'wait_for_timeout', new=AsyncMock()):
                    found = await collect_listed_jobs(page)
                await browser.close()
                return found
        for total in (5, 32, 157):
            with self.subTest(total=total):
                found = asyncio.run(run(total))
                self.assertEqual(len(found), total)
                self.assertEqual(len(set(found)), total)
                self.assertEqual(found[str(600000 + total - 1)]['url'],
                                 PORTAL + f'vaga/{600000 + total - 1}')


if __name__ == '__main__':
    unittest.main()
