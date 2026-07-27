import { test, expect, abrirCom, treino, diaDaSemana, lerSessoes } from "./apoio.js";

const dois = () => [treino(diaDaSemana(0, 0), { z2: 30 }), treino(diaDaSemana(0, 2), { z2: 45 })];

/* Regressão: a folha era só um `<div>` desenhado por cima. O teclado atravessava
   para o conteúdo de trás, o Esc não fazia nada e o fundo continuava rolando. */
test.describe("folha modal como diálogo", () => {
  const abrirFolha = async (page) => {
    await page.getByRole("button", { name: "Registrar treino" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  };

  test("declara papel de diálogo e nome acessível", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirFolha(page);

    const folha = page.getByRole("dialog");
    await expect(folha).toHaveAttribute("aria-modal", "true");
    await expect(folha).toHaveAttribute("aria-label", "Novo treino");
  });

  test("Esc fecha a folha", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirFolha(page);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("o foco fica preso dentro da folha", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirFolha(page);

    /* percorre bem mais elementos do que a folha tem: se vazasse, o foco cairia
       num botão da página de trás */
    for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");

    const dentro = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d?.contains(document.activeElement) ?? false;
    });
    expect(dentro, "o foco escapou da folha").toBe(true);
  });

  /* A defesa principal contra a tela de trás rolar é estrutural: nenhuma camada
     modal pode nascer dentro da div que rola. Enquanto nascia, todo arrasto sobre
     a folha subia a cadeia de ancestrais, encontrava o rolador e mexia a página
     atrás — que foi o que apareceu no iPhone. `overscroll-behavior` não cobre
     isso: ele só contém o gesto que começa dentro de algo rolável e chega ao fim,
     e o arrasto que começa no cabeçalho da folha ou no fundo escurecido nunca
     passa por lá. */
  test("nenhuma camada modal nasce dentro do que rola", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirFolha(page);

    const dentro = await page.evaluate(() => {
      const rolador = document.querySelector('[data-rolagem="app"]');
      return {
        folha: rolador.contains(document.querySelector('[role="dialog"]')),
        barra: rolador.contains(document.querySelector("nav")),
      };
    });
    expect(dentro.folha, "a folha está dentro do rolador").toBe(false);
    expect(dentro.barra, "a barra de abas está dentro do rolador").toBe(false);
  });

  test("a confirmação de exclusão também nasce fora do que rola", async ({ page }) => {
    await abrirCom(page, dois());
    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
    await page.getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();

    /* Esta é levantada de dentro de uma tela, não pelo App — o caso que uma
       correção só no App deixaria passar. */
    const dentro = await page.evaluate(() =>
      document
        .querySelector('[data-rolagem="app"]')
        .contains(document.querySelector('[role="alertdialog"]')),
    );
    expect(dentro, "a confirmação está dentro do rolador").toBe(false);
  });

  /* Este teste já existiu numa versão que media `document.body`, e passava sem
     proteger nada: quem rola no app é a div do conteúdo, e o `body` nunca teve
     barra de rolagem. */
  test("o fundo para de rolar, e volta exatamente onde estava", async ({ page }) => {
    await abrirCom(page, dois());
    const estado = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-rolagem="app"]');
        return {
          touchAction: getComputedStyle(el).touchAction,
          overflowY: getComputedStyle(el).overflowY,
          scrollTop: el.scrollTop,
        };
      });

    await page.evaluate(() =>
      document.querySelector('[data-rolagem="app"]').scrollTo({ top: 700 }),
    );
    await expect.poll(async () => (await estado()).scrollTop).toBeGreaterThan(0);
    const antes = await estado();

    await abrirFolha(page);
    const durante = await estado();
    expect(durante.touchAction, "o dedo ainda arrasta o fundo").toBe("none");
    /* Travar por `overflow` grampeia a posição no topo: era o salto que aparecia
       ao abrir a folha no iPhone. A posição tem de sobreviver ao travamento. */
    expect(durante.scrollTop, "a tela de trás saltou ao travar").toBe(antes.scrollTop);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await estado(), "o fundo não voltou como estava").toEqual(antes);
  });

  test("a folha e o escurecimento do fundo chegam juntos", async ({ page }) => {
    await abrirCom(page, dois());
    await page.getByRole("button", { name: "Registrar treino" }).click();

    /* Eram durações e curvas diferentes: a folha parava por volta dos 90 ms com o
       fundo ainda em 44% do escuro, que continuava a escurecer sozinho por mais
       160 ms. A abertura parecia dois movimentos em vez de um. */
    const quadros = [];
    for (let i = 0; i < 8; i++) {
      quadros.push(
        await page.evaluate(() => {
          const d = document.querySelector('[role="dialog"]');
          const escuro = document.querySelector("[data-fundo-folha]");
          const alvo = window.innerHeight - d.getBoundingClientRect().height;
          const caminho = d.getBoundingClientRect().top - alvo;
          return {
            /* 1 = ainda embaixo de tudo, 0 = no lugar */
            restante: caminho / d.getBoundingClientRect().height,
            escuro: Number(getComputedStyle(escuro).opacity),
            /* Opacidade efetiva da folha: a dela vezes a de cada ancestral. Ler
               só `getComputedStyle(d).opacity` não serve — dá 1 mesmo quando é o
               contêiner de cima que está esmaecendo, que era exatamente o caso. */
            opacidadeDaFolha: (() => {
              let o = 1;
              for (let el = d; el && el !== document.body; el = el.parentElement) {
                o *= Number(getComputedStyle(el).opacity);
              }
              return o;
            })(),
          };
        }),
      );
      await page.waitForTimeout(45);
    }

    /* enquanto a folha ainda tem caminho a percorrer, o fundo não pode já estar
       no escuro final, nem o contrário */
    for (const q of quadros) {
      const andado = 1 - q.restante;
      expect(
        Math.abs(andado - q.escuro),
        `folha em ${andado.toFixed(2)} e escuro em ${q.escuro.toFixed(2)}`,
      ).toBeLessThan(0.25);
      expect(q.opacidadeDaFolha, "a folha ficou translúcida durante a subida").toBe(1);
    }
  });

  test("o formulário rola até o fim sem arrastar a tela de trás", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirFolha(page);
    /* a folha ainda está subindo quando aparece; rolar no meio do trajeto acerta
       o lugar errado da tela */
    await page.waitForFunction(() =>
      document
        .querySelector('[role="dialog"]')
        .getAnimations()
        .every((a) => a.playState === "finished"),
    );

    const conteudo = () =>
      page.evaluate(() => {
        const c = document.querySelector('[role="dialog"]').lastElementChild;
        return {
          scrollTop: c.scrollTop,
          rolavel: c.scrollHeight > c.clientHeight,
          contido: getComputedStyle(c).overscrollBehaviorY,
        };
      });

    expect((await conteudo()).rolavel, "o formulário deveria ter o que rolar").toBe(true);
    expect((await conteudo()).contido, "o gesto vazaria para a tela de trás").toBe("contain");

    await page.mouse.move(200, 500);
    await page.mouse.wheel(0, 2000);
    await expect.poll(async () => (await conteudo()).scrollTop).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: "Salvar treino" })).toBeVisible();

    await page.mouse.wheel(0, -2000);
    await expect.poll(async () => (await conteudo()).scrollTop).toBe(0);
  });

  test("o foco volta para quem abriu a folha", async ({ page }) => {
    await abrirCom(page, dois());
    const botao = page.getByRole("button", { name: "Registrar treino" });
    await botao.focus();
    await botao.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const voltou = await page.evaluate(
      () => document.activeElement?.getAttribute("aria-label") === "Registrar treino",
    );
    expect(voltou, "o foco não voltou ao botão que abriu").toBe(true);
  });
});

