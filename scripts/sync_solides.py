#!/usr/bin/env python3
"""Sincroniza SOMENTE vagas publicadas no portal oficial da Credvix na Solides.

Requisitos: Python 3.12+, playwright, Chromium instalado.
Executar: python scripts/sync_solides.py

A listagem completa no portal oficial e obrigatoria: nao aceita manter
um subconjunto de links antigos quando a navegacao falhar. O numero de
vagas e dinamico: o total informado pela Solides deve coincidir com a
quantidade de IDs distintos e paginas de detalhe validadas.
Nao cria manifesto parcial, nem mistura links de buscadores.
O frontend oculta automaticamente manifestos mais antigos que 18 horas.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

PORTAL = 'https://credvix.vagas.solides.com.br/'
HOST = 'credvix.vagas.solides.com.br'
OUTPUT = Path(__file__).resolve().parents[1] / 'public' / 'vagas-solides.json'
EMPTY_MARKERS = (
    'ainda não há vagas abertas',
    'nenhuma vaga encontrada',
    'não encontramos vagas',
    'nenhuma vaga aberta',
)
CLOSED_MARKERS = (
    'esta vaga foi encerrada',
    'esta vaga está encerrada',
    'esta vaga não está mais disponível',
    'vaga não encontrada',
    'vaga encerrada',
)
STATES = {
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
}
POSTED_RE = re.compile(r'\bPostad[ao]\s+h[aá]\s+(?:\d+\s+(?:dias|dia|meses|m[eê]s|anos|ano)|pouco tempo)\b', re.I)
LOCATION_RE = re.compile(r'^[\wÀ-ÿ][\wÀ-ÿ .\-/(),]+\s+-\s+([A-Z]{2})$', re.U)
SALARY_RE = re.compile(r'^R\$\s*(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{2})?$', re.I)
VALID_MODES = ('Presencial', 'Híbrido', 'Remoto')
VALID_LEVELS = (
    'Junior', 'Júnior', 'Pleno', 'Sênior', 'Senior', 'Especialista', 'Estagiário',
    'Aprendiz', 'Trainee', 'Principal',
)


def safe_job_url(raw: str) -> tuple[str, str] | None:
    """Permite SOMENTE /vaga/{id} no subdominio oficial (com query original)."""
    if not isinstance(raw, str) or not raw:
        return None
    url = urlparse(urljoin(PORTAL, raw))
    if url.scheme != 'https' or url.hostname != HOST or url.port or url.username or url.password or url.fragment:
        return None
    match = re.fullmatch(r'/vaga/(\d{3,12})/?', url.path)
    if not match:
        return None
    return url.geturl(), match.group(1)


def parse_details(text: str, title: str, url: str, posted: str) -> dict:
    """Nao infere valores inexistentes. Linhas iniciais: informacoes de vaga da Solides."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    top = lines[:40]
    location = next((line for line in top if line != title.strip() and LOCATION_RE.fullmatch(line) and
                     LOCATION_RE.fullmatch(line).group(1) in STATES), '')
    match = LOCATION_RE.fullmatch(location) if location else None
    state = match.group(1) if match else ''
    salary = next((line for line in top if SALARY_RE.fullmatch(line)), '')
    mode = next((line for line in top if line in VALID_MODES), '')
    seniority = next((line for line in top if line in VALID_LEVELS), '')
    posted_match = POSTED_RE.search(posted)
    job_id = safe_job_url(url)
    if not job_id or not title.strip():
        raise ValueError('Detalhes de vaga sem URL/id e titulo validos')
    return {
        'id': job_id[1],
        'url': job_id[0],
        'title': title.strip(),
        'location': location,
        'state': state,
        'salary': salary,
        'postedLabel': posted_match.group(0) if posted_match else '',
        'workMode': mode,
        'seniority': seniority,
        'open': True,
    }


def listing_count(text: str) -> int | None:
    match = re.search(r'Mostrando\s+\d+\s*[-–]\s*\d+\s+de\s+(\d+)\s+vagas?', text, re.I)
    if match:
        return int(match.group(1))
    match = re.search(r'\b(\d+)\s+vagas?\s+encontradas?\b', text, re.I)
    return int(match.group(1)) if match else None


