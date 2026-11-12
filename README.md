# Equipos Pokémon

## Cómo abrirla
Haz doble clic en `index.html`. Se abre en el navegador y no hace falta instalar nada.
Necesitas internet para ver las imágenes de los pokémon y de los objetos, y las fuentes.

## Cómo se usa
- **Pestañas**: «Mi equipo» y «Rival». Cada una tiene su propio equipo de hasta 6 pokémon.
- **Añadir un pokémon**: escribe en el buscador y elige uno de la lista (con el ratón, o con las flechas y Enter). Puedes buscar en español, en inglés o por número de la Pokédex. Pulsa `/` para ir directo al buscador.
- **Habilidad y objeto**: haz clic y elige. Primero salen sugerencias: sus habilidades, sus megapiedras y los objetos más usados. También puedes escribir y elegir cualquiera. Del objeto se muestra lo que hace exactamente y, debajo, su descripción del juego.
- **Objetos que cambian las stats** (Cinta, Gafas y Pañuelo Elección, Chaleco Asalto, Mineral Evol, Bola Férrea, Bola Luminosa, Energía Potenciadora…): la barra de la estadística muestra un tramo rayado morado con lo que sube (o rojo con lo que baja) y el valor nuevo a la derecha.
- **Naturaleza**: las estadísticas que sube y baja se marcan con ↑ y ↓.
- **Teratipo**: si lo eliges, puedes marcar «Teracristalizado» para ver sus debilidades con ese tipo.
- **Movimientos**: escribe en cualquiera de los 4 huecos y pulsa Enter. El cursor pasa solo al siguiente hueco libre. Los que tienen STAB se marcan.
- **Daño que recibe**: ×4, ×2, neutro, ×½, ×¼ y ×0. Tiene en cuenta habilidades como Levitación o Absorbe Agua y el Globo Helio (marcados con *).
- **A qué le pega fuerte**: según los tipos de sus movimientos de daño o, si no tiene, según sus propios tipos.
- **Contra el otro equipo**: a qué pokémon rivales pega fuerte, cuáles le pegan fuerte a él y a cuántos supera en velocidad base.
- **Resumen**: arriba de cada equipo salen sus puntos débiles (tipos a los que muchos son débiles y nadie resiste) y los tipos a los que nadie del equipo pega fuerte.
- **Cambiar**: el botón azul de cada ficha abre un buscador para cambiar ese pokémon por otro. Se mantienen sus ataques, objeto, naturaleza y teratipo. La habilidad también, si el nuevo pokémon la tiene.
- **Borrar**: el botón rojo borra el pokémon. Si te equivocas, pulsa «Deshacer» en el aviso.
- **Debilitado**: el botón «Marcar debilitado» pone la ficha en gris con un sello y tacha el icono en la barra de arriba. «Revivir» lo deshace. Los debilitados no cuentan en el enfrentamiento con el otro equipo.
- **PP**: cada ataque muestra los PP que le quedan. Pulsa **−** cada vez que lo use y **+** si te equivocas. Con 0 PP el ataque sale apagado y marcado «Sin PP».
- **Nivel y PS** (barra de arriba de cada pokémon): nivel (50 por defecto), PS actuales sobre los máximos reales y botones −25 %, −10 %, +10 %, +25 % y Curar. Con 0 PS queda debilitado; al revivir vuelve con la mitad de PS.
- **EVs e IVs** (desplegable en las estadísticas): EVs de 0 a 252 (máximo 510 en total) e IVs de 0 a 31.
- **Estadísticas**: cada fila muestra la stat base (con su barra) y, a la derecha, la stat **real** en combate, calculada con las fórmulas del juego (nivel, EVs, IVs y naturaleza) y con todos los efectos activos.
- **En combate** (debajo de las estadísticas de cada pokémon): problema de estado y cambios de características de −6 a +6 (Ataque, Defensa, At. Esp., Def. Esp., Velocidad, Precisión y Evasión).
- **Condiciones del combate** (arriba, compartidas por los dos equipos): clima y campo.
- **Todo se refleja en las barras de stats**: objeto, habilidad (Potencia, Agallas, Clorofila, Paleosíntesis…), estado (quemadura, parálisis), clima y cambios de características. Debajo se explica cada efecto activo y, en gris, las habilidades que se activarían en otras condiciones.
- **Habilidades que suben el daño** de ciertos ataques (Experto, Adaptable, Mar Llamas, Mandíbula Fuerte…) se marcan en cada ataque.
- **Nuevo combate**: el botón del resumen restaura PP, PS, estados y cambios de características, y revive a todos los pokémon de ese equipo (se puede deshacer).
- **Orden**: usa las flechas ↑ ↓ de cada ficha o, en el ordenador, arrastra los pokémon en la barra de arriba.
- **Exportar / Importar**: guarda los dos equipos en un archivo `.json` o cárgalos después.

Los equipos se guardan solos en este navegador.

## Actualizar los datos
Los datos (pokémon, movimientos, habilidades y objetos) están en `data/pokedata.js` y vienen de [PokeAPI](https://pokeapi.co).
Para descargar la versión más reciente:

```
python tools/build_data.py
```

En `tools/es_overrides.json` están las traducciones al español de los textos que PokeAPI solo tiene en inglés, incluidos los efectos exactos de los objetos.
