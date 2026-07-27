import { describe, it, expect } from "vitest";
import {
  minSeg,
  deMinSeg,
  mmss,
  soDigitos,
  tempoDeDigitos,
  minutosDeDigitos,
  digitosDeMinutos,
  arrumarDigitos,
} from "./util.js";
import { equiv, equivZ, PESO_EQUIV } from "./treino.js";

describe("deMinSeg", () => {
  it("converte minutos e segundos para minutos decimais", () => {
    expect(deMinSeg(8, 30)).toBe(8.5);
    expect(deMinSeg(0, 30)).toBe(0.5);
    expect(deMinSeg(5, 0)).toBe(5);
  });

  it("campos vazios retornam 0", () => {
    expect(deMinSeg("", "")).toBe(0);
  });

  it("undefined retorna 0", () => {
    expect(deMinSeg(undefined, undefined)).toBe(0);
  });

  it("valores negativos são tratados como 0", () => {
    expect(deMinSeg(-5, 0)).toBe(0);
    expect(deMinSeg(0, -30)).toBe(0);
    expect(deMinSeg(-5, -30)).toBe(0);
  });

  it("segundos acima de 59 são absorvidos como minutos", () => {
    expect(deMinSeg(0, 90)).toBe(1.5);
  });
});

describe("minSeg", () => {
  it("converte minutos decimais para minutos e segundos", () => {
    expect(minSeg(8.5)).toEqual({ m: 8, s: 30 });
    expect(minSeg(0)).toEqual({ m: 0, s: 0 });
    expect(minSeg(5)).toEqual({ m: 5, s: 0 });
  });

  it("arredonda corretamente para segundos", () => {
    expect(minSeg(1.5)).toEqual({ m: 1, s: 30 });
    expect(minSeg(2.25)).toEqual({ m: 2, s: 15 });
  });

  it("não retorna s: 60 quando arredonda para 60 segundos", () => {
    // 8.999 * 60 = 539.94, arredonda para 540 segundos = 9 min 0 seg
    const resultado = minSeg(8.999);
    expect(resultado).toEqual({ m: 9, s: 0 });
    expect(resultado.s).toBeLessThan(60);
  });

  it("minutos decimais com arredondamento para minuto seguinte", () => {
    expect(minSeg(0.9999)).toEqual({ m: 1, s: 0 });
  });
});

describe("mmss", () => {
  it("converte minutos decimais para string MM:SS", () => {
    expect(mmss(8.5)).toBe("8:30");
    expect(mmss(5)).toBe("5:00");
    expect(mmss(0)).toBe("0:00");
  });

  it("segundos sempre com dois dígitos", () => {
    expect(mmss(1.0833)).toBe("1:05");
    expect(mmss(2.15)).toBe("2:09");
    expect(mmss(10.5)).toBe("10:30");
  });

  it("arredonda segundos corretamente", () => {
    expect(mmss(1.1666)).toBe("1:10");
  });
});

describe("ida e volta: deMinSeg -> minSeg", () => {
  it("preserva minutos e segundos em toda faixa válida", () => {
    // Testa todas as combinações de m em 0..3 e s em 0..59
    for (let m = 0; m <= 3; m++) {
      for (let s = 0; s < 60; s++) {
        const decimo = deMinSeg(m, s);
        const resultado = minSeg(decimo);
        expect(resultado).toEqual(
          { m, s },
          `deMinSeg(${m}, ${s}) = ${decimo}, minSeg(${decimo}) deveria retornar {m: ${m}, s: ${s}}, mas retornou {m: ${resultado.m}, s: ${resultado.s}}`
        );
      }
    }
  });
});

describe("equivZ", () => {
  it("zona 1 não conta na equivalência", () => {
    expect(equivZ({ z1: 10, z2: 0, z3: 0, z4: 0, z5: 0 })).toBe(0);
  });

  it("zonas 2 e 3 valem 1× cada", () => {
    expect(equivZ({ z1: 0, z2: 10, z3: 10, z4: 0, z5: 0 })).toBe(20);
  });

  it("zonas 4 e 5 valem 2× cada", () => {
    expect(equivZ({ z1: 0, z2: 0, z3: 0, z4: 10, z5: 10 })).toBe(40);
  });

  it("combinação com as cinco zonas", () => {
    // z1: 10 (0×) + z2: 5 (1×) + z3: 5 (1×) + z4: 3 (2×) + z5: 2 (2×) = 0 + 5 + 5 + 6 + 4 = 20
    expect(equivZ({ z1: 10, z2: 5, z3: 5, z4: 3, z5: 2 })).toBe(20);
  });

  it("zonas ausentes contam como 0", () => {
    expect(equivZ({ z2: 10 })).toBe(10);
    expect(equivZ({ z4: 5 })).toBe(10);
  });

  it("funciona com minutos fracionários", () => {
    expect(equivZ({ z4: 0.5 })).toBe(1);
    expect(equivZ({ z2: 8.5 })).toBe(8.5);
  });
});