# Captura URLs e o tempo de publicacao visivel junto ao link da vaga.
# Nunca segue links vindos de outras empresas ou dominios externos.
LINK_SCAN_JS = """() => {
  const out = [];
  for (const a of document.querySelectorAll('a[href*="/vaga/"]')) {
    const raw = a.href;
    let posted = '';
    let parent = a;
    for (let depth = 0; depth < 6 && parent; depth++, parent = parent.parentElement) {
      const text = parent.innerText || '';
      const match = text.match(/Postad[ao]\\s+h[aá]\\s+(?:\\d+\\s+(?:dias|dia|meses|m[eê]s|anos|ano)|pouco tempo)/i);
      if (match && text.length < 2200) { posted = match[0]; break; }
    }
    out.push({url: raw, posted});
  }
  return out;
}"""


async def read_visible_links(page) -> dict[str, dict]:
    rows = await page.evaluate(LINK_SCAN_JS)
    result = {}
    for row in rows:
        parsed = safe_job_url(row.get('url', ''))
        if parsed:
            url, job_id = parsed
            result[job_id] = {'url': url, 'posted': str(row.get('posted') or '')}
    return result


async def click_card_links(page) -> dict[str, dict]:
    """Fallback quando o portal usa botoes de navegacao sem <a href>."""
    from playwright.async_api import TimeoutError as BrowserTimeout
    results = {}
    # Nao clica em banners de outros sites: apenas botoes com texto 'Ver Vaga'.
    for index in range(await page.get_by_text(re.compile(r'^ver\s+vaga$', re.I)).count()):
        candidate = page.get_by_text(re.compile(r'^ver\s+vaga$', re.I)).nth(index)
        try:
            posted = await candidate.evaluate("""node => {
              let parent = node;
              for(let i=0;i<6 && parent;i++,parent=parent.parentElement){
                const text=parent.innerText || '';
                const m=text.match(/Postad[ao]\\s+h[aá]\\s+\\d+\\s+(?:dias|dia|meses|m[eê]s|anos|ano)/i);
                if(m && text.length<2200) return m[0];
              }
              return '';
            }""")
            await candidate.click(timeout=8000)
            try:
                await page.wait_for_url(re.compile(r'/vaga/\d+'), timeout=10000)
                parsed = safe_job_url(page.url)
                if parsed:
                    results[parsed[1]] = {'url': parsed[0], 'posted': posted}
                await page.go_back(wait_until='domcontentloaded', timeout=15000)
                await page.wait_for_timeout(600)
            except BrowserTimeout:
                # Em caso de abertura em nova aba ou modal nao reconhecido,
                # nao aprova a vaga; proxima validacao falhara com contagem.
                await page.goto(PORTAL, wait_until='domcontentloaded', timeout=30000)
        except Exception as exc:
            print(f'[sync-vagas] Nao foi possivel resolver botao {index + 1}: {type(exc).__name__}')
    return results


async def visible_vaga_count(page) -> int:
    """Conta a grade visivel, com link ou CTA de um card React."""
    return await page.evaluate(r"""() => {
      const a = new Set([...document.querySelectorAll('a[href*="/vaga/"]')]
        .filter(e => e.getClientRects().length > 0)
        .map(e => (e.href.match(/\/vaga\/(\d+)/) || [])[1]).filter(Boolean)).size;
      const buttons = [...document.querySelectorAll('button, a, [role="button"]')]
        .filter(e => e.getClientRects().length > 0 && /^ver\s+vaga$/i.test((e.innerText || '').trim())).length;
      return Math.max(a, buttons);
    }""")


async def reveal_lazy_jobs(page) -> None:
    """Suporta paginas com cards carregados sob demanda ao rolar a tela."""
    stalled = 0
    previous = await visible_vaga_count(page)
    # A quantidade de rolagens depende do conteudo, nao de um teto de vagas.
    # O loop termina quando duas rolagens nao revelam novos cards.
    while stalled < 2:
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        await page.wait_for_timeout(950)
        current = await visible_vaga_count(page)
        if current > previous:
            previous = current
            stalled = 0
        else:
            stalled += 1


async def go_next_page(page, current: int) -> bool:
    """Avanca nas paginas da listagem; nunca clica em uma vaga arbitraria."""
    next_page = str(current + 2)
    selectors = [
        page.get_by_role('button', name=next_page, exact=True),
        page.get_by_role('link', name=next_page, exact=True),
        page.get_by_role('button', name=re.compile(r'^pr[oó]xim[ao]$', re.I)),
        page.get_by_role('link', name=re.compile(r'^pr[oó]xim[ao]$', re.I)),
        page.locator('button[aria-label*="next" i]'),
        page.locator('button[aria-label*="próxim" i]'),
        page.locator('[aria-label="Go to next page"]'),
    ]
    for locator in selectors:
        if await locator.count() == 0:
            continue
        button = locator.first
        if not await button.is_visible() or not await button.is_enabled():
            continue
        before = await page.locator('body').inner_text()
        await button.click(timeout=8000)
        try:
            await page.wait_for_function(
                '(old) => document.body.innerText !== old', arg=before, timeout=16000)
        except Exception:
            raise RuntimeError(f'A pagina {current + 2} nao carregou apos paginar')
        await page.wait_for_timeout(500)
        return True
    return False


