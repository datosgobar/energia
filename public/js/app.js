'use strict';

var colores = ['#ffbb42', '#808080', '#f1854b', '#f2385a'];

//  Variables Globales
// let scaleColorLink  = d3.scaleOrdinal()
//   .range('white')
//   // .range(colores)
//   .domain('Energías Primarias', 'Centros de Transformación', 'Energías Secundarias', 'Consumo');
var fontScale = d3.scaleLinear().range([8, 16]);

//  Funciones
// const formatoNumero = (d) => {
//   let format = d3.format(',.0f');
//
//   return `${ format(d) } Twh`;
// };

/* Resta el porcentaje indicado a un color (RR, GG o BB) hexadecimal para oscurecerlo */
var subtractLight = function subtractLight(color, amount) {
  var cc = parseInt(color, 16) - amount;
  var c = cc < 0 ? 0 : cc;
  c = c.toString(16).length > 1 ? c.toString(16) : '0' + c.toString(16);

  return c;
};

/* Oscurece un color hexadecimal de 6 caracteres #RRGGBB segun el porcentaje indicado */
var darken = function darken(color, amount) {
  color = color.indexOf('#') >= 0 ? color.substring(1, color.length) : color;
  amount = parseInt(255 * amount / 100);
  color = '#' + subtractLight(color.substring(0, 2), amount) + subtractLight(color.substring(2, 4), amount) + subtractLight(color.substring(4, 6), amount);

  return color;
};