describe("equiv", () => {
  it("lê de sessao.zones e dá o mesmo que equivZ", () => {
    const sessao = { zones: { z1: 10, z2: 5, z3: 5, z4: 3, z5: 2 } };
    expect(equiv(sessao)).toBe(equivZ(sessao.zones));
  });

  it("retorna 0 se zones vazio", () => {
    expect(equiv({ zones: {} })).toBe(0);
  });
});

describe("PESO_EQUIV", () => {
  it("tem exatamente as chaves z1 até z5", () => {
    expect(Object.keys(PESO_EQUIV).sort()).toEqual(["z1", "z2", "z3", "z4", "z5"]);
  });

  it("tem valores corretos: 0, 1, 1, 2, 2", () => {
    expect(PESO_EQUIV.z1).toBe(0);
    expect(PESO_EQUIV.z2).toBe(1);
    expect(PESO_EQUIV.z3).toBe(1);
    expect(PESO_EQUIV.z4).toBe(2);
    expect(PESO_EQUIV.z5).toBe(2);
  });
});

/* O campo de tempo digitado da direita para a esquerda, como num cronômetro. */
describe("campo de tempo por dígitos", () => {
  it("empurra os dígitos da direita para a esquerda", () => {
    const passos = ["1", "12", "120", "1205"];
    expect(passos.map((p) => tempoDeDigitos(soDigitos(p)))).toEqual([
      "0:01",
      "0:12",
      "1:20",
      "12:05",
    ]);
  });

  /* O caso que reprovou o primeiro desenho: normalizando a cada tecla, 83 s
     virava 1:23, os dígitos guardados passavam a 123, e o 0 seguinte dava 12:30
     em vez de 8:30. Todo tempo cujo caminho passe por mais de 59 s ficaria
     impossível de digitar. */
  it("aceita passar de 59 s no meio do caminho", () => {
    const passos = ["8", "83", "830"];
    expect(passos.map((p) => tempoDeDigitos(soDigitos(p)))).toEqual(["0:08", "0:83", "8:30"]);
    expect(minutosDeDigitos("830")).toBeCloseTo(8.5, 10);
  });

  it("1205 são 12 minutos e 5 segundos", () => {
    expect(minutosDeDigitos("1205")).toBeCloseTo(12 + 5 / 60, 10);
  });

  it("ignora o que não for algarismo", () => {
    expect(soDigitos("12:05")).toBe("1205");
    expect(soDigitos("12 min 05 s")).toBe("1205");
  });

  it("descarta zeros à frente, que não mudam o valor", () => {
    expect(soDigitos("0012")).toBe("12");
    expect(minutosDeDigitos(soDigitos("0012"))).toBeCloseTo(12 / 60, 10);
  });

  it("guarda no máximo cinco algarismos, mantendo os últimos", () => {
    expect(soDigitos("1234567")).toBe("34567");
    /* 345 min e 67 s, que ao normalizar viram 346:07 */
    expect(mmss(minutosDeDigitos("34567"))).toBe("346:07");
    expect(tempoDeDigitos("34567")).toBe("345:67");
  });

  it("campo vazio é zero, não NaN", () => {
    expect(minutosDeDigitos("")).toBe(0);
    expect(digitosDeMinutos(0)).toBe("");
  });

  /* A volta pelo valor é o que impede o campo de mostrar um tempo impossível. */
  it("ao sair do campo, segundos acima de 59 viram minuto", () => {
    expect(arrumarDigitos("1275")).toBe("1315");
    expect(tempoDeDigitos("1315")).toBe("13:15");
    /* e quem parar em "0:83" sai com 1:23 */
    expect(tempoDeDigitos(arrumarDigitos("83"))).toBe("1:23");
  });

  it("apagar um algarismo faz o resto deslizar de volta", () => {
    /* o usuário vê "12:05", apaga um caractere e sobra "12:0" */
    expect(arrumarDigitos("12:0")).toBe("120");
    expect(tempoDeDigitos("120")).toBe("1:20");
  });

  it("ida e volta entre minutos e dígitos preserva o valor", () => {
    for (const min of [0.5, 8.5, 12 + 5 / 60, 45, 99 + 59 / 60]) {
      expect(minutosDeDigitos(digitosDeMinutos(min))).toBeCloseTo(min, 10);
    }
  });

  it("reabrir um treino gravado devolve o mesmo tempo no campo", () => {
    expect(digitosDeMinutos(8.5)).toBe("830");
    expect(tempoDeDigitos(digitosDeMinutos(8.5))).toBe("8:30");
  });
});