async def load_more_jobs(page) -> bool:
    """Alguns portais expandem a grade com 'Carregar mais' em vez de paginar."""
    selectors = [
        page.get_by_role('button', name=re.compile(r'^(?:carregar|mostrar|ver) mais(?: vagas)?$', re.I)),
        page.get_by_role('link', name=re.compile(r'^(?:carregar|mostrar|ver) mais(?: vagas)?$', re.I)),
    ]
    for locator in selectors:
        if await locator.count() == 0:
            continue
        button = locator.first
        if not await button.is_visible() or not await button.is_enabled():
            continue
        before = await visible_vaga_count(page)
        await button.click(timeout=8000)
        try:
            await page.wait_for_function(r"""n => {
              const a = new Set([...document.querySelectorAll('a[href*="/vaga/"]')]
                .map(e => (e.href.match(/\/vaga\/(\d+)/) || [])[1]).filter(Boolean)).size;
              const b = [...document.querySelectorAll('button, a, [role="button"]')]
                .filter(e => /^ver\s+vaga$/i.test((e.innerText || '').trim())).length;
              return Math.max(a,b) > n;
            }""", arg=before, timeout=16000)
        except Exception:
            raise RuntimeError('A opcao Carregar mais nao apresentou novas vagas')
        return True
    return False


async def collect_listed_jobs(page) -> dict[str, dict]:
    response = await page.goto(PORTAL, wait_until='domcontentloaded', timeout=45000)
    if response is None or response.status != 200:
        raise RuntimeError('O portal oficial nao esta acessivel; nao atualizamos o catalogo')
    try:
        await page.wait_for_load_state('networkidle', timeout=12000)
    except Exception:
        pass
    # SPA: aguarda os resultados carregados via Javascript em vez de ler so o HTML estatico.
    try:
        await page.wait_for_function(r"""() => {
          const body = document.body?.innerText || '';
          return /Mostrando\s+\d+\s*[-–]\s*\d+\s+de\s+\d+\s+vagas?/i.test(body) ||
            /\b0 vagas? encontradas?\b/i.test(body) ||
            document.querySelector('a[href*="/vaga/"]') ||
            [...document.querySelectorAll('button,a')].some(x => /^ver\s+vaga$/i.test((x.innerText || '').trim()));
        }""", timeout=18000)
    except Exception:
        raise RuntimeError('A listagem nao carregou dentro do prazo; dados anteriores preservados')

    found: dict[str, dict] = {}
    expected: int | None = None
    seen_pages: set[tuple[str, ...]] = set()

    page_no = 0
    while True:
        await reveal_lazy_jobs(page)
        body = await page.locator('body').inner_text(timeout=10000)
        count = listing_count(body)
        if count is not None:
            if expected is not None and expected != count:
                raise RuntimeError(f'O total de vagas mudou durante a coleta: {expected} -> {count}')
            expected = count
        if count == 0 and page_no == 0:
            print('[sync-vagas] Portal informou explicitamente 0 vagas.')
            return {}

        rows = await read_visible_links(page)
        visible = await visible_vaga_count(page)
        if not rows or len(rows) < visible:
            # Caso a Sólides use onclick/router.push sem <a href> em todos os cards.
            rows.update(await click_card_links(page))
        if not rows:
            raise RuntimeError('Nao foi possivel descobrir URLs de vagas na listagem oficial')
        signature = tuple(sorted(rows))
        if signature in seen_pages:
            raise RuntimeError('Paginacao repetiu uma pagina; sincronizacao interrompida')
        seen_pages.add(signature)
        found.update(rows)
        print(f'[sync-vagas] Pagina {page_no + 1}: {len(rows)} vagas, acumuladas {len(found)}'
              + (f' de {expected}' if expected is not None else ''))
        if expected is not None and len(found) > expected:
            raise RuntimeError(
                f'COLETA INCONSISTENTE: {len(found)} IDs para {expected} vagas anunciadas.'
            )
        if expected is not None and len(found) == expected:
            break
        if await go_next_page(page, page_no):
            page_no += 1
            continue
        if await load_more_jobs(page):
            page_no += 1
            continue
        if expected is not None and len(found) < expected:
            raise RuntimeError(f'COLETA INCOMPLETA: {len(found)} de {expected} vagas. Nao atualizar catalogo!')
        break

    if expected is not None and len(found) != expected:
        raise RuntimeError(f'COLETA INCOMPLETA: {len(found)} de {expected} vagas. Nao atualizar catalogo!')
    if expected is None:
        raise RuntimeError('Nao foi possivel confirmar o TOTAL publicado na Solides; evitar catalogo parcial')
    return found


