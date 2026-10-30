# Capivice Landing (GitHub Pages)

Esta pasta (`docs/`) contém a versão estática do site, pronta para GitHub Pages.

## Como publicar

1. Faça push deste projeto para o GitHub.
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, selecione:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (ou a branch que você usar)
   - **Folder**: `/docs`
4. Salve e aguarde a publicação.

## Estrutura

- `index.html`: página principal
- `css/style.css`: estilos (tokens, layout, animações, responsivo)
- `js/hero.js`: key art animada do Crystal Defender em canvas (cristal, círculo rúnico, inimigos e raios)
- `js/main.js`: loader, header, menu mobile, reveals no scroll, contadores, tilt e botões magnéticos
- `assets/capivice-logo.png`: logo original (fundo preto)
- `assets/capivice-logo-alpha.png`: logo com fundo transparente (header e favicon)

## Rodar localmente

```bash
python3 -m http.server 5173
```