$(function () {

  var height = $('#content').height(),
      width = $('#content').width() - $('#placa').width(),

  // clavesNodos = [],
  // dataSankey  = {},
  // moveId = 0,
  nodesOri = void 0,
      linksOri = void 0,
      nodesGlo = void 0,
      linksGlo = void 0,
      sankeyChartD3 = void 0,
      path = void 0,
      svg = void 0;

  //  Funciones
  // const generarPuertas    = () => {
  //   dataSankey.nodes.filter((element) => (element.parent === false)).forEach((v, k) => {
  //     clavesNodos.push({ 'id': v.id, 'state': true });
  //   });
  // };
  var createGrafico = function createGrafico(data, container) {
    // Variables
    var margin = { top: 0, right: 0, bottom: 0, left: 0 };
    var size = { width: 300 - margin.left - margin.right, height: 50 - margin.top - margin.bottom };
    var years = ['2012', '2013', '2014', '2015', '2016', '2017'];
    var newData = [];

    data.forEach(function (v, k) {
      newData.push({ date: new Date(years[k]), value: v });
    });

    var svgGrafico = container.html('').append('svg').attr('width', size.width + margin.left + margin.right).attr('height', size.height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // let parseTime = d3.timeParse('%d-%b-%y');

    var x = d3.scaleTime().domain(d3.extent(newData, function (d) {
      return d.date;
    })).rangeRound([0, size.width]);
    var y = d3.scaleLinear().domain(d3.extent(newData, function (d) {
      return d.value;
    })).rangeRound([size.height, 0]);

    var line = d3.line().x(function (d) {
      return x(d.date);
    }).y(function (d) {
      return y(d.value);
    });

    svgGrafico.append('g').call(d3.axisBottom(x)).style('transform', 'translate(0px, ' + (size.height - 1) + 'px)');

    svgGrafico.append('g').call(d3.axisLeft(y));
    // .append('text')
    //   .attr('fill', '#000')
    //   .attr('transform', 'rotate(-90)')
    //   .attr('y', 6)
    //   .attr('dy', '0.71em')
    //   .attr('text-anchor', 'end')
    //   .text('Price ($)');

    svgGrafico.append('path').datum(newData).attr('fill', 'none').attr('stroke', 'steelblue').attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round').attr('stroke-width', 1.5).attr('d', line);
  };
  var updatePlaca = function updatePlaca(element) {
    var contenedor = d3.select('#placa');
    contenedor.select('.placa_titulo').style('text-transform', 'uppercase').text(element.name);
    contenedor.select('.placa_prod').text(element.value);
    contenedor.select('.placa_imp').text(element.value * 0.2);
    contenedor.select('.placa_exp').text(element.value * 0.1);
    contenedor.select('.placa_lost').text(element.value * 0.05);
    contenedor.select('.placa_efi').text((element.value - element.value * 0.05) * 100 / element.value);
    contenedor.select('.placa_more').text(element.value * 0.01);

    createGrafico(element.prod, contenedor.select('.placa_grafico.grafico_prod'));
    createGrafico(element.imp, contenedor.select('.placa_grafico.grafico_imp'));
    createGrafico(element.exp, contenedor.select('.placa_grafico.grafico_exp'));
  };

  var fadeIn = function fadeIn(opacity) {
    return function (g, i) {
      updatePlaca(g);

      var id_nodes = [],
          links = void 0,
          linksFilter = void 0,
          nodes = void 0,
          nodesFilter = void 0;

      // add event node
      id_nodes.push(g.id);
      // add sourceLinks
      g.sourceLinks.forEach(function (link) {
        id_nodes.push(link.target.id);
      });
      // add targetLinks
      g.targetLinks.forEach(function (link) {
        id_nodes.push(link.source.id);
      });

      // select links
      links = d3.selectAll('#sankey .link');
      //  links focusIn
      // d3.selectAll('#sankey .link')
      //   .filter((d) => (d.source.id === g.id || d.target.id === g.id))
      //   .transition().style('stroke-opacity', .75);
      // links focusOut
      linksFilter = links.filter(function (d) {
        return d.source.id !== g.id && d.target.id !== g.id;
      });
      linksFilter.transition().style('stroke-opacity', opacity);

      //  select nodes
      nodes = d3.selectAll('#sankey .node');
      // nodes focusIn
      nodesFilter = nodes.filter(function (d) {
        var statusNode = false;

        id_nodes.forEach(function (element) {
          if (element === d.id) {
            statusNode = true;
          }
        });

        return statusNode;
      });
      nodesFilter.select('rect').transition().style('fill', function (d) {
        return darken('white', 20);
      });
      // nodesFilter.select('rect').transition().style('fill', (d) => darken(colores[d.pos - 1], 20));
      nodesFilter.select('text').transition().attr('text-anchor', 'middle').attr('y', -10)
      // .text((d) => (d.name))
      .attr('x', function (d) {
        return d.dx / 2;
      });
      // nodes focusOut
      nodesFilter = nodes.filter(function (d) {
        var statusNode = true;

        id_nodes.forEach(function (element) {
          if (element === d.id) {
            statusNode = false;
          }
        });

        return statusNode;
      });
      nodesFilter.transition().style('opacity', opacity);
    };
  };
  var fadeOut = function fadeOut(opacity) {
    return function (g, i) {

      var id_nodes = [],
          links = void 0,
          linksFilter = void 0,
          nodes = void 0,
          nodesFilter = void 0;

      // add event node
      id_nodes.push(g.id);
      // add sourceLinks
      g.sourceLinks.forEach(function (link) {
        id_nodes.push(link.target.id);
      });
      // add targetLinks
      g.targetLinks.forEach(function (link) {
        id_nodes.push(link.source.id);
      });

      // select links
      links = d3.selectAll('#sankey .link');
      //  links focusIn
      // d3.selectAll('#sankey .link')
      //   .filter((d) => (d.source.id === g.id || d.target.id === g.id))
      //   .transition().style('stroke-opacity', .75);
      // links focusOut
      linksFilter = links.filter(function (d) {
        return d.source.id !== g.id && d.target.id !== g.id;
      });
      linksFilter.transition().style('stroke-opacity', 0.75);

      //  select nodes
      nodes = d3.selectAll('#sankey .node');
      // nodes focusIn
      nodesFilter = nodes.filter(function (d) {
        var statusNode = false;

        id_nodes.forEach(function (element) {
          if (element === d.id) {
            statusNode = true;
          }
        });

        return statusNode;
      });
      nodesFilter.select('rect').transition().style('fill', function (d) {
        return 'white';
      });
      // .style('fill', (d) => colores[d.pos - 1]);
      nodesFilter.select('text').transition().attr('text-anchor', 'end').attr('y', function (d) {
        return d.dy / 2;
      }).attr('x', -10)
      // .text((d) => (d.name.length > 8) ? (d.name.substring(0, 5) + '...') : (d.name))
      .filter(function (d) {
        return d.x < width / 2;
      }).attr('x', 10 + sankeyChartD3.nodeWidth()).attr('text-anchor', 'start');
      // nodes focusOut
      nodesFilter = nodes.filter(function (d) {
        var statusNode = true;

        id_nodes.forEach(function (element) {
          if (element === d.id) {
            statusNode = false;
          }
        });

        return statusNode;
      });
      nodesFilter.transition().style('opacity', 1);
    };
  };
  // const colapsarExpandirNodo = (nodo) => {
  //
  //   nodesOri[nodo.id].group = (nodesOri[nodo.id].group) ? (false) : (true);
  //
  //   return nodesOri;
  //
  //
  //   // let oldLinks = dataSankey.links;
  //
  //   // if (nodo.parent === false) {
  //   //   console.log('Se expande nodo');
  //   //   clavesNodos.forEach((element) => { if (element.id === nodo.id + moveId) { element.state = false; } });
  //   //
  //   //   dataSankey.nodes = nodosOriginales;
  //   //   dataSankey.links = linksOriginales;
  //   //
  //   //   dataSankey.links = declareGroupLinks(dataSankey.links, true);
  //   //
  //   //   dataSankey = buscarNodes(dataSankey.nodes, dataSankey.links);
  //   //   moveId = 0;
  //   //   $('#sankey').empty();
  //   //   dibujarSankey(width, height, dataSankey);
  //   //   // actualizarSankey($('#content').width(), $('#content').height(), dataSankey, oldLinks);
  //   // } else {
  //   //   console.log('Se colapsa nodo');
  //   //   // let parent = dataSankey.nodes.filter((element) => (element.name === nodo.parent))[0];
  //   //   // clavesNodos.filter((element) => (element.id === parent.id))[0].state = true;
  //   //   //
  //   //   // dataSankey = buscarNodes(nodosOriginales, dataSankey.links = declareGroupLinks(linksOriginales));
  //   //   //
  //   //   // $('#sankey').empty();
  //   //   // dibujarSankey(width, height, dataSankey);
  //   //   // actualizarSankey($('#content').width(), $('#content').height(), dataSankey, oldLinks);
  //   // }
  // };
  var createBackButton = function createBackButton(node) {
    console.log(node);
    var button = d3.select('#placa .agrup').append('div').attr('id', function () {
      return 'node_' + node.id;
    }).attr('class', 'backButton').on('click', function (event) {
      if (nodesOri[node.id].group) {
        nodesOri[node.id].group = false;
      } else {
        nodesOri[node.id].group = true;
      }

      $('#node_' + node.id).remove();

      preSankey();
    });

    button.append('span').attr('class', 'backButton_text').text(node.name);
    button.append('span').append('i').attr('class', 'fa fa-times').attr('aria-hidden', 'true').style('margin-left', '10px');
  };
  var dibujarSankey = function dibujarSankey(width, heigth, data) {

    // Variables
    var margin = { top: 50, right: 50, bottom: 50, left: 50 };
    var size = { width: width - margin.left - margin.right, height: heigth - margin.top - margin.bottom };
    var anchoNodo = 20;

    $('#sankey').empty();

    // Creación SVG
    svg = d3.select('#sankey').append('svg').attr('width', size.width + margin.left + margin.right).attr('height', size.height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // Creación Sankey
    sankeyChartD3 = d3.sankey().nodeWidth(anchoNodo) // Ancho nodo
    .size([size.width, size.height]).nodes(data.nodes).links(data.links).layout();

    // const generarGradientes = (colores) => {
    //   let keys = {};
    //
    //   colores.forEach((v, k) => {
    //
    //     colores.forEach((v2, k2) => {
    //
    //       keys[`${ k + 1 }${ k2 + 1 }`] = [v, v2];
    //     });
    //   });
    //
    //   return keys;
    // };
    //
    // let keys = generarGradientes(colores);
    //
    // console.log(keys);
    //
    // for (let key in keys) {
    //
    //   eval(`let key_${ key } = svg.append('defs')
    //     .append('linearGradient')
    //       .attr('id', 'key_${ key }')
    //       .attr('x1', '0%')
    //       .attr('x2', '100%')
    //       .attr('spreadMethod', 'pad');
    //     key_${ key }.append('stop')
    //         .attr('offset', '0%')
    //         .attr('stop-color', '${ keys[key][0] }')
    //         .attr('stop-opacity', 1);
    //     key_${ key }.append('stop')
    //         .attr('offset', '100%')
    //         .attr('stop-color', '${ keys[key][1] }')
    //         .attr('stop-opacity', 1);`);
    // }

    // Creación de Links
    path = sankeyChartD3.link();

    fontScale.domain(d3.extent(data.nodes, function (d) {
      return d.value;
    }));

    //  Se crean links
    var link = svg.append('g').attr('id', 'links').selectAll('.link').data(data.links).enter().append('path').attr('class', 'link').attr('d', path).style('stroke-width', function (d) {
      return Math.max(1, d.dy);
    })
    // .style('stroke', 'silver')
    // trabajando
    .style('stroke', function (d) {
      return 'silver';
    })
    // .style('stroke', (d) => {
    //   let key = [d.source.pos, d.target.pos];
    //
    //   return `url(#key_${ key[0] }${ key[1] })`;
    // })
    .style('stroke-opacity', 0.75).on('mouseover', function (d) {
      d3.select(d3.event.target).style('stroke-opacity', 1);
    }).on('mouseout', function (d) {
      d3.select(d3.event.target).style('stroke-opacity', 0.75);
    }).sort(function (a, b) {
      return b.dy - a.dy;
    });

    link.filter(function (element) {
      return element.target.name === 'EXPORTACIONES' || element.target.name === 'CONSUMO PROPIO' || element.target.name === 'TRANSPORTE' || element.target.name === 'PERDIDA';
    }).style('stroke', '#BA3F1D');
    link.filter(function (element) {
      return element.source.name === 'IMPORTACIONES';
    }).style('stroke', 'green');

    // Se crean nodos
    var node = svg.append('g').attr('id', 'nodes').selectAll('.node').data(data.nodes.filter(function (element) {
      return element.sourceLinks.length !== 0 || element.targetLinks.length !== 0;
    })).enter().append('g').attr('id', function (d) {
      return d.id;
    }).attr('class', 'node').attr('transform', function (d) {
      return 'translate(' + d.x + ', ' + d.y + ')';
    }).call(d3.drag().on('drag', dragmove));
    // Se crean rectangulos nodos
    node.append('rect').attr('width', sankeyChartD3.nodeWidth()).attr('height', function (d) {
      return Math.max(10, d.dy);
    }).style('stroke', function (d) {
      return 'silver';
    }).style('fill', function (d) {
      return 'white';
    })
    // .style('fill', (d) => colores[d.pos - 1])
    .on('mouseover', fadeIn(0.025)).on('mouseout', fadeOut()).on('dblclick', function (e) {

      if (nodesOri[e.id].group) {
        nodesOri[e.id].group = false;
      } else {
        nodesOri[e.id].group = true;
      }
      createBackButton(e);
      preSankey();
    });

    // Se crean textos nodos
    node.append('text').attr('x', -10).attr('text-anchor', 'end').attr('y', function (d) {
      return d.dy / 2;
    }).attr('dy', '.35em').style('fill', 'black')
    // .style('fill', (d) => colores[d.pos - 1])
    .style('font-size', '14px').style('font-weight', 'normal')
    // .style('font-size', (d) => `${ Math.floor(fontScale(d.value)) }px`)
    .text(function (d) {
      return d.name;
    })
    // .text((d) => (d.name.length > 8) ? (d.name.substring(0, 5) + '...') : (d.name))
    .filter(function (d) {
      return d.x < width / 2;
    }).attr('x', 10 + sankeyChartD3.nodeWidth()).attr('text-anchor', 'start');
    // Se agrega texto referencia hover link
    link.append('title').text(function (d) {
      return d.source.name + ' (' + d.source.id + ') \u2192 ' + d.target.name + ' (' + d.target.id + ') \u2192 ' + d.value;
    });
    // Se agrega texto referencia hover node
    // node.append('title').text((d) => `${ d.name } (${ d.id })`);

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr('transform', 'translate(' + (d.x = Math.max(0, Math.min(size.width - d.dx, d3.event.x))) + ', ' + (d.y = Math.max(0, Math.min(size.height - d.dy, d3.event.y))) + ')');
      sankeyChartD3.relayout();
      link.attr('d', path);
    }
  };

  var actualizarSankey = function actualizarSankey(width, heigth, data, oldLinks) {
    var linksDiff = function linksDiff(links_old, links_new) {
      console.log(links_old);
      console.log(links_new);
      var links = [],
          source = void 0,
          target = void 0;

      links_new.forEach(function (v, k) {
        source = v.source;
        target = v.target;

        links_old.forEach(function (v, k) {
          if (source !== v.source.id || target !== v.target.id) {
            links.push(v);
          }
        });
      });

      return links;
    };

    // let newNodes = nodesDiff(data, sankeyData);
    // let newLinks = linksDiff(oldLinks, data.links);

    // Parametros
    var margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
    var size = {
      width: width - margin.left - margin.right,
      height: heigth - margin.top - margin.bottom
    };

    // Creación Sankey
    sankeyChartD3 = d3.sankey().nodeWidth(20) // Ancho nodo
    .size([size.width, size.height]).nodes(data.nodes).links(data.links).layout(32);

    sankeyChartD3.relayout();

    // Creación de Links
    path = sankeyChartD3.link();
    $('#links').empty();

    var links = d3.select('#links').selectAll('.link').data(data.links).enter();

    links.append('path').attr('class', 'link').attr('d', function (d) {
      return path(d);
    }).style('stroke-width', function (d) {
      return d.dy;
    }).style('stroke', 'gray').on('mouseover', function (d) {
      // console.log(d3.event);
      d3.select(d3.event.target).style('stroke', 'red');
    }).on('mouseout', function (d) {
      d3.select(d3.event.target).style('stroke', 'gray');
    });

    // d3.selectAll('.link')
    //   .data(data.links)
    //   .attr('d', (d) => path(d));
    d3.selectAll('.node').data(data.nodes)
    // .transition()
    .attr('transform', function (d) {
      return 'translate(' + d.x + ', ' + d.y + ')';
    });
    d3.selectAll('rect').data(data.nodes).style('opacity', 0).attr('width', sankeyChartD3.nodeWidth()).attr('height', function (d) {
      return d.dy;
    }).transition().style('opacity', 1);

    // Create Diference
    // newLinks.forEach((v, k) => {
    //   let link = d3.select('#links')
    //     .append('path')
    //       .attr('class', 'link')
    //       .attr('d', () => path(v))
    //       .style('stroke-width', () => Math.max(1, v.dy))
    //       .style('stroke', () => scaleColor(v.source.name.replace(' ', '')))
    //       .sort((a, b) => (b.dy - a.dy));
    //
    //   link.append('title').text(() => `${ v.source.name } → ${ v.target.name } \n ${ formatoNumero(v.value) }`);
    // });
  };
  var maxParent = function maxParent(nodo) {
    // console.log(nodo);
    var parentNode = nodesGlo.filter(function (element) {
      return element.id === nodo.parent;
    })[0];

    if (nodo.parent !== false) {
      if (typeof parentNode !== 'undefined' && parentNode.group === true) {
        return maxParent(nodesGlo.filter(function (element) {
          return element.id === nodo.parent;
        })[0]);
      } else {
        return nodo;
      }
    } else {
      return nodo;
    }
  };
  var deleteEmptyNodes = function deleteEmptyNodes() {
    var del = 0,
        nodesDelete = [],
        status = void 0;

    // moveId = 0;

    nodesGlo.forEach(function (node, nodeI) {
      // console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')');
      status = false;

      // Consulto si el nodo se utiliza en algun link
      linksGlo.forEach(function (link, linkI) {
        if (node.id === link.source) {
          status = true;
          link.source = link.source - del;
        }
        if (node.id === link.target) {
          status = true;
          link.target = link.target - del;
        }
      });

      // // Modificar el ID restando la cantidad de elementos borrados
      // node.id = node.id - del;

      if (!status) {
        // console.log('Borrar');
        nodesDelete.push(nodeI);
        del++;
      }
      // else {
      //   // console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')<-');
      // }
    });

    nodesDelete.reverse().forEach(function (node) {
      nodesGlo.splice(node, 1);
    });

    // moveId = del;
    // nodes.forEach((node, nodeI) => {
    //   console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')');
    // });

    // console.log(links);
    return nodesGlo;
  };

  var declareGroupLinks = function declareGroupLinks() {
    var desarrollo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var links = [],
        source = void 0,
        parentSource = void 0,
        stateSource = void 0,
        target = void 0,
        parentTarget = void 0,
        stateTarget = void 0,
        nodoExistente = void 0,
        addSource = void 0,
        addTarget = void 0,
        addValue = void 0;

    linksGlo.forEach(function (v, k) {
      //Se obtiene source y target del elemento
      source = nodesGlo.filter(function (element) {
        return element.id === parseInt(v.source);
      })[0];
      target = nodesGlo.filter(function (element) {
        return element.id === parseInt(v.target);
      })[0];
      //Se guarda source-padre y target-padre
      parentSource = maxParent(source);
      parentTarget = maxParent(target);
      //Se guarda source-state y target-state
      stateSource = parentSource.group;
      stateTarget = parentTarget.group;
      //Se guarda source y link a crear
      addSource = stateSource ? parentSource : source;
      addTarget = stateTarget ? parentTarget : target;
      addValue = parseInt(v.value);
      //Se consulta si el nodo existe
      nodoExistente = links.filter(function (element) {
        return element.source === addSource.id && element.target === addTarget.id;
      });

      if (nodoExistente.length !== 0) {
        //Se suma valor a duplicado
        nodoExistente[0].value += addValue;
      } else {
        //Se creo nuevo link
        links.push({
          'source': addSource.id,
          'target': addTarget.id,
          'value': addValue
        });
      }
    });
    return links;
  };

  var preSankey = function preSankey() {
    linksGlo = $.extend(true, [], linksOri);
    nodesGlo = $.extend(true, [], nodesOri);
    linksGlo = declareGroupLinks();
    nodesGlo = deleteEmptyNodes();

    dibujarSankey(width, height, { 'nodes': nodesGlo, 'links': linksGlo });
  };

  var init = function init() {

    var downloadFile = function downloadFile() {
      console.log('Se solicitan archivos'); // Borrar

      var formatoSankey = function formatoSankey(elemento, data) {
        var processData = [];

        switch (elemento) {
          case 'nodos':
            data.forEach(function (v, k) {
              processData.push({
                'id': parseInt(v.id),
                'name': v.name,
                'parent': v.parent === 'null' ? false : parseInt(v.parent),
                'category': v.category,
                'pos': parseInt(v.position),
                'group': v.group === 'true' ? true : false,
                'imp': v.importation.split(';').map(function (element) {
                  return parseInt(element);
                }),
                'exp': v.exportation.split(';').map(function (element) {
                  return parseInt(element);
                }),
                'prod': v.production.split(';').map(function (element) {
                  return parseInt(element);
                })
              });
            });
            break;
          case 'links':
            data.forEach(function (v, k) {
              processData.push({
                'source': parseInt(v.source),
                'target': parseInt(v.target),
                'value': parseInt(v.value)
              });
            });
            break;
        }

        return processData;
      };

      var promise = new Promise(function (success) {
        d3.csv('public/src/nodes.csv', function (nodos) {
          nodesOri = formatoSankey('nodos', nodos);

          d3.csv('public/src/links.csv', function (links) {
            linksOri = formatoSankey('links', links);

            success();
          });
        });
      });

      return promise;
    };

    downloadFile().then(function () {
      preSankey();
    });
  };

  init();
});
"use strict";

d3.sankey = function () {

  var sankey = {},
      nodeWidth = 24,
      nodeSpacing = 8,
      size = [1, 1],
      nodes = [],
      links = [],
      defaultLinkCurvature = 0.5;

  sankey.nodeWidth = function (_) {
    if (!arguments.length) {
      return nodeWidth;
    }
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodeSpacing = function (_) {
    if (!arguments.length) {
      return nodeSpacing;
    }
    nodeSpacing = +_;
    return sankey;
  };

  sankey.nodes = function (_) {
    if (!arguments.length) {
      return nodes;
    }
    nodes = _;
    return sankey;
  };

  sankey.links = function (_) {
    if (!arguments.length) {
      return links;
    }
    links = _;
    return sankey;
  };

  sankey.size = function (_) {
    if (!arguments.length) {
      return size;
    }
    size = _;
    return sankey;
  };

  sankey.layout = function (iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function () {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function () {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x1 + "," + y1;
    }

    link.curvature = function (_) {
      if (!arguments.length) {
        return curvature;
      }
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function (node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function (link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function (node) {
      node.value = Math.max(d3.sum(node.sourceLinks, value), d3.sum(node.targetLinks, value));
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  // function computeNodeBreadths() {
  //   var remainingNodes = nodes,
  //       nextNodes,
  //       x = 0;
  //
  //   while (remainingNodes.length) {
  //     nextNodes = [];
  //     remainingNodes.forEach(function(node) {
  //       node.x = x;
  //       node.dx = nodeWidth;
  //       node.sourceLinks.forEach(function(link) {
  //         if (nextNodes.indexOf(link.target) < 0) {
  //           nextNodes.push(link.target);
  //         }
  //       });
  //     });
  //     remainingNodes = nextNodes;
  //     ++x;
  //   }
  //
  //   //
  //   moveSinksRight(x);
  //   scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
  // }                                          // Código alterado
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function (node) {

        if (node.xPos) node.x = node.xPos;else node.x = x;

        node.dx = nodeWidth;
        node.sourceLinks.forEach(function (link) {
          nextNodes.push(link.target);
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    // moveSinksRight(x);
    scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
  }

  function moveSourcesRight() {
    nodes.forEach(function (node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function (d) {
          return d.target.x;
        }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function (node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function (node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest().key(function (d) {
      return d.x;
    }).sortKeys(d3.ascending).entries(nodes).map(function (d) {
      return d.values;
    });

    //
    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function (nodes) {
        return (size[1] - (nodes.length - 1) * nodeSpacing) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function (nodes) {
        nodes.forEach(function (node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function (link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function (nodes, breadth) {
        nodes.forEach(function (node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function (nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodeSpacing;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodeSpacing - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodeSpacing - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function (node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function (node) {
      var sy = 0,
          ty = 0;
      node.sourceLinks.forEach(function (link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function (link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};
"use strict";

d3.biHiSankey = function () {

  var biHiSankey = {},
      nodeWidth = 24,
      nodeSpacing = 8,
      linkSpacing = 5,
      arrowheadScaleFactor = 0,
      // Specifies the proportion of a link's stroke width to be allowed for the marker at the end of the link.
  size = [1, 1],
      // default to one pixel by one pixel
  nodes = [],
      nodeMap = {},
      parentNodes = [],
      leafNodes = [],
      links = [],
      xScaleFactor = 1,
      yScaleFactor = 1,
      defaultLinkCurvature = 0.5;

  function center(node) {
    return node.y + node.height / 2;
  }

  function value(link) {
    return link.value;
  }

  function initializeNodeArrayProperties(node) {
    node.sourceLinks = [];
    node.rightLinks = [];
    node.targetLinks = [];
    node.leftLinks = [];
    node.connectedNodes = [];
    node.children = [];
    node.ancestors = [];
  }
  // generates the nodeMap {"1": <node1>, "2": <node2>}
  // and initializes the array properties of each node
  function initializeNodeMap() {
    nodes.forEach(function (node) {
      nodeMap[node.id] = node;
      initializeNodeArrayProperties(node);
    });
  }

  function computeLeafNodes() {
    leafNodes = nodes.filter(function (node) {
      return !node.children.length;
    });
  }

  function computeParentNodes() {
    parentNodes = nodes.filter(function (node) {
      return node.children.length;
    });
  }

  function addAncestorsToChildren(node) {
    node.children.forEach(function (child) {
      child.ancestors = child.ancestors.concat(this.ancestors.concat([this]));
      addAncestorsToChildren(child);
    }, node);
  }

  // generate hierarchical connections between parent and child nodes
  function computeNodeHierarchy() {
    var parent,
        rootNodes = [];

    nodes.forEach(function (node) {
      parent = nodeMap[node.parent];
      if (parent) {
        node.parent = parent;
        parent.children.push(node);
      } else {
        node.parent = null;
        rootNodes.push(node);
      }
    });

    computeLeafNodes();
    computeParentNodes();

    rootNodes.forEach(function (rNode) {
      addAncestorsToChildren(rNode);
    });
  }

  // Populate the sourceLinks and targetLinks for each node.
  function computeNodeLinks() {
    var sourceNode, targetNode;
    links.forEach(function (link) {
      sourceNode = nodeMap[link.source] || link.source;
      targetNode = nodeMap[link.target] || link.target;
      link.id = link.source + '-' + link.target;
      link.source = sourceNode;
      link.target = targetNode;
      sourceNode.sourceLinks.push(link);
      targetNode.targetLinks.push(link);
    });
  }

  function visible(linkCollection) {
    return linkCollection.filter(function (link) {
      return link.source.state === "collapsed" && link.target.state === "collapsed";
    });
  }

  // When child nodes are collapsed into their parents (or higher ancestors)
  // the links between the child nodes should be represented by links
  // between the containing ancestors. This function adds those extra links.
  function computeAncestorLinks() {
    // Leaf nodes are never parents of other nodes
    // Duplicate source and target links between a leaf node and another leaf node
    // and add to the leaf nodes' parents
    leafNodes.forEach(function (leafNode) {
      leafNode.sourceLinks.forEach(function (sourceLink) {
        var ancestorTargets,
            target = sourceLink.target;
        if (leafNodes.indexOf(target) >= 0) {
          ancestorTargets = target.ancestors.filter(function (tAncestor) {
            return leafNode.ancestors.indexOf(tAncestor) < 0;
          });
          ancestorTargets.forEach(function (ancestorTarget) {
            var ancestorLink = { source: leafNode,
              target: ancestorTarget,
              value: sourceLink.value,
              id: leafNode.id + "-" + ancestorTarget.id };

            leafNode.sourceLinks.push(ancestorLink);
            ancestorTarget.targetLinks.push(ancestorLink);
            links.push(ancestorLink);
          });
        }
      });

      leafNode.targetLinks.forEach(function (targetLink) {
        var ancestorSources,
            source = targetLink.source;
        if (leafNodes.indexOf(source) >= 0) {
          ancestorSources = source.ancestors.filter(function (sAncestor) {
            return leafNode.ancestors.indexOf(sAncestor) < 0;
          });
          ancestorSources.forEach(function (ancestorSource) {
            var ancestorLink = { source: ancestorSource,
              target: leafNode,
              value: targetLink.value,
              id: ancestorSource.id + "-" + leafNode.id };
            ancestorSource.sourceLinks.push(ancestorLink);
            leafNode.targetLinks.push(ancestorLink);
            links.push(ancestorLink);
          });
        }
      });
    });

    // Add links between parents (for when both parents are in collapsed state)
    parentNodes.forEach(function (parentNode) {
      parentNode.sourceLinks.forEach(function (sourceLink) {
        var ancestorTargets,
            target = sourceLink.target;
        if (leafNodes.indexOf(target) >= 0) {
          ancestorTargets = target.ancestors.filter(function (tAncestor) {
            return parentNode.ancestors.indexOf(tAncestor) < 0;
          });
          ancestorTargets.forEach(function (ancestorTarget) {
            var ancestorLink = { source: parentNode,
              target: ancestorTarget,
              value: sourceLink.value,
              id: parentNode.id + "-" + ancestorTarget.id };

            parentNode.sourceLinks.push(ancestorLink);
            ancestorTarget.targetLinks.push(ancestorLink);
            links.push(ancestorLink);
          });
        }
      });
    });
  }

  // To reduce clutter in the diagram merge links that are from the
  // same source to the same target by creating a new link
  // with a value equal to the sum of the values of the merged links
  function mergeLinks() {
    var linkGroups = d3.nest().key(function (link) {
      return link.source.id + "->" + link.target.id;
    }).entries(links).map(function (object) {
      return object.values;
    });

    links = linkGroups.map(function (linkGroup) {
      return linkGroup.reduce(function (previousLink, currentLink) {
        return {
          "source": previousLink.source,
          "target": previousLink.target,
          "id": d3.min([previousLink.id, currentLink.id]),
          "value": previousLink.value + currentLink.value
        };
      });
    });
  }

  function nodeHeight(sideLinks) {
    var spacing = Math.max(sideLinks.length - 1, 0) * linkSpacing,
        scaledValueSum = d3.sum(sideLinks, value) * yScaleFactor;
    return scaledValueSum + spacing;
  }

  // Compute the value of each node by summing the associated links.
  // Compute the number of spaces between the links
  // Compute the number of source links for later decrementing
  function computeNodeValues() {
    nodes.forEach(function (node) {
      node.value = Math.max(d3.sum(node.leftLinks, value), d3.sum(node.rightLinks, value));
      node.netFlow = d3.sum(visible(node.targetLinks), value) - d3.sum(visible(node.sourceLinks), value);
      node.height = Math.max(nodeHeight(visible(node.leftLinks)), nodeHeight(visible(node.rightLinks)));
      node.linkSpaceCount = Math.max(Math.max(node.leftLinks.length, node.rightLinks.length) - 1, 0);
    });
  }

  function computeConnectedNodes() {
    var sourceNode, targetNode;
    links.forEach(function (link) {
      sourceNode = link.source;
      targetNode = link.target;
      if (sourceNode.connectedNodes.indexOf(targetNode) < 0) {
        sourceNode.connectedNodes.push(targetNode);
      }
      if (targetNode.connectedNodes.indexOf(sourceNode) < 0) {
        targetNode.connectedNodes.push(sourceNode);
      }
    });
  }

  function sourceAndTargetNodesWithSameX() {
    var nodeArray = [];
    links.filter(function (link) {
      return link.target.x === link.source.x;
    }).forEach(function (link) {
      if (nodeArray.indexOf(link.target) < 0) {
        nodeArray.push(link.target);
      }
    });
    return nodeArray;
  }

  function compressInXDirection() {
    var connectedNodesXPositions,
        nodesByXPosition = d3.nest().key(function (node) {
      return node.x;
    }).sortKeys(d3.ascending).entries(nodes).map(function (object) {
      return object.values;
    });

    nodesByXPosition.forEach(function (xnodes) {
      xnodes.forEach(function (node) {
        connectedNodesXPositions = node.connectedNodes.map(function (connectedNode) {
          return connectedNode.x;
        });
        // keep decrementing the x value of the node
        // unless it would have the same x value as one of its source or target nodes
        // or node.x is already 0
        while (node.x > 0 && connectedNodesXPositions.indexOf(node.x - 1) < 0) {
          node.x -= 1;
        }
      });
    });
  }

  function scaleNodeXPositions() {
    var minX = d3.min(nodes, function (node) {
      return node.x;
    }),
        maxX = d3.max(nodes, function (node) {
      return node.x;
    }) - minX;
    xScaleFactor = (size[0] - nodeWidth) / maxX;

    nodes.forEach(function (node) {
      node.x *= xScaleFactor;
    });
  }

  function computeNodeXPositions() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0,
        addToNextNodes = function addToNextNodes(link) {
      if (nextNodes.indexOf(link.target) < 0 && link.target.x === this.x) {
        nextNodes.push(link.target);
      }
    },
        setValues = function setValues(node) {
      node.x = x;
      node.width = nodeWidth;
      node.sourceLinks.forEach(addToNextNodes, node);
    };

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(setValues);
      if (nextNodes.length) {
        remainingNodes = nextNodes;
      } else {
        remainingNodes = sourceAndTargetNodesWithSameX();
      }
      x += 1;
    }

    compressInXDirection();
    scaleNodeXPositions();
  }

  function computeLeftAndRightLinks() {
    var source, target;
    nodes.forEach(function (node) {
      node.rightLinks = [];
      node.leftLinks = [];
    });
    links.forEach(function (link) {
      source = link.source;
      target = link.target;
      if (source.x < target.x) {
        source.rightLinks.push(link);
        target.leftLinks.push(link);
        link.direction = 1;
      } else {
        source.leftLinks.push(link);
        target.rightLinks.push(link);
        link.direction = -1;
      }
    });
  }

  function adjustTop(adjustment) {
    nodes.forEach(function (node) {
      node.y -= adjustment;
    });
  }

  function computeNodeYPositions(iterations) {
    var minY,
        alpha,
        nodesByXPosition = d3.nest().key(function (node) {
      return node.x;
    }).sortKeys(d3.ascending).entries(nodes).map(function (object) {
      return object.values;
    });

    function calculateYScaleFactor() {
      var linkSpacesCount, nodeValueSum, discretionaryY;
      yScaleFactor = d3.min(nodesByXPosition, function (nodes) {
        linkSpacesCount = d3.sum(nodes, function (node) {
          return node.linkSpaceCount;
        });
        nodeValueSum = d3.sum(nodes, function (node) {
          return node.value;
        });
        discretionaryY = size[1] - (nodes.length - 1) * nodeSpacing - linkSpacesCount * linkSpacing;

        return discretionaryY / nodeValueSum;
      });

      // Fat links are those with lengths less than about 4 times their heights
      // Fat links don't bend well
      // Test that yScaleFactor is not so big that it causes "fat" links; adjust yScaleFactor accordingly
      links.forEach(function (link) {
        var linkLength = Math.abs(link.source.x - link.target.x),
            linkHeight = link.value * yScaleFactor;
        if (linkLength / linkHeight < 4) {
          yScaleFactor = 0.25 * linkLength / link.value;
        }
      });
    }

    function initializeNodeYPosition() {
      nodesByXPosition.forEach(function (nodes) {
        nodes.forEach(function (node, i) {
          node.y = i;
          node.heightAllowance = node.value * yScaleFactor + linkSpacing * node.linkSpaceCount;
        });
      });
    }

    function calculateLinkThickness() {
      links.forEach(function (link) {
        link.thickness = link.value * yScaleFactor;
      });
    }

    function relaxLeftToRight(alpha) {
      function weightedSource(link) {
        return center(link.source) * link.value;
      }

      nodesByXPosition.forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.rightLinks.length) {
            var y = d3.sum(node.rightLinks, weightedSource) / d3.sum(node.rightLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });
    }

    function relaxRightToLeft(alpha) {
      function weightedTarget(link) {
        return center(link.target) * link.value;
      }

      nodesByXPosition.slice().reverse().forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.leftLinks.length) {
            var y = d3.sum(node.leftLinks, weightedTarget) / d3.sum(node.leftLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });
    }

    function resolveCollisions() {
      function ascendingYPosition(a, b) {
        return a.y - b.y;
      }

      nodesByXPosition.forEach(function (nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        nodes.sort(ascendingYPosition);

        // Push any overlapping nodes down.
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) {
            node.y += dy;
          }
          y0 = node.y + node.heightAllowance + nodeSpacing;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodeSpacing - size[1];
        if (dy > 0) {
          node.y -= dy;
          y0 = node.y;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.heightAllowance + nodeSpacing - y0;
            if (dy > 0) {
              node.y -= dy;
            }
            y0 = node.y;
          }
        }
      });
    }

    calculateYScaleFactor();
    initializeNodeYPosition();
    calculateLinkThickness();
    resolveCollisions();

    for (alpha = 1; iterations > 0; --iterations) {
      alpha *= 0.99;
      relaxRightToLeft(alpha);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    minY = d3.min(nodes, function (node) {
      return node.y;
    });
    adjustTop(minY);
  }

  function computeLinkYPositions() {

    function ascendingLeftNodeYPosition(a, b) {
      var aLeftNode = a.direction > 0 ? a.source : a.target,
          bLeftNode = b.direction > 0 ? b.source : b.target;
      return aLeftNode.y - bLeftNode.y;
    }

    function ascendingRightNodeYPosition(a, b) {
      var aRightNode = a.direction > 0 ? a.target : a.source,
          bRightNode = b.direction > 0 ? b.target : b.source;
      return aRightNode.y - bRightNode.y;
    }

    nodes.forEach(function (node) {
      node.rightLinks.sort(ascendingRightNodeYPosition);
      node.leftLinks.sort(ascendingLeftNodeYPosition);
    });

    nodes.forEach(function (node) {
      var rightY = 0,
          leftY = 0;

      node.rightLinks.forEach(function (link) {
        if (link.direction > 0) {
          link.sourceY = rightY;
          if (link.target.state === "collapsed") {
            rightY += link.thickness + linkSpacing;
          }
        } else {
          link.targetY = rightY;
          if (link.source.state === "collapsed") {
            rightY += link.thickness + linkSpacing;
          }
        }
      });

      node.leftLinks.forEach(function (link) {
        if (link.direction < 0) {
          link.sourceY = leftY;
          if (link.target.state === "collapsed") {
            leftY += link.thickness + linkSpacing;
          }
        } else {
          link.targetY = leftY;
          if (link.source.state === "collapsed") {
            leftY += link.thickness + linkSpacing;
          }
        }
      });
    });
  }

  biHiSankey.arrowheadScaleFactor = function (_) {
    if (!arguments.length) {
      return arrowheadScaleFactor;
    }
    arrowheadScaleFactor = +_;
    return biHiSankey;
  };

  biHiSankey.collapsedNodes = function () {
    return nodes.filter(function (node) {
      return node.state === "collapsed";
    });
  };

  biHiSankey.connected = function (nodeA, nodeB) {
    return nodeA.connectedNodes.indexOf(nodeB) >= 0;
  };

  biHiSankey.expandedNodes = function () {
    return nodes.filter(function (node) {
      return node.state === "expanded";
    });
  };

  biHiSankey.layout = function (iterations) {
    computeNodeXPositions();
    computeLeftAndRightLinks();
    computeNodeValues();
    computeNodeYPositions(iterations);
    computeNodeValues();
    computeLinkYPositions();
    return biHiSankey;
  };

  biHiSankey.link = function () {
    var curvature = defaultLinkCurvature;

    function leftToRightLink(link) {
      var arrowHeadLength = link.thickness * arrowheadScaleFactor,
          straightSectionLength = 3 * link.thickness / 4 - arrowHeadLength,
          x0 = link.source.x + link.source.width,
          x1 = x0 + arrowHeadLength / 2,
          x4 = link.target.x - straightSectionLength - arrowHeadLength,
          xi = d3.interpolateNumber(x0, x4),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = link.source.y + link.sourceY + link.thickness / 2,
          y1 = link.target.y + link.targetY + link.thickness / 2;
      return "M" + x0 + "," + y0 + "L" + x1 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x4 + "," + y1 + "L" + (x4 + straightSectionLength) + "," + y1;
    }

    function rightToLeftLink(link) {
      var arrowHeadLength = link.thickness * arrowheadScaleFactor,
          straightSectionLength = link.thickness / 4,
          x0 = link.source.x,
          x1 = x0 - arrowHeadLength / 2,
          x4 = link.target.x + link.target.width + straightSectionLength + arrowHeadLength,
          xi = d3.interpolateNumber(x0, x4),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = link.source.y + link.sourceY + link.thickness / 2,
          y1 = link.target.y + link.targetY + link.thickness / 2;
      return "M" + x0 + "," + y0 + "L" + x1 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x4 + "," + y1 + "L" + (x4 - straightSectionLength) + "," + y1;
    }

    function link(d) {
      if (d.source.x < d.target.x) {
        return leftToRightLink(d);
      }
      return rightToLeftLink(d);
    }

    link.curvature = function (_) {
      if (!arguments.length) {
        return curvature;
      }
      curvature = +_;
      return link;
    };

    return link;
  };

  biHiSankey.links = function (_) {
    if (!arguments.length) {
      return links;
    }
    links = _.filter(function (link) {
      return link.source !== link.target; // filter out links that go nowhere
    });
    return biHiSankey;
  };

  biHiSankey.linkSpacing = function (_) {
    if (!arguments.length) {
      return linkSpacing;
    }
    linkSpacing = +_;
    return biHiSankey;
  };

  biHiSankey.nodes = function (_) {
    if (!arguments.length) {
      return nodes;
    }
    nodes = _;
    return biHiSankey;
  };

  biHiSankey.nodeWidth = function (_) {
    if (!arguments.length) {
      return nodeWidth;
    }
    nodeWidth = +_;
    return biHiSankey;
  };

  biHiSankey.nodeSpacing = function (_) {
    if (!arguments.length) {
      return nodeSpacing;
    }
    nodeSpacing = +_;
    return biHiSankey;
  };

  biHiSankey.relayout = function () {
    computeLeftAndRightLinks();
    computeNodeValues();
    computeLinkYPositions();
    return biHiSankey;
  };

  biHiSankey.size = function (_) {
    if (!arguments.length) {
      return size;
    }
    size = _;
    return biHiSankey;
  };

  biHiSankey.visibleLinks = function () {
    return visible(links);
  };

  biHiSankey.initializeNodes = function (callback) {
    initializeNodeMap();
    computeNodeHierarchy();
    computeNodeLinks();
    computeAncestorLinks();
    mergeLinks();
    computeConnectedNodes();
    nodes.forEach(callback);
    return biHiSankey;
  };

  return biHiSankey;
};
"use strict";

d3.sankey = function () {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 30,
      size = [1, 1],
      nodes = [],
      links = [],
      sinksRight = true;

  sankey.nodeWidth = function (_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function (_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function (_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function (_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function (_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.sinksRight = function (_) {
    if (!arguments.length) return sinksRight;
    sinksRight = _;
    return sankey;
  };

  sankey.layout = function (iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    return sankey;
  };

  sankey.relayout = function () {
    computeLinkDepths();
    return sankey;
  };

  // SVG path data generator, to be used as "d" attribute on "path" element selection.
  sankey.link = function () {
    var curvature = .5;

    function link(d) {
      var xs = d.source.x + d.source.dx,
          xt = d.target.x,
          xi = d3.interpolateNumber(xs, xt),
          xsc = xi(curvature),
          xtc = xi(1 - curvature),
          ys = d.source.y + d.sy + d.dy / 2,
          yt = d.target.y + d.ty + d.dy / 2;

      if (!d.cycleBreaker) {
        return "M" + xs + "," + ys + "C" + xsc + "," + ys + " " + xtc + "," + yt + " " + xt + "," + yt;
      } else {
        var xdelta = 1.5 * d.dy + 0.05 * Math.abs(xs - xt);
        xsc = xs + xdelta;
        xtc = xt - xdelta;
        var xm = xi(0.5);
        var ym = d3.interpolateNumber(ys, yt)(0.5);
        var ydelta = (2 * d.dy + 0.1 * Math.abs(xs - xt) + 0.1 * Math.abs(ys - yt)) * (ym < size[1] / 2 ? -1 : 1);
        return "M" + xs + "," + ys + "C" + xsc + "," + ys + " " + xsc + "," + (ys + ydelta) + " " + xm + "," + (ym + ydelta) + "S" + xtc + "," + yt + " " + xt + "," + yt;
      }
    }

    link.curvature = function (_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function (node) {
      // Links that have this node as source.
      node.sourceLinks = [];
      // Links that have this node as target.
      node.targetLinks = [];
    });
    links.forEach(function (link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function (node) {
      node.value = Math.max(d3.sum(node.sourceLinks, value), d3.sum(node.targetLinks, value));
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0,
        cantidadCol = 4;

    // Work from left to right.
    // Keep updating the breath (x-position) of nodes that are target of recently updated nodes.

    while (remainingNodes.length && x < nodes.length) {
      nextNodes = [];

      remainingNodes.forEach(function (node) {
        node.x = node.pos - 1;
        node.dx = nodeWidth;

        node.sourceLinks.forEach(function (link) {
          if (nextNodes.indexOf(link.target) < 0 && !link.cycleBreaker) {
            nextNodes.push(link.target);
          }
        });
      });

      if (nextNodes.length == remainingNodes.length) {
        // There must be a cycle here. Let's search for a link that breaks it.
        findAndMarkCycleBreaker(nextNodes);
        // Start over.
        // TODO: make this optional?
        return computeNodeBreadths();
      } else {
        remainingNodes = nextNodes;
        ++x;
      }
    }
    // Optionally move pure sinks always to the right.
    // if (sinksRight) {
    //   moveSinksRight(cantidadCol);
    // }
    // scaleNodeBreadths((size[0] - nodeWidth) / (x - 5));
    scaleNodeBreadths((size[0] - nodeWidth) / (cantidadCol - 1));
  }

  // Find a link that breaks a cycle in the graph (if any).
  function findAndMarkCycleBreaker(nodes) {
    // Go through all nodes from the given subset and traverse links searching for cycles.
    var link;
    for (var n = nodes.length - 1; n >= 0; n--) {
      link = depthFirstCycleSearch(nodes[n], []);
      if (link) {
        return link;
      }
    }

    // Depth-first search to find a link that is part of a cycle.
    function depthFirstCycleSearch(cursorNode, path) {
      var target, link;
      for (var n = cursorNode.sourceLinks.length - 1; n >= 0; n--) {
        link = cursorNode.sourceLinks[n];
        if (link.cycleBreaker) {
          // Skip already known cycle breakers.
          continue;
        }

        // Check if target of link makes a cycle in current path.
        target = link.target;
        for (var l = 0; l < path.length; l++) {
          if (path[l].source == target) {
            // We found a cycle. Search for weakest link in cycle
            var weakest = link;
            for (; l < path.length; l++) {
              if (path[l].value < weakest.value) {
                weakest = path[l];
              }
            }
            // Mark weakest link as (known) cycle breaker and abort search.
            weakest.cycleBreaker = true;
            return weakest;
          }
        }

        // Recurse deeper.
        path.push(link);
        link = depthFirstCycleSearch(target, path);
        path.pop();
        // Stop further search if we found a cycle breaker.
        if (link) {
          return link;
        }
      }
    }
  }

  function moveSourcesRight() {
    nodes.forEach(function (node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function (d) {
          return d.target.x;
        }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function (node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function (node) {
      node.x *= kx;
    });
  }

  // Compute the depth (y-position) for each node.
  function computeNodeDepths(iterations) {
    // Group nodes by breath.
    var nodesByBreadth = d3.nest().key(function (d) {
      return d.x;
    }).sortKeys(d3.ascending).entries(nodes).map(function (d) {
      return d.values;
    });

    //
    initializeNodeDepth();
    resolveCollisions();
    computeLinkDepths();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      computeLinkDepths();
      relaxLeftToRight(alpha);
      resolveCollisions();
      computeLinkDepths();
    }

    function initializeNodeDepth() {
      // Calculate vertical scaling factor.
      var ky = d3.min(nodesByBreadth, function (nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function (nodes) {
        nodes.forEach(function (node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function (link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function (nodes, breadth) {
        nodes.forEach(function (node) {
          if (node.targetLinks.length) {
            // Value-weighted average of the y-position of source node centers linked to this node.
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return (link.source.y + link.sy + link.dy / 2) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.sourceLinks.length) {
            // Value-weighted average of the y-positions of target nodes linked to this node.
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return (link.target.y + link.ty + link.dy / 2) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function (nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(byValue);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  // Compute y-offset of the source endpoint (sy) and target endpoints (ty) of links,
  // relative to the source/target node's y-position.
  function computeLinkDepths() {
    nodes.forEach(function (node) {
      node.sourceLinks.sort(byValue);
      node.targetLinks.sort(byValue);
    });
    nodes.forEach(function (node) {
      var sy = 0,
          ty = 0;
      node.sourceLinks.forEach(function (link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function (link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  // Y-position of the middle of a node.
  function center(node) {
    return node.y + node.dy / 2;
  }

  // Value property accessor.
  function value(x) {
    return x.value;
  }

  // Alteración del código
  // Ordena los nodos de mayor a menor en función de su valor
  function byValue(first, second) {
    var firstValue = first.value,
        secondValue = second.value;

    if (firstValue < secondValue) {
      return 1;
    } else if (firstValue > secondValue) {
      return -1;
    }

    return 0;
  }

  return sankey;
};
"use strict";

d3.sankey = function () {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 30,
      size = [1, 1],
      nodes = [],
      links = [],
      components = [];

  sankey.nodeWidth = function (_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function (_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function (_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function (_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function (_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function (iterations) {
    computeNodeLinks();
    computeNodeValues();

    computeNodeStructure();
    computeNodeBreadths();

    computeNodeDepths(iterations);
    computeLinkDepths();

    return sankey;
  };

  sankey.relayout = function () {
    computeLinkDepths();
    return sankey;
  };

  // A more involved path generator that requires 3 elements to render --
  // It draws a starting element, intermediate and end element that are useful
  // while drawing reverse links to get an appropriate fill.
  //
  // Each link is now an area and not a basic spline and no longer guarantees
  // fixed width throughout.
  //
  // Sample usage:
  //
  //  linkNodes = this._svg.append("g").selectAll(".link")
  //      .data(this.links)
  //    .enter().append("g")
  //      .attr("fill", "none")
  //      .attr("class", ".link")
  //      .sort(function(a, b) { return b.dy - a.dy; });
  //
  //  linkNodePieces = [];
  //  for (var i = 0; i < 3; i++) {
  //    linkNodePieces[i] = linkNodes.append("path")
  //      .attr("class", ".linkPiece")
  //      .attr("d", path(i))
  //      .attr("fill", ...)
  //  }
  sankey.reversibleLink = function () {
    var curvature = 0.5;

    // Used when source is behind target, the first and last paths are simple
    // lines at the start and end node while the second path is the spline
    function forwardLink(part, d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy,
          y1 = d.target.y + d.ty,
          y2 = d.source.y + d.sy + d.dy,
          y3 = d.target.y + d.ty + d.dy;

      switch (part) {
        case 0:
          return "M" + x0 + "," + y0 + "L" + x0 + "," + (y0 + d.dy);

        case 1:
          return "M" + x0 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x1 + "," + y1 + "L" + x1 + "," + y3 + "C" + x3 + "," + y3 + " " + x2 + "," + y2 + " " + x0 + "," + y2 + "Z";

        case 2:
          return "M" + x1 + "," + y1 + "L" + x1 + "," + (y1 + d.dy);
      }
    }

    // Used for self loops and when the source is actually in front of the
    // target; the first element is a turning path from the source to the
    // destination, the second element connects the two twists and the last
    // twists into the target element.
    //
    //
    //  /--Target
    //  \----------------------\
    //                 Source--/
    //
    function backwardLink(part, d) {
      var curveExtension = 30;
      var curveDepth = 15;

      function getDir(d) {
        return d.source.y + d.sy > d.target.y + d.ty ? -1 : 1;
      }

      function p(x, y) {
        return x + "," + y + " ";
      }

      var dt = getDir(d) * curveDepth,
          x0 = d.source.x + d.source.dx,
          y0 = d.source.y + d.sy,
          x1 = d.target.x,
          y1 = d.target.y + d.ty;

      switch (part) {
        case 0:
          return "M" + p(x0, y0) + "C" + p(x0, y0) + p(x0 + curveExtension, y0) + p(x0 + curveExtension, y0 + dt) + "L" + p(x0 + curveExtension, y0 + dt + d.dy) + "C" + p(x0 + curveExtension, y0 + d.dy) + p(x0, y0 + d.dy) + p(x0, y0 + d.dy) + "Z";
        case 1:
          return "M" + p(x0 + curveExtension, y0 + dt) + "C" + p(x0 + curveExtension, y0 + 3 * dt) + p(x1 - curveExtension, y1 - 3 * dt) + p(x1 - curveExtension, y1 - dt) + "L" + p(x1 - curveExtension, y1 - dt + d.dy) + "C" + p(x1 - curveExtension, y1 - 3 * dt + d.dy) + p(x0 + curveExtension, y0 + 3 * dt + d.dy) + p(x0 + curveExtension, y0 + dt + d.dy) + "Z";

        case 2:
          return "M" + p(x1 - curveExtension, y1 - dt) + "C" + p(x1 - curveExtension, y1) + p(x1, y1) + p(x1, y1) + "L" + p(x1, y1 + d.dy) + "C" + p(x1, y1 + d.dy) + p(x1 - curveExtension, y1 + d.dy) + p(x1 - curveExtension, y1 + d.dy - dt) + "Z";
      }
    }

    return function (part) {
      return function (d) {
        if (d.source.x < d.target.x) {
          return forwardLink(part, d);
        } else {
          return backwardLink(part, d);
        }
      };
    };
  };

  // The standard link path using a constant width spline that needs a
  // single path element.
  sankey.link = function () {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0 + "C" + x2 + "," + y0 + " " + x3 + "," + y1 + " " + x1 + "," + y1;
    }

    link.curvature = function (_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  var computeNodeLinks = function computeNodeLinks() {
    var source = void 0,
        target = void 0;

    nodes.forEach(function (node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function (link) {
      source = link.source = nodes[parseInt(link.source)];
      target = link.target = nodes[parseInt(link.target)];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  };

  // Compute the value (size) of each node by summing the associated links.
  var computeNodeValues = function computeNodeValues() {
    var fluid = void 0;

    nodes.forEach(function (node) {
      if (!node.value) {
        fluid = Math.max(d3.sum(node.sourceLinks, value), d3.sum(node.targetLinks, value));

        node.value = fluid;
      }
    });
  };

  // Take the list of nodes and create a DAG of supervertices, each consisting
  // of a strongly connected component of the graph
  //
  // Based off:
  // http://en.wikipedia.org/wiki/Tarjan's_strongly_connected_components_algorithm
  var computeNodeStructure = function computeNodeStructure() {
    var nodeStack = [],
        index = 0;

    var connect = function connect(node) {

      node.lowIndex = node.index = index++;
      node.onStack = true;
      nodeStack.push(node);

      var target = void 0;

      if (node.sourceLinks) {
        node.sourceLinks.forEach(function (sourceLink) {
          target = sourceLink.target;

          if (!target.hasOwnProperty('index')) {
            connect(target);
            node.lowIndex = Math.min(node.lowIndex, target.lowIndex);
          } else if (target.onStack) {
            node.lowIndex = Math.min(node.lowIndex, target.index);
          }
        });

        // console.log('connect');
        // console.log(components.length);
        // console.log(node);

        if (node.lowIndex === node.index) {
          var component = [],
              currentNode;

          do {
            currentNode = nodeStack.pop();
            currentNode.onStack = false;
            component.push(currentNode);
          } while (currentNode != node);

          components.push({
            root: node,
            scc: component
          });
        } else {}
      }
    };

    nodes.forEach(function (node) {
      if (!node.index) {
        connect(node);
      }
    });

    components.forEach(function (component, i) {
      component.index = i;
      component.scc.forEach(function (node) {
        node.component = i;
      });
    });
  };

  // Assign the breadth (x-position) for each strongly connected component,
  // followed by assigning breadth within the component.
  function computeNodeBreadths() {
    layerComponents();
    // console.log(sankey.nodes().length);
    // console.log(components.length);
    components.forEach(function (component, i) {
      bfs(component.root, function (node) {
        var result = node.sourceLinks.filter(function (sourceLink) {
          return sourceLink.target.component == i;
        }).map(function (sourceLink) {
          return sourceLink.target;
        });
        return result;
      });
    });

    var max = 0;

    var componentsByBreadth = d3.nest().key(function (d) {
      // console.log('aca');
      // return d.scc[0].pos;
      return d.root.pos;
      // return d.x;
    }).sortKeys(d3.ascending).entries(components).map(function (d) {
      return d.values;
    });

    var max = -1,
        nextMax = -1;
    componentsByBreadth.forEach(function (c) {
      c.forEach(function (component) {
        component.x = max + 1;
        component.scc.forEach(function (node) {
          if (node.layer) node.x = node.layer;else node.x = component.x + node.x;
          nextMax = Math.max(nextMax, node.x);
        });
      });
      max = nextMax;
    });

    nodes.filter(function (node) {
      var outLinks = node.sourceLinks.filter(function (link) {
        return link.source.name != link.target.name;
      });
      return outLinks.length == 0;
    }).forEach(function (node) {
      node.x = max;
    });

    scaleNodeBreadths((size[0] - nodeWidth) / Math.max(max, 1));

    function flatten(a) {
      return [].concat.apply([], a);
    }

    function layerComponents() {
      var remainingComponents = components,
          nextComponents,
          visitedIndex,
          x = 0;

      while (remainingComponents.length) {
        nextComponents = [];
        visitedIndex = {};

        remainingComponents.forEach(function (component) {
          component.x = x;

          component.scc.forEach(function (n) {
            n.sourceLinks.forEach(function (l) {
              if (!visitedIndex.hasOwnProperty(l.target.component) && l.target.component != component.index) {
                nextComponents.push(components[l.target.component]);
                visitedIndex[l.target.component] = true;
              }
            });
          });
        });

        remainingComponents = nextComponents;
        ++x;
      }
    }

    function bfs(node, extractTargets) {
      var queue = [node],
          currentCount = 1,
          nextCount = 0;
      var x = 0;

      while (currentCount > 0) {
        var currentNode = queue.shift();
        currentCount--;

        if (!currentNode.hasOwnProperty('x')) {
          currentNode.x = x;
          currentNode.dx = nodeWidth;

          var targets = extractTargets(currentNode);

          queue = queue.concat(targets);
          nextCount += targets.length;
        }

        if (currentCount == 0) {
          // level change
          x++;
          currentCount = nextCount;
          nextCount = 0;
        }
      }
    }
  }

  function moveSourcesRight() {
    nodes.forEach(function (node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function (d) {
          return d.target.x;
        }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function (node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function (node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    var nodesByBreadth = d3.nest().key(function (d) {
      return d.x;
    }).sortKeys(d3.ascending).entries(nodes).map(function (d) {
      return d.values;
    });

    initializeNodeDepth();
    resolveCollisions();

    for (var alpha = 1; iterations > 0; --iterations) {
      relaxLeftToRight(alpha);
      resolveCollisions();
      relaxRightToLeft(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function (nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function (nodes) {
        nodes.forEach(function (node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function (link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {

      nodesByBreadth.forEach(function (nodes, breadth) {
        nodes.forEach(function (node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function (nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        // Alteracion del codigo
        nodes.sort(byValue);
        // nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }
    function ascendingDepth(a, b) {
      return b.y - a.y;
      // return a.y - b.y;
    }
  }

  // Alteración del código
  // Ordena los nodos de mayor a menor en función de su valor
  function byValue(first, second) {
    var firstValue = first.value,
        secondValue = second.value;

    if (firstValue < secondValue) {
      return 1;
    } else if (firstValue > secondValue) {
      return -1;
    }

    return 0;
  }

  function computeLinkDepths() {
    nodes.forEach(function (node) {
      // Alteracion del codigo
      node.sourceLinks.sort(byValue);
      // node.sourceLinks.sort(ascendingTargetDepth);
      // Alteracion del codigo
      node.targetLinks.sort(byValue);
      // node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function (node) {
      var sy = 0,
          ty = 0;
      node.sourceLinks.forEach(function (link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function (link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return b.source.y - a.source.y;
      // return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return b.target.y - a.target.y;
      // return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};
"use strict";

d3.sankey = function () {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      // was 8, needs to be much bigger. these numbers are actually overwritten in the html when we instantiate the viz!
  size = [1, 1],
      nodes = [],
      links = [];
  sankey.nodeWidth = function (_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };
  sankey.nodePadding = function (_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };
  sankey.nodes = function (_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };
  sankey.links = function (_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };
  sankey.size = function (_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };
  sankey.layout = function (iterations) {
    computeNodeLinks();
    computeNodeValues();

    // big changes here
    // change the order and depths (y pos) won't need iterations
    computeNodeDepths();
    computeNodeBreadths(iterations);

    computeLinkDepths();
    return sankey;
  };
  sankey.relayout = function () {
    computeLinkDepths();
    return sankey;
  };
  sankey.link = function () {
    var curvature = .5;

    // x0 = line start X
    // y0 = line start Y

    // x1 = line end X
    // y1 = line end Y

    // y2 = control point 1 (Y pos)
    // y3 = control point 2 (Y pos)

    function link(d) {

      // big changes here obviously, more comments to follow
      var x0 = d.source.x + d.sy + d.dy / 2,
          x1 = d.target.x + d.ty + d.dy / 2,
          y0 = d.source.y + nodeWidth,
          y1 = d.target.y,
          yi = d3.interpolateNumber(y0, y1),
          y2 = yi(curvature),
          y3 = yi(1 - curvature);

      // ToDo - nice to have - allow flow up or down! Plenty of use cases for starting at the bottom,
      // but main one is trickle down (economics, budgets etc), not up

      return "M" + x0 + "," + y0 // start (of SVG path)
      + "C" + x0 + "," + y2 // CP1 (curve control point)
      + " " + x1 + "," + y3 // CP2
      + " " + x1 + "," + y1; // end
    }

    link.curvature = function (_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function (node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function (link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function (node) {
      node.value = Math.max(d3.sum(node.sourceLinks, value), d3.sum(node.targetLinks, value));
    });
  }

  // take a grouping of the nodes - the vertical columns
  // there shouldnt be 8 - there will be more, the total number of 1st level sources
  // then iterate over them and give them an incrementing x
  // because the data structure is ALL nodes, just flattened, don't just apply at the top level
  // then everything should have an X
  // THEN, for the Y
  // do the same thing, this time on the grouping of 8! i.e. 8 different Y values, not loads of different ones!
  function computeNodeBreadths(iterations) {
    var nodesByBreadth = d3.nest().key(function (d) {
      return d.y;
    }).sortKeys(d3.ascending).entries(nodes).map(function (d) {
      return d.values;
    }); // values! we are using the values also as a way to seperate nodes (not just stroke width)?

    // this bit is actually the node sizes (widths)
    //var ky = (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value)
    // this should be only source nodes surely (level 1)
    var ky = (size[0] - (nodesByBreadth[0].length - 1) * nodePadding) / d3.sum(nodesByBreadth[0], value);
    // I'd like them to be much bigger, this calc doesn't seem to fill the space!?

    nodesByBreadth.forEach(function (nodes) {
      nodes.forEach(function (node, i) {
        node.x = i;
        node.dy = node.value * ky;
      });
    });

    links.forEach(function (link) {
      link.dy = link.value * ky;
    });

    resolveCollisions();

    for (var alpha = 1; iterations > 0; --iterations) {
      relaxLeftToRight(alpha);
      resolveCollisions();

      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
    }

    // these relax methods should probably be operating on one level of the nodes, not all!?

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function (nodes, breadth) {
        nodes.forEach(function (node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.x += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function (nodes) {
        nodes.forEach(function (node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.x += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function (nodes) {
        var node,
            dy,
            x0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes right.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = x0 - node.x;
          if (dy > 0) node.x += dy;
          x0 = node.x + node.dy + nodePadding;
        }

        // If the rightmost node goes outside the bounds, push it left.
        dy = x0 - nodePadding - size[0]; // was size[1]
        if (dy > 0) {
          x0 = node.x -= dy;

          // Push any overlapping nodes left.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.x + node.dy + nodePadding - x0; // was y0
            if (dy > 0) node.x -= dy;
            x0 = node.x;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.x - b.x; // left sort
      // return b.x - a.x; // right sort
    }
  }

  // this moves all end points (sinks!) to the most extreme bottom
  function moveSinksDown(y) {
    nodes.forEach(function (node) {
      if (!node.sourceLinks.length) {
        node.y = y - 1;
      }
    });
  }

  // shift their locations out to occupy the screen
  function scaleNodeBreadths(kx) {
    nodes.forEach(function (node) {
      node.y *= kx;
    });
  }

  function computeNodeDepths() {
    var remainingNodes = nodes,
        nextNodes,
        y = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function (node) {
        node.y = y;
        //node.dx = nodeWidth;
        node.sourceLinks.forEach(function (link) {
          if (nextNodes.indexOf(link.target) < 0) {
            nextNodes.push(link.target);
          }
        });
      });
      remainingNodes = nextNodes;
      ++y;
    }

    // move end points to the very bottom
    moveSinksDown(y);

    scaleNodeBreadths((size[1] - nodeWidth) / (y - 1));
  }

  // .ty is the offset in terms of node position of the link (target)
  function computeLinkDepths() {
    nodes.forEach(function (node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function (node) {
      var sy = 0,
          ty = 0;
      //ty = node.dy;
      node.sourceLinks.forEach(function (link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function (link) {
        // this is simply saying, for each target, keep adding the width of the link
        // so what if it was the other way round. start with full width then subtract?
        link.ty = ty;
        ty += link.dy;
        //ty -= link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      // return a.source.y - b.source.y;
      return a.source.x - b.source.x;
    }

    function ascendingTargetDepth(a, b) {
      //return a.target.y - b.target.y;
      return a.target.x - b.target.x;
    }
  }

  function center(node) {
    return 0; // Alteración del codigo
    // return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};