async def has_open_application_button(page) -> bool:
    """Vagas publicadas devem oferecer CTA de candidatura, ou pausa temporaria."""
    button = page.get_by_role('button', name=re.compile(r'quero\s+me\s+candidatar', re.I))
    link = page.get_by_role('link', name=re.compile(r'quero\s+me\s+candidatar', re.I))
    for elements in (button, link):
        for i in range(min(await elements.count(), 5)):
            candidate = elements.nth(i)
            if await candidate.is_visible() and await candidate.is_enabled():
                return True
    return False


async def verify_detail(context, url: str, posted: str) -> dict | None:
    page = await context.new_page()
    try:
        response = await page.goto(url, wait_until='domcontentloaded', timeout=30000)
        requested = safe_job_url(url)
        final = safe_job_url(page.url)
        if response is None or response.status != 200 or not requested or not final or requested[1] != final[1]:
            return None
        title_node = page.locator('h1').first
        await title_node.wait_for(state='visible', timeout=12000)
        body = await page.locator('body').inner_text(timeout=12000)
        if any(marker in body.casefold() for marker in CLOSED_MARKERS):
            return None
        # A vaga ja foi confirmada no indice completo e na pagina individual.
        # O botao de candidatura pode nao aparecer para anonimos, ser ativado em
        # outro horario ou depender de login; isso NAO significa vaga encerrada.
        # O criterio de exclusao e anuncio removido, pagina invalida ou sinal
        # EXPLICITO de encerramento, nunca a ausencia momentanea de CTA.
        title = (await title_node.inner_text()).strip()
        if not title or title.casefold() in ('vaga', 'vagas', 'pagina nao encontrada'):
            return None
        return parse_details(body, title, url, posted)
    except Exception as error:
        print(f'[sync-vagas] Falha ao verificar uma vaga: {type(error).__name__}')
        return None
    finally:
        await page.close()


async def sync() -> None:
    from playwright.async_api import async_playwright
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True, args=['--disable-dev-shm-usage'])
        try:
            context = await browser.new_context(locale='pt-BR', viewport={'width': 1440, 'height': 900})
            index = await context.new_page()
            try:
                listed = await collect_listed_jobs(index)
                print(f'[sync-vagas] LISTAGEM COMPLETA: {len(listed)} IDs distintos no portal oficial.')
            except Exception:
                # Diagnostico para inspecionar paginacao e layout SEM publicar dados
                # incompletos. Screenshot apenas do portal publico, sem login.
                try:
                    screenshot = Path(__file__).parent / 'debug-solides.png'
                    await index.screenshot(path=str(screenshot), full_page=True)
                    print('[sync-vagas] Captura para diagnostico:', screenshot)
                except Exception:
                    pass
                raise
            finally:
                await index.close()
            jobs = []
            # Limite de concorrencia para nao pressionar o portal da Solides.
            sem = asyncio.Semaphore(3)
            async def validate(source: dict) -> dict | None:
                async with sem:
                    return await verify_detail(context, source['url'], source['posted'])
            validated = await asyncio.gather(*(validate(v) for v in listed.values()))
            jobs = [v for v in validated if v is not None]
            # Para este portal cada vaga da lista precisa ter detalhe valido.
            # Nunca substitui uma listagem completa por um subconjunto de URLs antigas.
            if len(jobs) != len(listed):
                raise RuntimeError(
                    f'VALIDACAO INCOMPLETA: {len(jobs)} de {len(listed)} paginas de vaga. '
                    'Catalogo anterior preservado.')
            print(f'[sync-vagas] VALIDACAO COMPLETA: {len(jobs)} de {len(listed)} vagas.')
            manifest = {
                'source': PORTAL,
                'verifiedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                'verificationMethod': 'live-browser-index',
                'indexCount': len(listed),
                'jobs': jobs,
            }
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            temporary = OUTPUT.with_suffix('.json.tmp')
            temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            os.replace(temporary, OUTPUT)
            print(f'[sync-vagas] Manifesto atualizado em {OUTPUT}.')
        finally:
            await browser.close()


if __name__ == '__main__':
    asyncio.run(sync())