/* Excluir é a única ação do app sem volta imediata. Passou a pedir confirmação,
   e o desfazer no aviso continua como segunda rede. */
test.describe("confirmação de exclusão", () => {
  const abrirDetalhe = async (page) => {
    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.locator("button").filter({ hasText: "TRIMP" }).first().click();
  };

  test("pedir para excluir abre a confirmação em vez de apagar", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirDetalhe(page);
    await page.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByText("Excluir este treino?")).toBeVisible();
    expect(await lerSessoes(page), "não pode apagar antes de confirmar").toHaveLength(2);
  });

  test("cancelar não apaga nada", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirDetalhe(page);
    await page.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(await lerSessoes(page)).toHaveLength(2);
  });

  test("Esc cancela a confirmação", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirDetalhe(page);
    await page.getByRole("button", { name: "Excluir" }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect(await lerSessoes(page)).toHaveLength(2);
  });

  test("confirmar apaga e o desfazer continua disponível", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirDetalhe(page);
    await page.getByRole("button", { name: "Excluir" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();

    expect(await lerSessoes(page)).toHaveLength(1);
    await page.getByRole("button", { name: "Desfazer" }).click();
    expect(await lerSessoes(page)).toHaveLength(2);
  });

  test("o foco começa em Cancelar, não no botão destrutivo", async ({ page }) => {
    await abrirCom(page, dois());
    await abrirDetalhe(page);
    await page.getByRole("button", { name: "Excluir" }).click();

    const foco = await page.evaluate(() => document.activeElement?.textContent);
    expect(foco).toBe("Cancelar");
  });
});
