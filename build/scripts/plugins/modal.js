// Variables Globales del sitio
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Initialize Firebase
// firebase.initializeApp({
//   apiKey: 'AIzaSyDbLZWG2xFkyP8BZz7dfJF5daK9F3KwJJ4',
//   authDomain: 'analytical-park-149313.firebaseapp.com',
//   databaseURL: 'https://analytical-park-149313.firebaseio.com',
//   projectId: 'analytical-park-149313',
//   storageBucket: 'analytical-park-149313.appspot.com',
//   messagingSenderId: '215411573688'
// });
//
// let firebaseStorage = firebase.storage().ref()

// Funciones Globales del sitio
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Check 09.07.2017 - Oculta el componente cuando el mouse esta fuera del modulo
const randomString = (quantity) => {
  let text = '',
      possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < quantity; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
// Check 05.07.2017 - Sobreescribe los atributos de un objeto en otro
const mergeStructure = (target, source) => {
  return {
    settings:   jQuery.extend(target.settings, source.settings),
    attr:       (source.hasOwnProperty('attr'))?(source.attr):({}),
    styles:     jQuery.extend(target.styles, source.styles),
    childrens:  (source.hasOwnProperty('childrens'))?(source.childrens):([])
  };
};
// Check 05.07.2017 - Inyecta los estilos de un componente
const injectStyles = (component, styles) => {

  for (let style in styles) {
    component.style[style] = styles[style];
  }

  return true;
};
// Check 05.07.2017 - Inyecta los atributos de un componente
const injectAttributes = (component, attributes) => {

  for (let attr in attributes) {
    if (attr === 'class') {
        attributes[attr].split(' ').forEach((className) => {
          component.classList.add(className);
        });
    } else {
      component.setAttribute(attr, attributes[attr]);
    }
  }

  return true;
};
// Check 05.07.2017 - Inyecta los componentes hijos de un componente
const injectChildrens = (component, childrens) => {
  childrens.forEach((children) => {
    component.appendChild(children);
  });

  return true;
};
// Check 05.07.2017 - Muesta el componente cuando el mouse esta dentro del modulo
const buttonShareShow = (component) => {
  component.querySelector('.modalShare').style.opacity = 1;

  return true;
};
// Check 05.07.2017 - Oculta el componente cuando el mouse esta fuera del modulo
const buttonShareHide = (component) => {
  component.querySelector('.modalShare').style.opacity = '';
  component.querySelector('.modalShare input').checked = false;

  return true;
};
// Check 05.07.2017 - Comparte en redes sociales un modulo especifico
const share = (social, elemento) => {
  let node = elemento.parentNode.parentNode.parentNode,
      nroModule = node.getAttribute('module-nro'),
      date = new Date();

  // Generar imagen Uint8Array
  let w = node.offsetWidth,
      h = node.offsetHeight,
      imageW, imageH;

  if (w > h) {
    imageW = 2400;
    imageH = (imageW / w) * h;
  } else {
    imageH = 1260;
    imageW = (imageH / h) * w;
  }

  domtoimage.toBlob(node).then((file) => {
  // domtoimage.toBlob(node, {height: imageH, width: imageW}).then((file) => {
    console.log(file);
    firebaseStorage
      .child(`module_${ nroModule }_${ randomString(10) }_${ date.getTime() }`)
      .put(file)
      .then((snapshot) => {
        let url = snapshot.metadata.downloadURLs[0];

        switch (social) {
          case 'facebook': window.open(`https://www.facebook.com/sharer.php?u=https://datosgobar.github.io/GDE&picture=${ url }`, 'pop', 'width=600, height=260, scrollbars=no'); break;
          case 'twitter': window.open(`https://twitter.com/share?save.snapshot.downloadURL=https://datosgobar.github.io/GDE&image=${ url }`); break;
        }
      });
  });
};
// Check 05.07.2017 - Muesta el contenedor para embeber el modulo
const embebedContainerShow = (component) => {
  component.parentNode.parentNode.parentNode.querySelector('.embebedContainer').style.opacity = '';
  component.parentNode.parentNode.parentNode.querySelector('.embebedContainer').style.visibility = '';

  return true;
};
// Check 05.07.2017 - Oculta el contenedor para embeber el modulo
const embebedContainerHide = (component) => {
  component.parentNode.style.opacity = 0;
  component.parentNode.style.visibility = 'hidden';

  return true;
};
// Check 05.07.2017 - Guarda en el portapapeles el texto de un elemento
const copyText = (elemento) => {
  let copy = elemento.parentNode.querySelector('input').select();

  window.document.execCommand('copy');

  return true;
};

// Componente Modal
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const Modal = {
  variables: {
    colors: {
      base: '#767676',
      base_contraste: '#444444',
      gobar_ligth: '#17b2f8',
      gobar_dark: '#0695d6',
      palette: {
        color1: '#14499E',
        color2: '#27B5F6',
        color3: '#02D57A',
        color4: '#FF8140',
        color5: '#FFBB42'
      }
    },
    counts: {
      modulos: 1
    }
  },
  module: {
    // Check 05.07.2017
    simple: (structureParams) => {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:      'default',
          share:      false,
          embebed:    false,
          theme:     'dark',
          transform: 'mod-col-col',
          quantity:   1
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        seccion: {html: 'section', class: 'modalContainer'},
        default: {html: 'section', class: 'modalContainer'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
          component.setAttribute('module-nro', Modal.variables.counts.modulos);
      // Se crea contenedor responsive
      let responsive = Modal.module.responsive({
        settings: {
          transform: structure.settings.transform,
          quantity: structure.settings.quantity
        }
      });
      // Se crea boton para compartir el modulo
      if (structure.settings.share) {
        let share = Modal.module.share({
          settings: {
            theme:   structure.settings.theme,
            embebed: structure.settings.embebed
          }
        });

        component.setAttribute('onmouseenter', 'buttonShareShow(this)');
        component.setAttribute('onmouseleave', 'buttonShareHide(this)');
        responsive.appendChild(share);

        if (structure.settings.embebed) {
          let iframe = window.document.createElement('iframe');
              iframe.setAttribute('src', `${ window.location.origin }?seccion=${ Modal.variables.counts.modulos }`);
              iframe.setAttribute('width', '100%');
              iframe.setAttribute('height', '400px');
          let background = window.document.createElement('div');
              background.classList.add('embebedContainer');
              background.style.opacity = 0;
              background.style.visibility = 'hidden';
          let exit = window.document.createElement('span');
              exit.classList.add('embebedExit');
              exit.setAttribute('onclick', 'embebedContainerHide(this)');
              exit.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
          let input = window.document.createElement('input');
              input.setAttribute('value', iframe.outerHTML);
          let button = Modal.add.button({
            settings: {type: 'squareBig', text: '<i class="fa fa-clone" aria-hidden="true"></i><span style="margin-left: 10px;">Copiar</span>'},
            attr:     {onclick: 'copyText(this)'},
            styles:   {backgroundColor: Modal.variables.colors.gobar_ligth, color: 'white', margin: '0px 0px 0px 10px'}
          });

          background.appendChild(exit);
          background.appendChild(input);
          background.appendChild(button);
          component.appendChild(background);
        }
      }

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      injectChildrens(responsive, structure.childrens);

      // Union de componentes, y otros ajustes
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se incrementa contador de modulos
      Modal.variables.counts.modulos++;
      // Se inserta el modulo en el contenedor
      component.appendChild(responsive);

      return component;
    },
    // Check 05.07.2017
    responsive: (structureParams) => {                      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:      'default',
          transform:  'mod-col-col',
          quantity:   1
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'div', class: 'modalResponsive'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
          component.classList.add(structure.settings.transform);
          component.classList.add(`child-${ structure.settings.quantity }`);

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      // injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 05.07.2017
    share: (structureParams) => {                           // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:   'default',
          theme:  'dark',
          embebed: false
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'div', class: 'modalShare'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
      // Se crea input-checkbox para manejar el estado del componente
      let input = window.document.createElement('input');
          input.setAttribute('id', `share-${ Modal.variables.counts.modulos }`);
          input.setAttribute('type', 'checkbox');
          input.classList.add('share-open');
      // Se crea boton hamburguesa
      let label = window.document.createElement('label');
          label.setAttribute('for', `share-${ Modal.variables.counts.modulos }`);
          label.classList.add(`share-open-button`);
          label.classList.add(`hamburger-${ structure.settings.theme }`);
      // Se generan las 3 lineas del boton hamburguesa
      for (let i = 1; i < 4; i++) {
        let span = window.document.createElement('span');
            span.classList.add(`hamburger-${ i }`);

        label.appendChild(span);
      }
      // Se crean botones para embeber codigo y compartir en redes sociales
      let embebedButton  = Modal.add.button({
        settings: {type: 'circleSmall', text: '<i class="fa fa-code" aria-hidden="true"></i>'},
        attr:     {class: 'share-item buttonEmbebed', title: 'Embeber sección', onclick: 'embebedContainerShow(this)'},
        styles:   {backgroundColor: 'black', color: 'white', right: '0px'}
      });
      let facebookButton = Modal.add.button({
        settings: {type: 'circleSmall', text: '<i class="fa fa-twitter" aria-hidden="true"></i>'},
        attr:     {class: 'share-item', title: 'Compartir en Twitter', onclick: 'share("twitter", this)'},
        styles:   {backgroundColor: '#1DA1F2', color: 'white', right: '0px'}
      });
      let twitterButton  = Modal.add.button({
        settings: {type: 'circleSmall', text: '<i class="fa fa-facebook" aria-hidden="true"></i>'},
        attr:     {class: 'share-item', title: 'Compartir en Facebook', onclick: 'share("facebook", this)'},
        styles:   {backgroundColor: '#3B5998', color: 'white', right: '0px'}
      });

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      // injectChildrens(component, structure.childrens);

      // Union de componentes, y otros ajustes
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se arma el componente
      component.appendChild(input);
      component.appendChild(label);
      if (structure.settings.embebed === true) {
        component.appendChild(embebedButton);
      }
      component.appendChild(facebookButton);
      component.appendChild(twitterButton);

      return component;
    }
  },
  add: {
    // Check 05.07.2017
    button: (structureParams) => {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type: 'default',
          text: 'Button'
        }, styles: {backgroundColor: Modal.variables.colors.gobar_dark, color: 'white'}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default:     {html: 'button', class: 'button buttonRound', classEfect: 'buttonBig boton_efecto'},
        roundBig:    {html: 'button', class: 'button buttonRound', classEfect: 'buttonBig boton_efecto'},
        roundSmall:  {html: 'button', class: 'button buttonRound', classEfect: 'buttonSmall boton_efecto'},
        squareBig:   {html: 'button', class: 'button buttonSquare', classEfect: 'buttonBig boton_efecto'},
        squareSmall: {html: 'button', class: 'button buttonSquare', classEfect: 'buttonSmall boton_efecto'},
        circleBig:   {html: 'button', class: 'button buttonCircle', classEfect: 'buttonCircleBig boton_efecto'},
        circleSmall: {html: 'button', class: 'button buttonCircle', classEfect: 'buttonCircleSmall boton_efecto'}
      };
      let effectOptions = {
        default:     {html: 'span', class: 'buttonBig boton_efecto'},
        roundBig:    {html: 'span', class: 'buttonBig boton_efecto'},
        roundSmall:  {html: 'span', class: 'buttonSmall boton_efecto'},
        squareBig:   {html: 'span', class: 'buttonBig boton_efecto'},
        squareSmall: {html: 'span', class: 'buttonSmall boton_efecto'},
        circleBig:   {html: 'span', class: 'buttonCircleBig boton_efecto'},
        circleSmall: {html: 'span', class: 'buttonCircleSmall boton_efecto'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];
      let effectOption = effectOptions[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
      // Se crea mascara para iluminar el boton
      let lightEffect = window.document.createElement('span');
          lightEffect.innerHTML = structure.settings.text;

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      injectAttributes(lightEffect, { class: effectOption.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      injectChildrens(component, structure.childrens);

      // Union de componentes, y otros ajustes
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      component.appendChild(lightEffect);

      return component;
    },
    // Check 06.07.2017
    title: (structureParams) => {                           // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type: 'default',
          text: 'Titulo'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'h2', class: 'title'},
        title1:  {html: 'h1', class: 'title'},
        title2:  {html: 'h2', class: 'title'},
        title3:  {html: 'h3', class: 'title'},
        title4:  {html: 'h4', class: 'title'},
        title5:  {html: 'h5', class: 'title'},
        title6:  {html: 'h6', class: 'title'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
          component.innerHTML = structure.settings.text;

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      // injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 06.07.2017
    paragraph: (structureParams) => {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type: 'default',
          text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default:  {html: 'p', class: 'paragraph'},
        small:    {html: 'p', class: 'paragraph pSmall'},
        normal:   {html: 'p', class: 'paragraph'},
        big:      {html: 'p', class: 'paragraph pBig'},
        flywheel: {html: 'p', class: 'paragraph pFly'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
          component.innerHTML = structure.settings.text;

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 06.07.2017
    space: (structureParams) => {                           // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:     'default',
          quantity:  1
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default:    {html: 'div', class: 'breakLine'},
        allways:    {html: 'div', class: 'breakLine'},
        onlyWeb:    {html: 'div', class: 'breakLine onlyWeb'},
        onlyMobile: {html: 'div', class: 'breakLine onlyMobile'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);

      // Se insertan la cantidad de hr definida por el componente
      for (let i = 0; i < structure.settings.quantity; i++) {
        let breakLine = window.document.createElement('hr');

        component.appendChild(breakLine);
      }

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      // injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 06.07.2017
    increment: (structureParams) => {                       // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:   'default',
          start:   0,
          end:     1000,
          format: '(.ddd)'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'div', class: 'increment incrMedium odometer'},
        small:   {html: 'div', class: 'increment incrSmall odometer'},
        normal:  {html: 'div', class: 'increment incrMedium odometer'},
        big:     {html: 'div', class: 'increment incrBig odometer'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
      // Se configura odometer
      let odometer = new Odometer({
        el: component,
        value: structure.settings.start,
        theme: 'minimal',
        format: structure.settings.format,
        duration: 1000,
        auto: true
      });
      odometer.update(structure.settings.end);

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      // injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 06.07.2017
    subContainer: (structureParams) => {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:   'default'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'div', class: 'subContainer'},
        div:     {html: 'div', class: 'subContainer'},
        footer:  {html: 'footer', class: 'subContainer'},
        header:  {html: 'header', class: 'subContainer'},
        section: {html: 'section', class: 'subContainer'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 06.07.2017
    image: (structureParams) => {                           // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type:   'default',
          width:  '200px',
          height: '200px'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'img', class: 'image'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
          component.setAttribute('width', structure.settings.width);
          component.setAttribute('height', structure.settings.height);

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      // injectChildrens(component, structure.childrens);

      return component;
    },
    // Check 07.07.2017
    link: (structureParams) => {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      let structureDefault = {
        settings: {
          type: 'default',
          text: 'Esto es un enlace.'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      let structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      let options = {
        default: {html: 'a', class: 'link'},
        link:    {html: 'a', class: 'link link-inline'},
        block:   {html: 'a', class: 'link link-block'}
      };
      // Se selecciona una opcion
      let option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      let component = window.document.createElement(option.html);
          component.innerHTML = structure.settings.text;

      // Inyecciones de contenido
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se inyectan los atributos
      injectAttributes(component, structure.attr);
      injectAttributes(component, { class: option.class });
      // Se inyectan los estilos
      injectStyles(component, structure.styles);
      // Se inyectan los componentes hijos
      injectChildrens(component, structure.childrens);

      return component;
    },



    grafico: {
      linea: {
        horizontal: (data) => {
          let contenedor;

          contenedor = window.document.createElement('svg');
          contenedor.setAttribute('id', data.parametros.id);

          return contenedor;
        }
      },
      torta: (data) => {
        let contenedor, svg, arc, angulo = Math.PI / 180,
            dataset, arco, path, width = 280, height = 280,
            texto_contenedor, texto;

        contenedor = window.document.createElement('div');
        contenedor.classList.add('grafico_torta');
        contenedor.style.width = `${ width }px`;
        contenedor.style.height = `${ height }px`;

        dataset = data.dataset;

        svg = d3.select(contenedor)
          .append('svg')
          .attr('width', width)
          .attr('height', height);

        arc = d3.arc()
          .innerRadius(width / 2 - 25)
          .outerRadius(width / 2)
          .startAngle(0)
          .endAngle(360 * angulo);

        arco = svg.selectAll('.arco')
          .data(dataset)
          .enter();

        arco.append('g')
          .attr('transform', `translate(${ width / 2 }, ${ height / 2 })`)
          .append('path')
          .attr('class', 'arco_fondo')
          .attr('d', arc);

        arc.endAngle((d) => (d.value * angulo));

        path = arco.append('g')
          .attr('transform', `translate(${ width / 2 }, ${ height / 2 })`)
          .append('path')
          .attr('class', 'arco');

        const arcTween = (b) => {
            let i = d3.interpolate({value: b.previous}, b);
            return (t) => arc(i(t));
          };
        const update = () => {
          arco.each((d) => { d.previous = d.value, d.value = d.change; });
          path.transition().duration(750).attrTween('d', arcTween);
        };

        update();

        texto_contenedor = window.document.createElement('div');
        texto_contenedor.classList.add('torta_texto_contenedor');

        texto = window.document.createElement('span');
        texto.innerHTML = '80<span class="small">%<span>';

        texto_contenedor.appendChild(texto);

        texto = window.document.createElement('span');
        texto.innerHTML = 'Cantidad de documentos digitalizados';

        texto_contenedor.appendChild(texto);

        contenedor.appendChild(texto_contenedor);

        return contenedor;
      },
      modelo: () => {
        let contenedor = window.document.createElement('div');
        contenedor.classList.add('modelo_grafico');

        return contenedor;
      }
    }
  }
};
