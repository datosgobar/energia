# [Balance energético de Argentina](http://datosgobar.github.io/energia)

Descubrí el ciclo de vida de la energía desde su origen hasta el consumo final.

## ¿Cómo levantar el server?

El sitio está hosteado en [GitHub Pages](https://pages.github.com/).

Para poder obtener una instancia local del proyecto hace falta clonar el repositorio, y dentro de la carpeta raíz, instalar las dependencias del archivo `package.json` con el comando `npm install`. Después, tenés que levantar un servidor con el comando `gulp server`. Para lograr esto, hace falta tener instalado [node](https://nodejs.org/es/) y [npm](https://www.npmjs.com/).

Si deseás modificar el código, usá los archivos del directorio `./build/` y luego compilalo con Gulp. Los archivos compilados se guardan en el directorio `./public/`.

En el archivo `gulpfile.js`, se encuentra la variable `entorno` para poder definir si estás trabajando en un ambiente de desarrollo o producción. Además, contás con tareas programadas que te ayudaran en el proceso de desarrollo:
- `Gulp compile` te servirá para compilar el proyecto.
- `Gulp server` te servirá para iniciar un servidor.
- `Gulp start` te servirá para iniciar un servidor, compilar el proyecto, y además, genera watches para recompilar el proyecto durante el desarrollo.
- `Gulp reset_app` te servirá para eliminar la compilación.

## Contacto

Te invitamos a [crearnos un issue](https://github.com/datosgobar/energia/issues/new) en caso de que encuentres algún bug o tengas feedback de alguna parte del sitio de `densidad-poblacion`.

Para todo lo demás, podés mandarnos tu comentario o consulta a [datos@modernizacion.gob.ar](mailto:datos@modernizacion.gob.ar).
