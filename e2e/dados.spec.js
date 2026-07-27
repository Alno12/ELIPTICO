import {
  test,
  expect,
  abrirCom,
  abrirNovo,
  treino,
  diaDaSemana,
  lerSessoes,
  lerCfg,
} from "./apoio.js";

/* O histórico do usuário só existe no aparelho dele: o CSV é o único caminho de
   backup. Um defeito aqui perde dados em silêncio, então a ida e volta é o
   caminho mais importante do app depois de registrar treino. */
test.describe("exportar e importar", () => {
  test("reimportar o próprio arquivo não duplica nem perde treino", async ({ page }) => {
    const historico = [
      treino(diaDaSemana(1, 0), { z1: 8, z2: 30, z4: 4 }, { avgHr: 141, rpe: 6, notes: "teste" }),
      /* 20 s em Z3: o caso que obrigou a chave de deduplicação a normalizar
         para segundos inteiros, senão 20/60 e 0,3333 seriam treinos diferentes */
      treino(diaDaSemana(2, 2), { z2: 25, z3: 20 / 60 }),
    ];
    await abrirCom(page, historico);
    const antes = await lerSessoes(page);
    expect(antes).toHaveLength(2);

    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar", exact: true }).click();
    const csv = await (await download).path();
    expect(csv).toBeTruthy();

    await page.setInputFiles('input[type="file"]', csv);
    await expect(page.getByText(/já estavam no histórico|nenhum treino novo/i)).toBeVisible();

    const depois = await lerSessoes(page);
    expect(depois).toHaveLength(2);
  });

  test("limpar os exemplos zera o histórico e não ressemeia ao recarregar", async ({ page }) => {
    await abrirNovo(page);
    expect((await lerSessoes(page)).length).toBeGreaterThan(20);

    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await page.getByRole("button", { name: /^Limpar exemplos/ }).click();

    expect(await lerSessoes(page)).toHaveLength(0);
    expect((await lerCfg(page)).demoLimpo).toBe(true);

    await page.reload();
    await page.getByRole("heading", { level: 1 }).first().waitFor();
    expect(await lerSessoes(page)).toHaveLength(0);
  });
});
