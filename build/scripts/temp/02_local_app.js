'use strict';

// VARIABLES
var GLOBAL_NODES = void 0,
    GLOBAL_LINKS = void 0,
    GLOSARIO = void 0,
    INTRO = {
  nodes_title: ['Balance energético: qué es y cómo se mide', 'Del gas a la electricidad', 'Los usos de la electricidad', 'Antes y ahora'],
  nodes_description: ['El balance energético <b>detalla flujos, y cantidades de energía producida y consumida</b>. Por convención, <b>la unidad de medida es el ktep</b>. Cada ktep representa mil toneladas equivalente de petróleo.', 'Veamos este ejemplo. En 2015, se extrajeron 2.000 ktep de Gas de pozo. A través de las plantas de transformación, se lo convirtió en gas de red. Luego, el 50% del gas de red se destinó a centrales eléctricas que producen electricidad para el consumo.', 'El principal uso de la electricidad fue en la industria y los hogares. Como parte del proceso, una porción importante se perdió por causas tecnológicas y naturales.', 'Compará con 1960 y descubrí todo el crecimiento que hubo en los montos producidos y consumidos.']
},
    SANKEY = {
  margin: {
    top: 40,
    right: 200,
    bottom: 40,
    left: 200,
    header: 20
  },
  size: {
    width: '',
    height: ''
  },
  separacionNodo: 20,
  anchoNodo: 20,
  secciones_header: [['ENERGÍAS', 'PRIMARIAS'], ['CENTROS DE', 'TRANSFORMACIÓN'], ['ENERGÍAS', 'SECUNDARIAS'], ['CENTROS DE', 'TRANSFORMACIÓN'], ['ENERGÍAS', 'SECUNDARIAS'], ['SECTORES', 'DE CONSUMO']],
  tooltip: {}
},
    SELECTORES = {
  categorias: [['Energías primarias', ['categorias1', 'categorias1', 'categorias1', 'categorias1', 'categorias1']], ['Energías secundarias', ['categorias2', 'categorias2', 'categorias2', 'categorias2', 'categorias2']], ['Energías terciarias', ['categorias3', 'categorias3', 'categorias3', 'categorias3', 'categorias3']], ['Centros de transformación', ['categorias4', 'categorias4', 'categorias4', 'categorias4', 'categorias4']], ['Consumos', ['categorias5', 'categorias5', 'categorias5', 'categorias5', 'categorias5']], ['No aprovechables', ['categorias6', 'categorias6', 'categorias6', 'categorias6', 'categorias6']]],
  anio: []
},
    COLORES_FLUJO = {
  importacion: '#FFCF87',
  exportacion: '#00897B',
  produccion: '#7FC6E6',
  perdida: '#ED7960',
  default: '#CFD8DC'
},
    STATIC_NODE = {
  close: true,
  id: null
};

// FUNCIONES
var BUSCAR_NODO = function BUSCAR_NODO(id) {
  var modificador = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  return GLOBAL_NODES.filter(function (element) {
    return element.id === id + modificador;
  })[0];
};
Number.prototype.format_number = function (n, x, s, c) {
  var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
      num = this.toFixed(Math.max(0, ~~n));

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};

