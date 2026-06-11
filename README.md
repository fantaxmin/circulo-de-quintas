# Círculo de Quintas

Aplicación web interactiva para aprender teoría musical: el círculo de quintas,
las escalas, los acordes y los modos griegos — con audio sintetizado en el
navegador (sin librerías externas).

## Características

- **Círculo de quintas interactivo**: clic en cualquier tonalidad para escuchar
  su acorde y ver sus grados, calidades (mayor/menor/disminuido) y modos.
- **Tonalidad relativa menor** clickeable, con todos los grados y progresiones
  recalculados.
- **Modos griegos**: fórmula de intervalos, notas y carácter de cada modo.
- **Backing track** generado con Web Audio API (bombo, caja, hi-hat y bajo),
  con BPM ajustable y estilos Pop/Rock, Jazz (swing) y Funk.
- **Teclado visual** que resalta las notas de la escala activa.
- **Progresiones comunes** para tonalidad mayor y menor, reproducibles.
- **Explorador de escalas** (`/escalas`): mayor, menor natural/armónica/melódica,
  modos, pentatónicas y blues, con notas, audio y teclado.
- **Explorador de acordes** (`/acordes`): mayor, menor, disminuido, aumentado,
  suspendidos, séptimas, novena... con inversiones.
- **Página de conceptos** (`/conceptos`): teoría explicada paso a paso.

## Stack

- [Astro](https://astro.build) (salida estática) + islas de [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com) v4
- Web Audio API nativa para todo el sonido

## Desarrollo

```bash
pnpm install
pnpm dev      # servidor de desarrollo
pnpm build    # build estático en dist/
pnpm preview  # previsualiza el build
```

## Estructura

```
src/
├─ lib/          # lógica pura (teoría, audio, datos, tooltips)
├─ components/   # componentes React (islas) y Astro
├─ layouts/      # layout base
├─ pages/        # rutas: index, escalas, acordes, conceptos
└─ styles/       # CSS global (Tailwind)
```
