import { test, expect, abrirCom, treino, diaDaSemana, lerSessoes, testeBruto } from "./apoio.js";

/* Antes deste trabalho, um único registro malformado no armazenamento deixava a
   tela em branco, sem caminho de volta de dentro do app. */
test.describe("dados malformados no armazenamento", () => {
  const bom = () => treino(diaDaSemana(0, 0), { z2: 30 });

  test("registro sem o campo zones é descartado e o app abre", async ({ page }) => {
    await abrirCom(page, [bom(), { id: "velho", date: "2026-07-20", total: 60 }]);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semana");
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
    expect(await lerSessoes(page)).toHaveLength(1);
  });

  test("o descarte é avisado, não silencioso", async ({ page }) => {
    await abrirCom(page, [bom(), { date: "2026-07-20" }, { lixo: true }]);
    await expect(page.getByText(/registros ilegíveis foram descartados/)).toBeVisible();
  });

  test("zona faltando não vira NaN na tela", async ({ page }) => {
    await abrirCom(page, [
      { id: "x", date: diaDaSemana(0, 0).toISOString().slice(0, 10), zones: { z2: 30 } },
    ]);
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
    await expect(page.getByText("NaN")).toHaveCount(0);
  });

  test("total em desacordo com as zonas é recalculado", async ({ page }) => {
    await abrirCom(page, [{ ...bom(), total: 9999 }]);
    await expect(page.getByTestId("semana-minutos")).toHaveText("30");
  });

  test("armazenamento com lixo no lugar da lista abre como app novo", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("eliptico:v5:sessoes", '{"não":"é uma lista"}');
      localStorage.setItem("eliptico:v5:config", JSON.stringify({ demoLimpo: true }));
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semana");
    await expect(page.getByRole("button", { name: "Registrar treino" })).toBeVisible();
  });

  test("JSON corrompido no armazenamento não impede a abertura", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("eliptico:v5:sessoes", "{isto não é JSON");
      localStorage.setItem("eliptico:v5:config", JSON.stringify({ demoLimpo: true }));
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Semana");
  });
});

/* O limite de erro cobre o que a normalização não previu. Aqui a falha é
   injetada numa API do navegador, para exercitar a rede sem depender de um
   defeito específico do app. */
testeBruto.describe("tela de recuperação", () => {
  testeBruto("aparece quando a renderização falha, em vez de tela em branco", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("eliptico:v5:config", JSON.stringify({ demoLimpo: true }));
      localStorage.setItem(
        "eliptico:v5:sessoes",
        JSON.stringify([
          { id: "a", date: "2026-07-20", zones: { z1: 0, z2: 30, z3: 0, z4: 0, z5: 0 } },
        ]),
      );
      Date.prototype.toLocaleDateString = () => {
        throw new Error("falha simulada de localização");
      };
    });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "O app não conseguiu abrir" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Baixar cópia dos dados/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  });

  testeBruto("a cópia dos dados pode ser baixada mesmo com o app quebrado", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("eliptico:v5:config", JSON.stringify({ demoLimpo: true }));
      localStorage.setItem(
        "eliptico:v5:sessoes",
        '[{"id":"a","date":"2026-07-20","zones":{"z2":30}}]',
      );
      Date.prototype.toLocaleDateString = () => {
        throw new Error("falha simulada");
      };
    });
    await page.goto("/");

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Baixar cópia dos dados/ }).click();
    const caminho = await (await download).path();
    expect(caminho).toBeTruthy();
  });

  testeBruto("apagar tudo exige confirmação", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("eliptico:v5:config", JSON.stringify({ demoLimpo: true }));
      localStorage.setItem(
        "eliptico:v5:sessoes",
        '[{"id":"a","date":"2026-07-20","zones":{"z2":30}}]',
      );
      Date.prototype.toLocaleDateString = () => {
        throw new Error("falha simulada");
      };
    });
    await page.goto("/");

    await page.getByRole("button", { name: /Limpar os dados e recomeçar/ }).click();
    await expect(page.getByText(/não tem volta/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Confirmar e apagar tudo/ })).toBeVisible();
  });
});
