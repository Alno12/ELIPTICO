# Zonas · Elíptico

App de registro de treinos aeróbicos por zona de frequência cardíaca, com análise de carga
(TRIMP, ACWR, monotonia, modelo de aptidão/fadiga) e tendências.

Melhorias mapeadas e ainda não implementadas estão em [MELHORIAS.md](MELHORIAS.md).

## Rodar localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/`, pronta para publicar em qualquer hospedagem estática.

## Deploy no Netlify

**Opção A — conectar o repositório Git (recomendado, builds automáticos):**
1. Suba este projeto para um repositório no GitHub.
2. Em [app.netlify.com](https://app.netlify.com), clique em "Add new site" → "Import an existing project".
3. Conecte ao repositório. Build command: `npm run build`. Publish directory: `dist`.
4. O arquivo `netlify.toml` já traz essa configuração, então os campos devem vir preenchidos sozinhos.

**Opção B — arrastar a pasta `dist`:**
1. Rode `npm run build` localmente.
2. Em app.netlify.com, arraste a pasta `dist` gerada na área de deploy manual.

## Armazenamento

Os dados ficam salvos em `localStorage`, no navegador do próprio usuário. Isso significa que os
treinos não sincronizam entre dispositivos ou navegadores diferentes — cada um mantém seu próprio
histórico local.

Duas consequências práticas, e o que fazer sobre elas:

- **Instale o app na tela de início.** O Safari no iOS descarta o `localStorage` de sites que
  ficam 7 dias sem visita. Instalado, o histórico não é descartado. O app é um PWA e também
  abre sem rede depois da primeira carga.
- **Exporte de vez em quando.** Em Histórico → Backup dá para gerar um CSV e importá-lo de
  volta depois, inclusive em outro aparelho. A importação não duplica treinos que já existem,
  então reimportar o mesmo arquivo é seguro.
