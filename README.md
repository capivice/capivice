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

- `index.html`: LP do estúdio (`/`), com vitrine do Crystal Defender
- `crystal-defender/index.html`: LP do jogo (`/crystal-defender/`), com galeria e lightbox
- `css/style.css`: estilos compartilhados (tokens, layout, tratamento das screenshots, animações, responsivo)
- `js/hero.js`: brasas e faíscas animadas por cima do hero
- `js/main.js`: loader, header, menu mobile, slideshow do hero, reveals, galeria/lightbox, contadores e tilt
- `assets/capivice-logo.png` / `assets/capivice-logo-alpha.png`: logo do estúdio (fundo preto / transparente)
- `assets/game/`: logo e screenshots do Crystal Defender: The Last Line

## Rodar localmente

```bash
python3 -m http.server 5173
```
