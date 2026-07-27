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

  test("o fundo para de rolar enquanto a folha está aberta", async ({ page }) => {
    await abrirCom(page, dois());
    const antes = await page.evaluate(() => getComputedStyle(document.body).overflow);
    await abrirFolha(page);
    const durante = await page.evaluate(() => getComputedStyle(document.body).overflow);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const depois = await page.evaluate(() => getComputedStyle(document.body).overflow);

    expect(durante).toBe("hidden");
    expect(depois).toBe(antes);
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