$(function () {

  var height = $('#sankey').height(),
      width = $('#sankey').width(),
      nodesOri = void 0,
      linksOri = void 0,
      allLinks = void 0,
      nodesGlo = void 0,
      linksGlo = void 0,
      allNodes = void 0,
      sankeyChartD3 = void 0,
      path = void 0,
      svg = void 0;

  var setearTooltip = function setearTooltip() {
    $('.tooltip_content').show();
    $('.tooltip_glosary').hide();

    d3.select('button[name="citas"]').style('opacity', 0);
    d3.select('button[name="glosario"]').attr('style', null);
  };
  var encederNodos = function encederNodos() {
    var nodes = d3.selectAll('#sankey .node');

    nodes.select('rect').transition().duration(200).style('stroke', 'black');
    nodes.select('text').transition().duration(200).style('fill', 'black');
  };
  var encederLinks = function encederLinks() {
    var links = d3.selectAll('#sankey .link');

    // Links Producción
    links.filter(function (d) {
      return d.target.id !== 29 && d.target.id !== 31 && d.source.id !== 30;
    }).transition().duration(200).style('stroke', 'url(#gradient_prod)').style('stroke-opacity', 0.5);
    // Links Importación
    links.filter(function (d) {
      return d.source.id === 30;
    }).transition().duration(200).style('stroke', 'url(#gradient_imp)').style('stroke-opacity', 0.5);
    // Links Exportación
    links.filter(function (d) {
      return d.target.id === 31;
    }).transition().duration(200).style('stroke', 'url(#gradient_exp)').style('stroke-opacity', 0.5);
    // Links Pérdida
    links.filter(function (d) {
      return d.target.id === 29;
    }).transition().duration(200).style('stroke', COLORES_FLUJO.perdida).style('stroke-opacity', 0.5);
  };
  var apagarNodos = function apagarNodos() {
    var nodes = d3.selectAll('#sankey .node');

    nodes.select('rect').transition().duration(200).style('stroke', null);
    nodes.select('text').transition().duration(200).style('fill', null);
  };
  var apagarLinks = function apagarLinks() {
    var links = d3.selectAll('#sankey .link');

    links.transition().duration(200).style('stroke', COLORES_FLUJO.default).style('stroke-opacity', null);
  };
  var tooltipIn = function tooltipIn(d) {

    setearTooltip();

    if (d.y < 10) {
      $('#tooltip').attr('class', 'view_bottom').css({ top: $('#sankey svg').offset().top + d.y + d.dy + SANKEY.tooltip.top, left: $('#sankey svg').offset().left + d.x + SANKEY.tooltip.left }).fadeIn(100);
    } else {
      $('#tooltip').attr('class', 'view_top').css({ top: $('#sankey svg').offset().top + d.y + SANKEY.tooltip.bottom, left: $('#sankey svg').offset().left + d.x + SANKEY.tooltip.left }).fadeIn(100);
    }

    if (d.posicionX === 1 || d.posicionX === 3 || d.posicionX === 5) {
      $('.title_total').text('Disponibilidad local');
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(d.oferta_interna.format_number(2, 3, '.', ','));
      $('.tooltip_production').parent().parent().removeAttr('style');
      $('.tooltip_production').text(d.produccion.format_number(2, 3, '.', ','));
      $('.tooltip_importation').parent().parent().removeAttr('style');
      $('.tooltip_importation').text(d.importacion.format_number(2, 3, '.', ','));
      $('.tooltip_exportation').parent().parent().removeAttr('style');
      $('.tooltip_exportation').text(d.exportacion.format_number(2, 3, '.', ','));
      $('.tooltip_losses').parent().parent().removeAttr('style');
      $('.tooltip_losses').text(d.perdidas.format_number(2, 3, '.', ','));
      $('.tooltip_others').parent().parent().removeAttr('style');
      $('.tooltip_others').text(d.otros.format_number(2, 3, '.', ','));
    } else if (d.posicionX === 2 || d.posicionX === 4) {
      $('.title_total').text('Insumos de la central');
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(d.consumo.format_number(2, 3, '.', ','));
      $('.tooltip_production').parent().parent().removeAttr('style');
      $('.tooltip_production').text(d.produccion.format_number(2, 3, '.', ','));
      $('.tooltip_importation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_exportation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_losses').parent().parent().removeAttr('style');
      $('.tooltip_losses').text(d.perdida.format_number(2, 3, '.', ','));
      $('.tooltip_others').parent().parent().css({ 'display': 'none' });
    } else {
      if (d.posicionX === 6 && d.posicionY === 0) {
        $('.title_total').text('Pérdida total');
      } else {
        $('.title_total').text('Consumo');
      }
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(d.consumo.format_number(2, 3, '.', ','));
      $('.tooltip_production').parent().parent().css({ 'display': 'none' });
      $('.tooltip_importation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_exportation').parent().parent().css({ 'display': 'none' });
      $('.tooltip_losses').parent().parent().css({ 'display': 'none' });
      $('.tooltip_others').parent().parent().css({ 'display': 'none' });
    }
  };
  var fade = function fade() {
    var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return function (g, i) {
      var element_id = id === null ? g.id : id,
          event_node = void 0;

      switch (type) {
        case 'fadeIn':
          if (STATIC_NODE.id !== null && STATIC_NODE.id !== g.id) {
            $('#tooltip').fadeOut(100);
            fade('fadeOut', STATIC_NODE.id, true)(g, i);
          }

          STATIC_NODE.close = true;

          // Nodo Seleccionado
          event_node = d3.select('#node_' + element_id);
          event_node.select('rect').transition().style('stroke', 'black');
          event_node.select('text').transition().style('fill', 'black');
          // Nodos Relacionados
          allLinks.each(function (v, k) {
            if (v.source.id === element_id) {
              d3.select('#node_' + v.target.id).select('text').transition().style('fill', 'black').style('font-weight', '500');
            } else if (v.target.id === element_id) {
              d3.select('#node_' + v.source.id).select('text').transition().style('fill', 'black').style('font-weight', '500');
            }
          });
          // Links Producción
          allLinks.filter(function (d) {
            return d.source.id === element_id && d.target.id !== 29 && d.target.id !== 31 || d.target.id === element_id && d.source.id !== 30;
          }).transition().duration(100).style('stroke', 'url(#gradient_prod)').style('stroke-opacity', 0.5);
          // Links Importación
          allLinks.filter(function (d) {
            return d.source.id === 30 && d.target.id === element_id;
          }).transition().duration(100).style('stroke', 'url(#gradient_imp)').style('stroke-opacity', 0.5);
          // Links Exportación
          allLinks.filter(function (d) {
            return d.source.id === element_id && d.target.id === 31;
          }).transition().duration(100).style('stroke', 'url(#gradient_exp)').style('stroke-opacity', 0.5);
          // Links Pérdida
          allLinks.filter(function (d) {
            return d.source.id === element_id && d.target.id === 29 || d.target.id === element_id && element_id === 29;
          }).transition().duration(100).style('stroke', COLORES_FLUJO.perdida).style('stroke-opacity', 0.5);

          break;
        case 'fadeOut':
          if (STATIC_NODE.close && STATIC_NODE.id !== g.id || force === true) {
            // Nodo Seleccionado
            event_node = d3.select('#node_' + element_id);
            event_node.select('rect').transition().style('stroke', null);
            event_node.select('text').transition().style('fill', null);
            // Nodos Relacionados
            allLinks.each(function (v, k) {
              if (v.source.id === element_id) {
                d3.select('#node_' + v.target.id).select('text').transition().style('fill', null).style('font-weight', null);
              } else if (v.target.id === element_id) {
                d3.select('#node_' + v.source.id).select('text').transition().style('fill', null).style('font-weight', null);
              }
            });
            // Links Producción
            allLinks.filter(function (d) {
              return d.source.id === element_id && d.target.id !== 29 && d.target.id !== 31 || d.target.id === element_id && d.source.id !== 30;
            }).transition().duration(100).style('stroke', COLORES_FLUJO.default).style('stroke-opacity', null);
            // Links Importación
            allLinks.filter(function (d) {
              return d.source.id === 30 && d.target.id === element_id;
            }).transition().duration(100).style('stroke', 'url(#gradient_imp_default)').style('stroke-opacity', null);
            // Links Exportación
            allLinks.filter(function (d) {
              return d.source.id === element_id && d.target.id === 31;
            }).transition().duration(100).style('stroke', 'url(#gradient_exp_default)').style('stroke-opacity', null);
            // Links Pérdida
            allLinks.filter(function (d) {
              return d.source.id === element_id && d.target.id === 29 || d.target.id === element_id && element_id === 29;
            }).transition().duration(100).style('stroke', COLORES_FLUJO.default).style('stroke-opacity', null);
          } else {
            STATIC_NODE.close = true;
          }

          break;
      }
    };
  };
  var intro = function intro(stage) {
    var state = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'normal';
    var action = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'none';

    var links_dom = void 0,
        nodes_dom = void 0,
        intro_container = void 0,
        intro_buttons = void 0,
        button_last = void 0,
        button_next = void 0,
        paginator = void 0,
        function_button = {
      next: {
        1: function _() {
          var nodes = [2, 19, 13, 18, 12, 29],
              node = void 0,
              links = [{ source: 2, target: 19, color: 'url(#gradient_prod)', indice: 1 }, { source: 19, target: 13, color: 'url(#gradient_prod)', indice: 2 }, { source: 13, target: 18, color: 'url(#gradient_prod)', indice: 3 }, { source: 18, target: 12, color: 'url(#gradient_prod)', indice: 4 }, { source: 18, target: 29, color: COLORES_FLUJO.perdida, indice: 4 }];

          apagarNodos();
          apagarLinks();

          // Encender nodos seleccionados
          nodes.forEach(function (v, k) {
            node = d3.select('#node_' + v);
            node.select('rect').transition().delay(250 * (k + 1)).duration(200).style('stroke', 'black');
            node.select('text').transition().delay(250 * (k + 1)).duration(200).style('fill', 'black');
          });

          // Encender links seleccionados
          links.forEach(function (v, k) {
            d3.selectAll('#sankey .link').filter(function (element) {
              return element.source.id === v.source && element.target.id === v.target;
            }).transition().delay(250 * v.indice).duration(200).style('stroke', v.color).style('stroke-opacity', 0.5);
          });
        },
        2: function _() {
          var nodes = [25, 23, 27, 26, 28, 22],
              node = void 0,
              links = [{ source: 12, target: 25, color: 'url(#gradient_prod)', indice: 1 }, { source: 12, target: 23, color: 'url(#gradient_prod)', indice: 2 }, { source: 12, target: 27, color: 'url(#gradient_prod)', indice: 3 }, { source: 12, target: 26, color: 'url(#gradient_prod)', indice: 4 }, { source: 12, target: 28, color: 'url(#gradient_prod)', indice: 5 }, { source: 12, target: 22, color: 'url(#gradient_prod)', indice: 6 }, { source: 12, target: 29, color: COLORES_FLUJO.perdida, indice: 7 }];

          // Encender nodos seleccionados
          nodes.forEach(function (v, k) {
            node = d3.select('#node_' + v);
            node.select('rect').transition().delay(250 * (k + 1)).duration(200).style('stroke', 'black');
            node.select('text').transition().delay(250 * (k + 1)).duration(200).style('fill', 'black');
          });

          // Encender links seleccionados
          links.forEach(function (v, k) {
            d3.selectAll('#sankey .link').filter(function (element) {
              return element.source.id === v.source && element.target.id === v.target;
            }).transition().delay(250 * v.indice).duration(200).style('stroke', v.color).style('stroke-opacity', 0.5);
          });
        },
        3: function _() {}
      },
      back: {
        0: function _() {
          encederNodos();
          encederLinks();
        },
        1: function _() {
          var nodes = [25, 23, 27, 26, 28, 22],
              node = void 0;

          // Encender nodos seleccionados
          nodes.forEach(function (v, k) {
            node = d3.select('#node_' + v);
            node.select('rect').transition().delay(250).duration(200).style('stroke', null);
            node.select('text').transition().delay(250).duration(200).style('fill', null);
          });

          // Encender links seleccionados
          d3.selectAll('#sankey .link').filter(function (element) {
            return element.source.id === 12;
          }).transition().delay(250).duration(200).style('stroke', COLORES_FLUJO.default).style('stroke-opacity', null);
        },
        2: function _() {
          d3.select('.special-component-selector').transition().style('outline-style', 'none');
        }
      },
      start: function start() {
        encederNodos();
        encederLinks();
      },
      end: function end() {
        apagarNodos();
        apagarLinks();

        $('.mini-tooltip').fadeIn();
      }
    };

    switch (state) {
      case 'create':
        d3.select('#modal_contenido').append('div').attr('id', 'intro_screen').style('top', '0px').style('left', '0px');
        intro_container = d3.select('#modal_contenido').append('div').attr('id', 'tooltip_intro');
        intro_container.append('div').attr('class', 'tooltip_header flex flex_justify_between flex_align_start');
        intro_container.select('.tooltip_header').append('h2').attr('class', 'tooltip_name');
        intro_container.select('.tooltip_header').append('img').attr('class', 'tooltip_exit').attr('src', './public/images/cruz.svg').attr('width', '15');
        intro_container.append('div').attr('class', 'tooltip_content');
        intro_container.select('.tooltip_content').append('p').attr('class', 'tooltip_production');
        intro_buttons = intro_container.append('div').attr('class', ' tooltip_footer flex flex_justify_between');
        button_last = intro_buttons.append('button').attr('id', 'last').html('<img class="rotate" src="./public/images/flecha.svg" alt="back icon" width="10">Anterior');
        paginator = intro_buttons.append('aside').html(stage + 1 + ' / ' + INTRO.nodes_title.length);
        button_next = intro_buttons.append('button').attr('id', 'next').html('Siguiente<img src="./public/images/flecha.svg" alt="next icon" width="10">');

        $('.tooltip_exit').last().on('click', function () {
          intro(stage, 'delete', 'none');
        });
        $(document).keyup(function (e) {
          if (e.keyCode === 27 && $('.tooltip_exit').length === 2) {
            intro(stage, 'delete', 'none');
          }
        });
        $('#intro_screen').first().on('click', function (d) {
          intro(stage, 'delete', 'none');
        });

        function_button.start();
        break;
      case 'delete':
        function_button.end();

        d3.select('#tooltip_intro').remove();
        d3.select('#intro_screen').remove();
        d3.selectAll('#sankey .node rect').transition().style('fill', null).style('stroke', null);
        d3.selectAll('#sankey .node text').transition().style('fill', null);
        d3.selectAll('#sankey .link').filter(function (d) {
          return d.source.id !== 30 && d.target.id !== 31;
        }).transition().style('stroke', null).style('stroke-opacity', null);
        return false;
      case 'normal':
        intro_container = d3.select('#tooltip_intro');
        intro_buttons = intro_container.select('div:nth-child(3)');
        button_last = intro_buttons.select('#last');
        paginator = intro_buttons.select('aside');
        button_next = intro_buttons.select('#next');

        if (action !== 'none') {
          function_button[action][stage]();
        }

        break;
    }

    intro_container.select('h2').html(INTRO.nodes_title[stage]);
    intro_container.select('p').html(INTRO.nodes_description[stage]);
    paginator.html(stage + 1 + ' / ' + INTRO.nodes_title.length);

    if (stage === 0) {
      button_last.attr('class', 'btn btn-default btn-xs').style('opacity', 0);
      button_next.attr('class', 'btn btn-default btn-xs').on('click', function () {
        intro(stage + 1, 'normal', 'next');
      });
    } else if (stage === INTRO.nodes_title.length - 1) {
      button_last.attr('class', 'btn btn-default btn-xs').on('click', function () {
        intro(stage - 1, 'normal', 'back');
      });
      button_next.attr('class', 'btn btn-primary btn-xs').html('¡Ir al balance!').on('click', function () {
        intro(stage, 'delete', 'none');
      });
    } else {
      button_last.attr('class', 'btn btn-default btn-xs').on('click', function () {
        intro(stage - 1, 'normal', 'back');
      }).transition().style('opacity', null);
      button_next.attr('class', 'btn btn-default btn-xs').html('Siguiente<img src="./public/images/flecha.svg" alt="next icon" width="10">').on('click', function () {
        intro(stage + 1, 'normal', 'next');
      });
    }
  };
  var downloadFile = function downloadFile(anio, file) {
    var promise = new Promise(function (success) {
      if (file === 'sankey') {
        d3.json('./public/data/data_' + anio + '.json', function (data) {

          GLOBAL_NODES = data.nodes;
          GLOBAL_LINKS = data.links;

          success();
        });
      } else {
        d3.csv('./public/data/glosario.csv', function (data) {
          GLOSARIO = data;

          success();
        });
      }
    });

    return promise;
  };
  var dibujarSankey = function dibujarSankey(data, options) {
    // Se definen variables
    var headerSize = 38,
        margin = options.margin,
        size = options.size,
        anchoNodo = options.anchoNodo,
        separacionNodo = options.separacionNodo,
        posColumnas = [];

    // Creación SVG
    svg = d3.select('#sankey').append('svg').attr('width', size.width).attr('height', size.height).attr('preserveAspectRatio', 'xMidYMid meet');
    // Se agregan encabezados
    var encabezado = svg.append('g').attr('id', 'chart-encabezado').attr('style', 'transform: translate(' + margin.left + 'px, ' + (margin.top + 15) + 'px); -webkit-transform: translate(' + margin.left + 'px, ' + (margin.top + 15) + 'px)');
    encabezado.append('text').attr('class', 'chart-encabezado-left').attr('x', -10).text(SANKEY.secciones_header[0][0]);
    encabezado.append('text').attr('class', 'chart-encabezado-left').attr('x', -10).attr('y', 19).text(SANKEY.secciones_header[0][1]);
    // Se crea grafico
    var chart = svg.append('g').attr('style', 'transform: translate(' + margin.left + 'px, ' + (margin.top + $('#chart-encabezado')[0].getBBox().height + margin.header) + 'px); -webkit-transform: translate(' + margin.left + 'px, ' + (margin.top + $('#chart-encabezado')[0].getBBox().height + margin.header) + 'px)');

    // Creación Sankey
    sankeyChartD3 = d3.sankey().nodeWidth(anchoNodo).nodePadding(separacionNodo).size([size.width - margin.left - margin.right, size.height - margin.top - margin.bottom]).nodes(data.nodes).links(data.links).layout();

    // Generación de gradientes
    var defs = svg.append('defs');

    var gradient_imp = defs.append('linearGradient').attr('id', 'gradient_imp').attr('x1', '100%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
    gradient_imp.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.importacion).attr('stop-opacity', 1);
    gradient_imp.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.importacion).attr('stop-opacity', 1);
    gradient_imp.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.importacion).attr('stop-opacity', 0);
    var gradient_imp_default = defs.append('linearGradient').attr('id', 'gradient_imp_default').attr('x1', '100%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
    gradient_imp_default.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
    gradient_imp_default.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
    gradient_imp_default.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 0);
    var gradient_exp = defs.append('linearGradient').attr('id', 'gradient_exp').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    gradient_exp.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.exportacion).attr('stop-opacity', 1);
    gradient_exp.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.exportacion).attr('stop-opacity', 1);
    gradient_exp.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.exportacion).attr('stop-opacity', 0);
    var gradient_exp_default = defs.append('linearGradient').attr('id', 'gradient_exp_default').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    gradient_exp_default.append('stop').attr('offset', '0%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
    gradient_exp_default.append('stop').attr('offset', '50%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 1);
    gradient_exp_default.append('stop').attr('offset', '100%').attr('stop-color', COLORES_FLUJO.default).attr('stop-opacity', 0);
    var gradient_prod = defs.append('linearGradient').attr('gradientUnits', 'userSpaceOnUse').attr('id', 'gradient_prod').attr('x1', '0%').attr('y1', '50%').attr('x2', '100%').attr('y2', '50%');
    gradient_prod.append('stop').attr('offset', '0%').attr('stop-color', 'rgb(32,106,171)').attr('stop-opacity', 1);
    gradient_prod.append('stop').attr('offset', '20%').attr('stop-color', 'rgb(0,117,201)').attr('stop-opacity', 1);
    gradient_prod.append('stop').attr('offset', '40%').attr('stop-color', 'rgb(0,157,218)').attr('stop-opacity', 1);
    gradient_prod.append('stop').attr('offset', '60%').attr('stop-color', 'rgb(77,203,236)').attr('stop-opacity', 1);
    gradient_prod.append('stop').attr('offset', '80%').attr('stop-color', 'rgb(127,218,241)').attr('stop-opacity', 1);
    gradient_prod.append('stop').attr('offset', '100%').attr('stop-color', 'rgb(178,233,247)').attr('stop-opacity', 1);

    // Creación de Links
    path = sankeyChartD3.link();
    //  Se crean links
    var link = chart.append('g').attr('id', 'links').selectAll('.link').data(sankeyChartD3.links()).enter().append('path').attr('d', path).attr('class', 'link').style('stroke-width', function (d) {
      return Math.max(1, d.dy);
    });
    link.filter(function (element) {
      return element.source.id === 30;
    }).style('stroke', 'url(#gradient_imp_default)');
    link.filter(function (element) {
      return element.target.id === 31;
    }).style('stroke', 'url(#gradient_exp_default)');
    // Se crean nodos
    var node = chart.append('g').attr('id', 'nodes').selectAll('.node').data(sankeyChartD3.nodes()).enter().append('g').attr('id', function (d) {
      return 'node_' + d.id;
    }).attr('class', 'node').attr('style', function (d) {
      if (posColumnas.indexOf(d.x) === -1) {
        posColumnas.push(d.x);
      }

      return 'transform: translate(' + d.x + 'px, ' + d.y + 'px); -webkit-transform: translate(' + d.x + 'px, ' + d.y + 'px)';
    });
    // Se crean rectangulos nodos
    node.filter(function (element) {
      return element.nombre !== 'borrar' && element.oferta_interna > 0 || typeof element.oferta_interna === 'undefined';
    }).append('rect').attr('width', sankeyChartD3.nodeWidth()).attr('height', function (d) {
      return Math.max(5, d.dy);
    }).on('mouseenter', fade('fadeIn', null)).on('mouseleave', fade('fadeOut', null)).on('click', function (d) {
      STATIC_NODE.id = d.id;
      STATIC_NODE.close = false;

      tooltipIn(d);
    });
    // Se crean textos nodos
    node.filter(function (element) {
      return element.nombre !== 'borrar' && element.oferta_interna > 0 || typeof element.oferta_interna === 'undefined';
    }).append('text').attr('class', 'node-text').attr('x', 10 + sankeyChartD3.nodeWidth()).attr('y', function (d) {
      return d.dy / 2;
    }).attr('dy', '0.35em').text(function (d) {
      return d.nombre;
    }).filter(function (d) {
      return d.posicionX === 1;
    }).attr('class', 'node-text-start').attr('x', -10);
    // Se agregan encabezados
    posColumnas.sort(function (a, b) {
      return a - b;
    }); // Se ordena posicion de columnas
    SANKEY.secciones_header.forEach(function (v, k) {
      encabezado.append('text').filter(function (d) {
        return k > 0;
      }).attr('class', 'chart-encabezado-right').attr('x', function (d) {
        return posColumnas[k] + anchoNodo + 10;
      }).text(v[0]);
      encabezado.append('text').filter(function (d) {
        return k > 0;
      }).attr('class', 'chart-encabezado-right').attr('x', function (d) {
        return posColumnas[k] + anchoNodo + 10;
      }).attr('y', 19).text(v[1]);
    });
  };
  var calcularAltura = function calcularAltura() {
    height = $('#sankey').height();
    width = $('#sankey').width();

    if ($('#modal_contenido > h1').outerHeight() + $('#modal_contenido > p').outerHeight() + $('#modal_contenido > form').outerHeight() + 575 <= $('#modal_contenido').outerHeight()) {
      d3.select('#modal_contenido').attr('style', null);
      SANKEY.anchoNodo = 20;
      SANKEY.separacionNodo = 20;
      SANKEY.size.width = 1400;
      SANKEY.size.height = 550;
      SANKEY.margin.left = 175;
      SANKEY.margin.right = 175;
      SANKEY.margin.top = 40;
      SANKEY.margin.bottom = 40;

      SANKEY.margin.header = 20;
      SANKEY.tooltip.top = 42;
      SANKEY.tooltip.left = 190;
      SANKEY.tooltip.bottom = 7;
    } else {
      d3.select('#modal_contenido').attr('style', null);
      SANKEY.anchoNodo = 10;
      SANKEY.separacionNodo = 15;
      SANKEY.size.width = 1400;
      SANKEY.size.height = 550;
      SANKEY.margin.left = 150;
      SANKEY.margin.right = 150;
      SANKEY.margin.top = 20;
      SANKEY.margin.bottom = 40;

      SANKEY.margin.header = 15;
      SANKEY.tooltip.top = 15;
      SANKEY.tooltip.left = 155;
      SANKEY.tooltip.bottom = -15;
    }

    return true;
  };
  var setearNodosYLinks = function setearNodosYLinks() {
    allLinks = d3.selectAll('#sankey .link');
    allNodes = d3.selectAll('#sankey .node');

    return true;
  };

  // const antesSvg = (anio) => {
  //   let elemento = d3.select('#sankey').append('div');
  //
  //   elemento.append('h4').text(`Energía argentina - ${ anio }`);
  // };
  //
  // for (var i = 1960; i < 2016; i++) {
  //   let anio = i;
  //
  //   console.log(anio);
  //
  //   downloadFile(i, 'sankey')
  //     .then(() => antesSvg(anio))
  //     .then(() => calcularAltura())
  //     .then(() => dibujarSankey({ 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS }, { margin: SANKEY.margin, separacionNodo: SANKEY.separacionNodo, anchoNodo: SANKEY.anchoNodo, size: SANKEY.size }))
  //     .then(() => setearNodosYLinks());
  // }

  downloadFile(2015, 'sankey').then(function () {
    return calcularAltura();
  }).then(function () {
    return dibujarSankey({ 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS }, { margin: SANKEY.margin, separacionNodo: SANKEY.separacionNodo, anchoNodo: SANKEY.anchoNodo, size: SANKEY.size });
  }).then(function () {
    return setearNodosYLinks();
  }).then(function () {
    if (!jQuery.browser.mobile) {
      return intro(0, 'create', 'next');
    }
  }) // Se activa tooltip_intro
  .then(function () {
    return $('#tooltip').fadeOut(100);
  }) // Se activa animación del tooltip_sankey
  .then(function () {
    // Se activan eventos
    // Selector años
    for (var i = 2015; i > 1959; i--) {
      $('select[name=anio]').append('<option value="' + i + '">' + i + '</option>');
    }

    $('select[name=anio]').SumoSelect({ nativeOnDevice: ['Android', 'BlackBerry', 'iPhone', 'iPad', 'iPod', 'Opera Mini', 'IEMobile', 'Silk'] });

    $('select[name=anio]').on('sumo:opened', function (sumo) {
      $('body').attr('style', 'position: fixed');$('.mini-tooltip').remove();
    });
    $('select[name=anio]').on('sumo:closed', function (sumo) {
      $('body').attr('style', 'position: relative');
    });

    $('select[name=anio]').on('change', function (event) {
      $('.mini-tooltip').remove();
      downloadFile($('select[name=anio]')[0].value, 'sankey').then(function () {
        return calcularAltura();
      }).then(function () {
        return $('#sankey').empty();
      }).then(function () {
        return dibujarSankey({ 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS }, { margin: SANKEY.margin, separacionNodo: SANKEY.separacionNodo, anchoNodo: SANKEY.anchoNodo, size: SANKEY.size });
      }).then(function () {
        return setearNodosYLinks();
      }).then(function () {
        return $('#tooltip').fadeOut(100);
      }); // Se activa animación del tooltip_sankey;
    });
    // Se activa exit_tooltip
    $('.tooltip_exit').first().on('click', function (d) {
      $('#tooltip').fadeOut(100);
      fade('fadeOut', STATIC_NODE.id, true)(BUSCAR_NODO(STATIC_NODE.id));
    });
    // Altura contenedor Sankey
    $(window).on('resize', function () {
      calcularAltura(true);
    });
    // Tooltip_scroll_mobile
    var lastScrollLeft = 0;
    $('#sankey').scroll(function (e) {
      var sankeyScrollLeft = $('#sankey').scrollLeft();

      if (lastScrollLeft !== sankeyScrollLeft) {
        $('#tooltip').css({ left: function left() {
            return parseInt($(this).css('left').slice(0, -2)) - (sankeyScrollLeft - lastScrollLeft) + 'px';
          } });
        lastScrollLeft = sankeyScrollLeft;
      }
    });

    // Botones de avance de año
    $('#nextYear').on('click', function (event) {
      var data = $('select[name=anio]')[0].sumo.getSelStr(),
          data_number = Number(data);

      if (data_number < 2015) {
        $('select[name=anio]')[0].sumo.selectItem('' + (data_number + 1).toString());
      }
    });
    $('#backYear').on('click', function (event) {
      var data = $('select[name=anio]')[0].sumo.getSelStr(),
          data_number = Number(data);

      if (data_number > 1960) {
        $('select[name=anio]')[0].sumo.selectItem('' + (data_number - 1).toString());
      }
    });
  });

  downloadFile(null, 'glosario').then(function () {
    $('.tooltip_glosary').hide();
    $('button[name="citas"]').css({ opacity: 0 });

    // Activo eventos de los botones de la tooltip
    $('button[name="glosario"]').on('click', function (event) {

      $('.tooltip_glosary').text(GLOSARIO[STATIC_NODE.id].descripcion).fadeIn('fast');
      $('.tooltip_content').hide();

      d3.select('button[name="citas"]').transition().attr('style', null);
      d3.select('button[name="glosario"]').transition().style('opacity', 0);
    });
    $('button[name="citas"]').on('click', function (event) {
      $('.tooltip_glosary').hide();
      $('.tooltip_content').fadeIn('fast');

      d3.select('button[name="citas"]').transition().style('opacity', 0);
      d3.select('button[name="glosario"]').transition().attr('style', null);
    });
  });
});