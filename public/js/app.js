'use strict';

//  Variables Globales
var scaleColorLink = d3.scaleOrdinal().range(['#80A1C1', '#BA3F1D', '#333333', '#643173', '#BA3F1D']);
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
  return color = '#' + subtractLight(color.substring(0, 2), amount) + subtractLight(color.substring(2, 4), amount) + subtractLight(color.substring(4, 6), amount);
};

$(document).ready(function () {

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
        return darken(scaleColorLink(d.category), 20);
      });
      nodesFilter.select('text').transition().attr('text-anchor', 'middle').attr('y', -10).attr('x', function (d) {
        return d.dx / 2;
      }).text(function (d) {
        return d.name;
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
        return scaleColorLink(d.category);
      });
      nodesFilter.select('text').transition().attr('text-anchor', 'end').attr('y', function (d) {
        return d.dy / 2;
      }).attr('x', -10).text(function (d) {
        return d.name.length > 8 ? d.name.substring(0, 5) + '...' : d.name;
      }).filter(function (d) {
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
  //   //   dataSankey.links = buscarLinks(dataSankey.links, true);
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
  //   //   // dataSankey = buscarNodes(nodosOriginales, dataSankey.links = buscarLinks(linksOriginales));
  //   //   //
  //   //   // $('#sankey').empty();
  //   //   // dibujarSankey(width, height, dataSankey);
  //   //   // actualizarSankey($('#content').width(), $('#content').height(), dataSankey, oldLinks);
  //   // }
  // };
  var dibujarSankey = function dibujarSankey(width, heigth, data) {

    // Variables
    var margin = { top: 20, right: 20, bottom: 20, left: 20 };
    var size = { width: width - margin.left - margin.right, height: heigth - margin.top - margin.bottom };

    $('#sankey').empty();

    // Creación SVG
    svg = d3.select('#sankey').append('svg').attr('width', size.width + margin.left + margin.right).attr('height', size.height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // Creación Sankey
    sankeyChartD3 = d3.sankey().nodeWidth(20) // Ancho nodo
    .size([size.width, size.height]).nodes(data.nodes).links(data.links).layout();

    // Creación de Links
    path = sankeyChartD3.link();

    fontScale.domain(d3.extent(data.nodes, function (d) {
      return d.value;
    }));

    //  Se crean links
    var link = svg.append('g').attr('id', 'links').selectAll('.link').data(data.links).enter().append('path').attr('class', 'link').attr('d', path).style('stroke-width', function (d) {
      return Math.max(1, d.dy);
    }).style('stroke', 'silver').style('stroke-opacity', 0.75).on('mouseover', function (d) {
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
    }).style('fill', function (d) {
      return scaleColorLink(d.category);
    }).on('mouseover', fadeIn(0.025)).on('mouseout', fadeOut()).on('dblclick', function (e) {

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
    }).attr('dy', '.35em').style('fill', function (d) {
      return scaleColorLink(d.category);
    })
    // .style('font-size', '8px')
    .style('font-size', function (d) {
      return Math.floor(fontScale(d.value)) + 'px';
    })
    // .text((d) => (d.name))
    .text(function (d) {
      return d.name.length > 8 ? d.name.substring(0, 5) + '...' : d.name;
    }).filter(function (d) {
      return d.x < width / 2;
    }).attr('x', 10 + sankeyChartD3.nodeWidth()).attr('text-anchor', 'start');
    // Se agrega texto referencia hover link
    link.append('title').text(function (d) {
      return d.source.name + ' (' + d.source.id + ') \u2192 ' + d.target.name + ' (' + d.target.id + ') \u2192 ' + d.value;
    });
    // Se agrega texto referencia hover node
    node.append('title').text(function (d) {
      return d.name + ' (' + d.id + ')';
    });

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr('transform', 'translate(' + (d.x = Math.max(0, Math.min(size.width - d.dx, d3.event.x))) + ', ' + (d.y = Math.max(0, Math.min(size.height - d.dy, d3.event.y))) + ')');
      sankeyChartD3.relayout();
      link.attr('d', path);
    }
  };
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
  var buscarNodos = function buscarNodos() {
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
  var buscarLinks = function buscarLinks() {
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

    //Se eliminan links que no se utilizan
    linksGlo = buscarLinks();
    //Se eliminan nodos que no se utilizan
    nodesGlo = buscarNodos();

    dibujarSankey(width, height, { 'nodes': nodesGlo, 'links': linksGlo });
  };

  var start = function start() {
    var solicitarArchivos = function solicitarArchivos() {
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
                'xPos': parseInt(v.position),
                'group': true,
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

    solicitarArchivos().then(function () {
      preSankey();
    });
  };

  start();
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6WyJzY2FsZUNvbG9yTGluayIsImQzIiwic2NhbGVPcmRpbmFsIiwicmFuZ2UiLCJmb250U2NhbGUiLCJzY2FsZUxpbmVhciIsInN1YnRyYWN0TGlnaHQiLCJjb2xvciIsImFtb3VudCIsImNjIiwicGFyc2VJbnQiLCJjIiwidG9TdHJpbmciLCJsZW5ndGgiLCJkYXJrZW4iLCJpbmRleE9mIiwic3Vic3RyaW5nIiwiJCIsImRvY3VtZW50IiwicmVhZHkiLCJoZWlnaHQiLCJ3aWR0aCIsIm5vZGVzT3JpIiwibGlua3NPcmkiLCJub2Rlc0dsbyIsImxpbmtzR2xvIiwic2Fua2V5Q2hhcnREMyIsInBhdGgiLCJzdmciLCJ1cGRhdGVQbGFjYSIsImVsZW1lbnQiLCJjb250ZW5lZG9yIiwic2VsZWN0Iiwic3R5bGUiLCJ0ZXh0IiwibmFtZSIsInZhbHVlIiwiY3JlYXRlR3JhZmljbyIsInByb2QiLCJpbXAiLCJleHAiLCJkYXRhIiwiY29udGFpbmVyIiwibWFyZ2luIiwidG9wIiwicmlnaHQiLCJib3R0b20iLCJsZWZ0Iiwic2l6ZSIsInllYXJzIiwibmV3RGF0YSIsImZvckVhY2giLCJ2IiwiayIsInB1c2giLCJkYXRlIiwiRGF0ZSIsInN2Z0dyYWZpY28iLCJodG1sIiwiYXBwZW5kIiwiYXR0ciIsIngiLCJzY2FsZVRpbWUiLCJkb21haW4iLCJleHRlbnQiLCJkIiwicmFuZ2VSb3VuZCIsInkiLCJsaW5lIiwiY2FsbCIsImF4aXNCb3R0b20iLCJheGlzTGVmdCIsImRhdHVtIiwiZmFkZUluIiwib3BhY2l0eSIsImciLCJpIiwiaWRfbm9kZXMiLCJsaW5rcyIsImxpbmtzRmlsdGVyIiwibm9kZXMiLCJub2Rlc0ZpbHRlciIsImlkIiwic291cmNlTGlua3MiLCJsaW5rIiwidGFyZ2V0IiwidGFyZ2V0TGlua3MiLCJzb3VyY2UiLCJzZWxlY3RBbGwiLCJmaWx0ZXIiLCJ0cmFuc2l0aW9uIiwic3RhdHVzTm9kZSIsImNhdGVnb3J5IiwiZHgiLCJmYWRlT3V0IiwiZHkiLCJub2RlV2lkdGgiLCJkaWJ1amFyU2Fua2V5IiwiaGVpZ3RoIiwiZW1wdHkiLCJzYW5rZXkiLCJsYXlvdXQiLCJlbnRlciIsIk1hdGgiLCJtYXgiLCJvbiIsImV2ZW50Iiwic29ydCIsImEiLCJiIiwibm9kZSIsImRyYWciLCJkcmFnbW92ZSIsImUiLCJncm91cCIsImNyZWF0ZUJhY2tCdXR0b24iLCJwcmVTYW5rZXkiLCJmbG9vciIsIm1pbiIsInJlbGF5b3V0IiwiY29uc29sZSIsImxvZyIsImJ1dHRvbiIsInJlbW92ZSIsImFjdHVhbGl6YXJTYW5rZXkiLCJvbGRMaW5rcyIsImxpbmtzRGlmZiIsImxpbmtzX29sZCIsImxpbmtzX25ldyIsIm1heFBhcmVudCIsIm5vZG8iLCJwYXJlbnROb2RlIiwicGFyZW50IiwiYnVzY2FyTm9kb3MiLCJkZWwiLCJub2Rlc0RlbGV0ZSIsInN0YXR1cyIsIm5vZGVJIiwibGlua0kiLCJyZXZlcnNlIiwic3BsaWNlIiwiYnVzY2FyTGlua3MiLCJkZXNhcnJvbGxvIiwicGFyZW50U291cmNlIiwic3RhdGVTb3VyY2UiLCJwYXJlbnRUYXJnZXQiLCJzdGF0ZVRhcmdldCIsIm5vZG9FeGlzdGVudGUiLCJhZGRTb3VyY2UiLCJhZGRUYXJnZXQiLCJhZGRWYWx1ZSIsImV4dGVuZCIsInN0YXJ0Iiwic29saWNpdGFyQXJjaGl2b3MiLCJmb3JtYXRvU2Fua2V5IiwiZWxlbWVudG8iLCJwcm9jZXNzRGF0YSIsInBvc2l0aW9uIiwiaW1wb3J0YXRpb24iLCJzcGxpdCIsIm1hcCIsImV4cG9ydGF0aW9uIiwicHJvZHVjdGlvbiIsInByb21pc2UiLCJQcm9taXNlIiwic3VjY2VzcyIsImNzdiIsIm5vZG9zIiwidGhlbiJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNJLElBQUlBLGlCQUFrQkMsR0FBR0MsWUFBSCxHQUFrQkMsS0FBbEIsQ0FBd0IsQ0FBQyxTQUFELEVBQVcsU0FBWCxFQUFxQixTQUFyQixFQUErQixTQUEvQixFQUF5QyxTQUF6QyxD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R2YseUJBQVMzRSxTQUFTMEMsRUFBRWhCLEtBQVg7QUFITSxlQUFqQjtBQUtELGFBTkQ7QUFPQTtBQXhCSjs7QUEyQkEsZUFBT3dILFdBQVA7QUFDRCxPQS9CRDs7QUFpQ0EsVUFBSU8sVUFBVSxJQUFJQyxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFhO0FBQ3JDcEssV0FBR3FLLEdBQUgsQ0FBTyxzQkFBUCxFQUNFLFVBQUNDLEtBQUQsRUFBVztBQUNUakoscUJBQVdvSSxjQUFjLE9BQWQsRUFBdUJhLEtBQXZCLENBQVg7O0FBRUF0SyxhQUFHcUssR0FBSCxDQUFPLHNCQUFQLEVBQ0UsVUFBQ3hGLEtBQUQsRUFBVztBQUNUdkQsdUJBQVdtSSxjQUFjLE9BQWQsRUFBdUI1RSxLQUF2QixDQUFYOztBQUVBdUY7QUFDRCxXQUxIO0FBT0QsU0FYSDtBQWFELE9BZGEsQ0FBZDs7QUFnQkEsYUFBT0YsT0FBUDtBQUNELEtBcEREOztBQXNEQVYsd0JBQW9CZSxJQUFwQixDQUF5QixZQUFNO0FBQzdCcEQ7QUFDRCxLQUZEO0FBR0QsR0ExREQ7O0FBNERKb0M7QUFDRCxDQXptQkQiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gIFZhcmlhYmxlcyBHbG9iYWxlc1xuICAgIGxldCBzY2FsZUNvbG9yTGluayAgPSBkMy5zY2FsZU9yZGluYWwoKS5yYW5nZShbJyM4MEExQzEnLCcjQkEzRjFEJywnIzMzMzMzMycsJyM2NDMxNzMnLCcjQkEzRjFEJ10pO1xuICAgIGxldCBmb250U2NhbGUgICAgICAgPSBkMy5zY2FsZUxpbmVhcigpLnJhbmdlKFs4LCAxNl0pO1xuXG4vLyAgRnVuY2lvbmVzXG4gICAgLy8gY29uc3QgZm9ybWF0b051bWVybyA9IChkKSA9PiB7XG4gICAgLy8gICBsZXQgZm9ybWF0ID0gZDMuZm9ybWF0KCcsLjBmJyk7XG4gICAgLy9cbiAgICAvLyAgIHJldHVybiBgJHsgZm9ybWF0KGQpIH0gVHdoYDtcbiAgICAvLyB9O1xuXG4gICAgLyogUmVzdGEgZWwgcG9yY2VudGFqZSBpbmRpY2FkbyBhIHVuIGNvbG9yIChSUiwgR0cgbyBCQikgaGV4YWRlY2ltYWwgcGFyYSBvc2N1cmVjZXJsbyAqL1xuICAgIGNvbnN0IHN1YnRyYWN0TGlnaHQgPSBmdW5jdGlvbihjb2xvciwgYW1vdW50KXtcbiAgICAgIGxldCBjYyA9IHBhcnNlSW50KGNvbG9yLDE2KSAtIGFtb3VudDtcbiAgICAgIGxldCBjID0gKGNjIDwgMCkgPyAwIDogKGNjKTtcbiAgICAgIGMgPSAoYy50b1N0cmluZygxNikubGVuZ3RoID4gMSApID8gYy50b1N0cmluZygxNikgOiBgMCR7Yy50b1N0cmluZygxNil9YDtcbiAgICAgIHJldHVybiBjO1xuICAgIH07XG5cbiAgICAvKiBPc2N1cmVjZSB1biBjb2xvciBoZXhhZGVjaW1hbCBkZSA2IGNhcmFjdGVyZXMgI1JSR0dCQiBzZWd1biBlbCBwb3JjZW50YWplIGluZGljYWRvICovXG4gICAgY29uc3QgZGFya2VuID0gKGNvbG9yLCBhbW91bnQpID0+e1xuICAgICAgY29sb3IgPSAoY29sb3IuaW5kZXhPZignIycpPj0wKSA/IGNvbG9yLnN1YnN0cmluZygxLGNvbG9yLmxlbmd0aCkgOiBjb2xvcjtcbiAgICAgIGFtb3VudCA9IHBhcnNlSW50KCgyNTUqYW1vdW50KS8xMDApO1xuICAgICAgcmV0dXJuIGNvbG9yID0gYCMke3N1YnRyYWN0TGlnaHQoY29sb3Iuc3Vic3RyaW5nKDAsMiksIGFtb3VudCl9JHtzdWJ0cmFjdExpZ2h0KGNvbG9yLnN1YnN0cmluZygyLDQpLCBhbW91bnQpfSR7c3VidHJhY3RMaWdodChjb2xvci5zdWJzdHJpbmcoNCw2KSwgYW1vdW50KX1gO1xuICAgIH07XG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcblxuICBsZXQgaGVpZ2h0ICAgICAgPSAkKCcjY29udGVudCcpLmhlaWdodCgpLFxuICAgICAgd2lkdGggICAgICAgPSAkKCcjY29udGVudCcpLndpZHRoKCkgLSAkKCcjcGxhY2EnKS53aWR0aCgpLFxuICAgICAgLy8gY2xhdmVzTm9kb3MgPSBbXSxcbiAgICAgIC8vIGRhdGFTYW5rZXkgID0ge30sXG4gICAgICAvLyBtb3ZlSWQgPSAwLFxuICAgICAgbm9kZXNPcmksIGxpbmtzT3JpLFxuICAgICAgbm9kZXNHbG8sIGxpbmtzR2xvLFxuICAgICAgc2Fua2V5Q2hhcnREMywgcGF0aCwgc3ZnO1xuXG4gIC8vICBGdW5jaW9uZXNcbiAgICAgIC8vIGNvbnN0IGdlbmVyYXJQdWVydGFzICAgID0gKCkgPT4ge1xuICAgICAgLy8gICBkYXRhU2Fua2V5Lm5vZGVzLmZpbHRlcigoZWxlbWVudCkgPT4gKGVsZW1lbnQucGFyZW50ID09PSBmYWxzZSkpLmZvckVhY2goKHYsIGspID0+IHtcbiAgICAgIC8vICAgICBjbGF2ZXNOb2Rvcy5wdXNoKHsgJ2lkJzogdi5pZCwgJ3N0YXRlJzogdHJ1ZSB9KTtcbiAgICAgIC8vICAgfSk7XG4gICAgICAvLyB9O1xuICAgICAgY29uc3QgdXBkYXRlUGxhY2EgPSAoZWxlbWVudCkgPT4ge1xuICAgICAgICBsZXQgY29udGVuZWRvciA9IGQzLnNlbGVjdCgnI3BsYWNhJyk7XG4gICAgICAgICAgICBjb250ZW5lZG9yLnNlbGVjdCgnLnBsYWNhX3RpdHVsbycpLnN0eWxlKCd0ZXh0LXRyYW5zZm9ybScsICd1cHBlcmNhc2UnKS50ZXh0KGVsZW1lbnQubmFtZSk7XG4gICAgICAgICAgICBjb250ZW5lZG9yLnNlbGVjdCgnLnBsYWNhX3Byb2QnKS50ZXh0KGVsZW1lbnQudmFsdWUpO1xuICAgICAgICAgICAgY29udGVuZWRvci5zZWxlY3QoJy5wbGFjYV9pbXAnKS50ZXh0KGVsZW1lbnQudmFsdWUgKiAwLjIpO1xuICAgICAgICAgICAgY29udGVuZWRvci5zZWxlY3QoJy5wbGFjYV9leHAnKS50ZXh0KGVsZW1lbnQudmFsdWUgKiAwLjEpO1xuICAgICAgICAgICAgY29udGVuZWRvci5zZWxlY3QoJy5wbGFjYV9sb3N0JykudGV4dChlbGVtZW50LnZhbHVlICogMC4wNSk7XG4gICAgICAgICAgICBjb250ZW5lZG9yLnNlbGVjdCgnLnBsYWNhX2VmaScpLnRleHQoKChlbGVtZW50LnZhbHVlIC0gIChlbGVtZW50LnZhbHVlICogMC4wNSkpICogMTAwKSAvIGVsZW1lbnQudmFsdWUpO1xuICAgICAgICAgICAgY29udGVuZWRvci5zZWxlY3QoJy5wbGFjYV9tb3JlJykudGV4dChlbGVtZW50LnZhbHVlICAqIDAuMDEpO1xuXG4gICAgICAgIGNyZWF0ZUdyYWZpY28oZWxlbWVudC5wcm9kLCBjb250ZW5lZG9yLnNlbGVjdCgnLnBsYWNhX2dyYWZpY28uZ3JhZmljb19wcm9kJykpO1xuICAgICAgICBjcmVhdGVHcmFmaWNvKGVsZW1lbnQuaW1wLCBjb250ZW5lZG9yLnNlbGVjdCgnLnBsYWNhX2dyYWZpY28uZ3JhZmljb19pbXAnKSk7XG4gICAgICAgIGNyZWF0ZUdyYWZpY28oZWxlbWVudC5leHAsIGNvbnRlbmVkb3Iuc2VsZWN0KCcucGxhY2FfZ3JhZmljby5ncmFmaWNvX2V4cCcpKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBjcmVhdGVHcmFmaWNvID0gKGRhdGEsIGNvbnRhaW5lcikgPT4ge1xuICAgICAgICAvLyBWYXJpYWJsZXNcbiAgICAgICAgbGV0IG1hcmdpbiA9IHsgdG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwIH07XG4gICAgICAgIGxldCBzaXplID0geyB3aWR0aDogKDMwMCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0KSwgaGVpZ2h0OiAoNTAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSkgfTtcbiAgICAgICAgbGV0IHllYXJzID0gWycyMDEyJywgJzIwMTMnLCAnMjAxNCcsICcyMDE1JywgJzIwMTYnLCAnMjAxNyddO1xuICAgICAgICBsZXQgbmV3RGF0YSA9IFtdO1xuXG4gICAgICAgIGRhdGEuZm9yRWFjaCgodiwgaykgPT4geyBuZXdEYXRhLnB1c2goeyBkYXRlOiBuZXcgRGF0ZSh5ZWFyc1trXSksIHZhbHVlOiB2IH0pOyB9KTtcblxuICAgICAgICBsZXQgc3ZnR3JhZmljbyA9IGNvbnRhaW5lci5odG1sKCcnKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgLmF0dHIoJ3dpZHRoJywgc2l6ZS53aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBzaXplLmhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHsgbWFyZ2luLmxlZnQgfSwgJHsgbWFyZ2luLnRvcCB9KWApO1xuXG4gICAgICAgIC8vIGxldCBwYXJzZVRpbWUgPSBkMy50aW1lUGFyc2UoJyVkLSViLSV5Jyk7XG5cbiAgICAgICAgbGV0IHggPSBkMy5zY2FsZVRpbWUoKVxuICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KG5ld0RhdGEsIChkKSA9PiBkLmRhdGUpKVxuICAgICAgICAgIC5yYW5nZVJvdW5kKFswLCBzaXplLndpZHRoXSk7XG4gICAgICAgIGxldCB5ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgICAgICAgIC5kb21haW4oZDMuZXh0ZW50KG5ld0RhdGEsIChkKSA9PiBkLnZhbHVlKSlcbiAgICAgICAgICAucmFuZ2VSb3VuZChbc2l6ZS5oZWlnaHQsIDBdKTtcblxuXG4gICAgICAgIGxldCBsaW5lID0gZDMubGluZSgpLngoKGQpID0+IHgoZC5kYXRlKSkueSgoZCkgPT4geShkLnZhbHVlKSk7XG5cbiAgICAgICAgc3ZnR3JhZmljby5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5jYWxsKGQzLmF4aXNCb3R0b20oeCkpXG4gICAgICAgICAgLnN0eWxlKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKDBweCwgJHsgc2l6ZS5oZWlnaHQgLSAxIH1weClgKTtcblxuICAgICAgICBzdmdHcmFmaWNvLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmNhbGwoZDMuYXhpc0xlZnQoeSkpO1xuICAgICAgICAvLyAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgLy8gICAuYXR0cignZmlsbCcsICcjMDAwJylcbiAgICAgICAgLy8gICAuYXR0cigndHJhbnNmb3JtJywgJ3JvdGF0ZSgtOTApJylcbiAgICAgICAgLy8gICAuYXR0cigneScsIDYpXG4gICAgICAgIC8vICAgLmF0dHIoJ2R5JywgJzAuNzFlbScpXG4gICAgICAgIC8vICAgLmF0dHIoJ3RleHQtYW5jaG9yJywgJ2VuZCcpXG4gICAgICAgIC8vICAgLnRleHQoJ1ByaWNlICgkKScpO1xuXG4gICAgICAgIHN2Z0dyYWZpY28uYXBwZW5kKCdwYXRoJylcbiAgICAgICAgICAuZGF0dW0obmV3RGF0YSlcbiAgICAgICAgICAuYXR0cignZmlsbCcsICdub25lJylcbiAgICAgICAgICAuYXR0cignc3Ryb2tlJywgJ3N0ZWVsYmx1ZScpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZS1saW5lam9pbicsICdyb3VuZCcpXG4gICAgICAgICAgLmF0dHIoJ3N0cm9rZS1saW5lY2FwJywgJ3JvdW5kJylcbiAgICAgICAgICAuYXR0cignc3Ryb2tlLXdpZHRoJywgMS41KVxuICAgICAgICAgIC5hdHRyKCdkJywgbGluZSk7XG4gICAgICB9O1xuICAgICAgY29uc3QgZmFkZUluID0gKG9wYWNpdHkpID0+IChnLCBpKSA9PiB7XG4gICAgICAgIHVwZGF0ZVBsYWNhKGcpO1xuXG4gICAgICAgIGxldCBpZF9ub2RlcyA9IFtdLFxuICAgICAgICAgICAgbGlua3MsXG4gICAgICAgICAgICBsaW5rc0ZpbHRlcixcbiAgICAgICAgICAgIG5vZGVzLFxuICAgICAgICAgICAgbm9kZXNGaWx0ZXI7XG5cbiAgICAgICAgLy8gYWRkIGV2ZW50IG5vZGVcbiAgICAgICAgaWRfbm9kZXMucHVzaChnLmlkKTtcbiAgICAgICAgLy8gYWRkIHNvdXJjZUxpbmtzXG4gICAgICAgIGcuc291cmNlTGlua3MuZm9yRWFjaCgobGluaykgPT4geyBpZF9ub2Rlcy5wdXNoKGxpbmsudGFyZ2V0LmlkKTsgfSk7XG4gICAgICAgIC8vIGFkZCB0YXJnZXRMaW5rc1xuICAgICAgICBnLnRhcmdldExpbmtzLmZvckVhY2goKGxpbmspID0+IHsgaWRfbm9kZXMucHVzaChsaW5rLnNvdXJjZS5pZCk7IH0pO1xuXG4gICAgICAgIC8vIHNlbGVjdCBsaW5rc1xuICAgICAgICBsaW5rcyA9IGQzLnNlbGVjdEFsbCgnI3NhbmtleSAubGluaycpO1xuICAgICAgICAvLyAgbGlua3MgZm9jdXNJblxuICAgICAgICAvLyBkMy5zZWxlY3RBbGwoJyNzYW5rZXkgLmxpbmsnKVxuICAgICAgICAvLyAgIC5maWx0ZXIoKGQpID0+IChkLnNvdXJjZS5pZCA9PT0gZy5pZCB8fCBkLnRhcmdldC5pZCA9PT0gZy5pZCkpXG4gICAgICAgIC8vICAgLnRyYW5zaXRpb24oKS5zdHlsZSgnc3Ryb2tlLW9wYWNpdHknLCAuNzUpO1xuICAgICAgICAvLyBsaW5rcyBmb2N1c091dFxuICAgICAgICBsaW5rc0ZpbHRlciA9IGxpbmtzLmZpbHRlcigoZCkgPT4gKGQuc291cmNlLmlkICE9PSBnLmlkICYmIGQudGFyZ2V0LmlkICE9PSBnLmlkKSk7XG4gICAgICAgIGxpbmtzRmlsdGVyLnRyYW5zaXRpb24oKS5zdHlsZSgnc3Ryb2tlLW9wYWNpdHknLCBvcGFjaXR5KTtcblxuICAgICAgICAvLyAgc2VsZWN0IG5vZGVzXG4gICAgICAgIG5vZGVzID0gZDMuc2VsZWN0QWxsKCcjc2Fua2V5IC5ub2RlJyk7XG4gICAgICAgIC8vIG5vZGVzIGZvY3VzSW5cbiAgICAgICAgbm9kZXNGaWx0ZXIgPSBub2Rlcy5maWx0ZXIoKGQpID0+IHtcbiAgICAgICAgICBsZXQgc3RhdHVzTm9kZSA9IGZhbHNlO1xuXG4gICAgICAgICAgaWRfbm9kZXMuZm9yRWFjaCgoZWxlbWVudCkgPT4geyBpZiAoZWxlbWVudCA9PT0gZC5pZCkgeyBzdGF0dXNOb2RlID0gdHJ1ZTsgfSB9KTtcblxuICAgICAgICAgIHJldHVybiBzdGF0dXNOb2RlO1xuICAgICAgICB9KTtcbiAgICAgICAgbm9kZXNGaWx0ZXIuc2VsZWN0KCdyZWN0JykudHJhbnNpdGlvbigpLnN0eWxlKCdmaWxsJywgKGQpID0+IGRhcmtlbihzY2FsZUNvbG9yTGluayhkLmNhdGVnb3J5KSwgMjApKTtcbiAgICAgICAgbm9kZXNGaWx0ZXIuc2VsZWN0KCd0ZXh0JykudHJhbnNpdGlvbigpLmF0dHIoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpLmF0dHIoJ3knLCAtMTApLmF0dHIoJ3gnLCAoZCkgPT4gKGQuZHggLyAyKSkudGV4dCgoZCkgPT4gKGQubmFtZSkpO1xuICAgICAgICAvLyBub2RlcyBmb2N1c091dFxuICAgICAgICBub2Rlc0ZpbHRlciA9IG5vZGVzLmZpbHRlcigoZCkgPT4ge1xuICAgICAgICAgIGxldCBzdGF0dXNOb2RlID0gdHJ1ZTtcblxuICAgICAgICAgIGlkX25vZGVzLmZvckVhY2goKGVsZW1lbnQpID0+IHsgaWYgKGVsZW1lbnQgPT09IGQuaWQpIHsgc3RhdHVzTm9kZSA9IGZhbHNlOyB9IH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHN0YXR1c05vZGU7XG4gICAgICAgIH0pO1xuICAgICAgICBub2Rlc0ZpbHRlci50cmFuc2l0aW9uKCkuc3R5bGUoJ29wYWNpdHknLCBvcGFjaXR5KTtcbiAgICAgICAgfTtcbiAgICAgIGNvbnN0IGZhZGVPdXQgPSAob3BhY2l0eSkgPT4gKGcsIGkpID0+IHtcblxuICAgICAgICBsZXQgaWRfbm9kZXMgPSBbXSxcbiAgICAgICAgICAgIGxpbmtzLFxuICAgICAgICAgICAgbGlua3NGaWx0ZXIsXG4gICAgICAgICAgICBub2RlcyxcbiAgICAgICAgICAgIG5vZGVzRmlsdGVyO1xuXG4gICAgICAgIC8vIGFkZCBldmVudCBub2RlXG4gICAgICAgIGlkX25vZGVzLnB1c2goZy5pZCk7XG4gICAgICAgIC8vIGFkZCBzb3VyY2VMaW5rc1xuICAgICAgICBnLnNvdXJjZUxpbmtzLmZvckVhY2goKGxpbmspID0+IHsgaWRfbm9kZXMucHVzaChsaW5rLnRhcmdldC5pZCk7IH0pO1xuICAgICAgICAvLyBhZGQgdGFyZ2V0TGlua3NcbiAgICAgICAgZy50YXJnZXRMaW5rcy5mb3JFYWNoKChsaW5rKSA9PiB7IGlkX25vZGVzLnB1c2gobGluay5zb3VyY2UuaWQpOyB9KTtcblxuICAgICAgICAvLyBzZWxlY3QgbGlua3NcbiAgICAgICAgbGlua3MgPSBkMy5zZWxlY3RBbGwoJyNzYW5rZXkgLmxpbmsnKTtcbiAgICAgICAgLy8gIGxpbmtzIGZvY3VzSW5cbiAgICAgICAgLy8gZDMuc2VsZWN0QWxsKCcjc2Fua2V5IC5saW5rJylcbiAgICAgICAgLy8gICAuZmlsdGVyKChkKSA9PiAoZC5zb3VyY2UuaWQgPT09IGcuaWQgfHwgZC50YXJnZXQuaWQgPT09IGcuaWQpKVxuICAgICAgICAvLyAgIC50cmFuc2l0aW9uKCkuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgLjc1KTtcbiAgICAgICAgLy8gbGlua3MgZm9jdXNPdXRcbiAgICAgICAgbGlua3NGaWx0ZXIgPSBsaW5rcy5maWx0ZXIoKGQpID0+IChkLnNvdXJjZS5pZCAhPT0gZy5pZCAmJiBkLnRhcmdldC5pZCAhPT0gZy5pZCkpO1xuICAgICAgICBsaW5rc0ZpbHRlci50cmFuc2l0aW9uKCkuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMC43NSk7XG5cbiAgICAgICAgLy8gIHNlbGVjdCBub2Rlc1xuICAgICAgICBub2RlcyA9IGQzLnNlbGVjdEFsbCgnI3NhbmtleSAubm9kZScpO1xuICAgICAgICAvLyBub2RlcyBmb2N1c0luXG4gICAgICAgIG5vZGVzRmlsdGVyID0gbm9kZXMuZmlsdGVyKChkKSA9PiB7XG4gICAgICAgICAgbGV0IHN0YXR1c05vZGUgPSBmYWxzZTtcblxuICAgICAgICAgIGlkX25vZGVzLmZvckVhY2goKGVsZW1lbnQpID0+IHsgaWYgKGVsZW1lbnQgPT09IGQuaWQpIHsgc3RhdHVzTm9kZSA9IHRydWU7IH0gfSk7XG5cbiAgICAgICAgICByZXR1cm4gc3RhdHVzTm9kZTtcbiAgICAgICAgfSk7XG4gICAgICAgIG5vZGVzRmlsdGVyLnNlbGVjdCgncmVjdCcpXG4gICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIChkKSA9PiBzY2FsZUNvbG9yTGluayhkLmNhdGVnb3J5KSk7XG4gICAgICAgIG5vZGVzRmlsdGVyLnNlbGVjdCgndGV4dCcpXG4gICAgICAgICAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAgIC5hdHRyKCd5JywgKGQpID0+IChkLmR5IC8gMikpLmF0dHIoJ3gnLCAtMTApXG4gICAgICAgICAgLnRleHQoKGQpID0+IChkLm5hbWUubGVuZ3RoID4gOCkgPyAoZC5uYW1lLnN1YnN0cmluZygwLCA1KSArICcuLi4nKSA6IChkLm5hbWUpKVxuICAgICAgICAgIC5maWx0ZXIoKGQpID0+IChkLnggPCB3aWR0aCAvIDIpKVxuICAgICAgICAgICAgLmF0dHIoJ3gnLCAxMCArIHNhbmtleUNoYXJ0RDMubm9kZVdpZHRoKCkpXG4gICAgICAgICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnc3RhcnQnKTtcbiAgICAgICAgLy8gbm9kZXMgZm9jdXNPdXRcbiAgICAgICAgbm9kZXNGaWx0ZXIgPSBub2Rlcy5maWx0ZXIoKGQpID0+IHtcbiAgICAgICAgICBsZXQgc3RhdHVzTm9kZSA9IHRydWU7XG5cbiAgICAgICAgICBpZF9ub2Rlcy5mb3JFYWNoKChlbGVtZW50KSA9PiB7IGlmIChlbGVtZW50ID09PSBkLmlkKSB7IHN0YXR1c05vZGUgPSBmYWxzZTsgfSB9KTtcblxuICAgICAgICAgIHJldHVybiBzdGF0dXNOb2RlO1xuICAgICAgICB9KTtcbiAgICAgICAgbm9kZXNGaWx0ZXIudHJhbnNpdGlvbigpLnN0eWxlKCdvcGFjaXR5JywgMSk7XG4gICAgICB9O1xuICAgICAgLy8gY29uc3QgY29sYXBzYXJFeHBhbmRpck5vZG8gPSAobm9kbykgPT4ge1xuICAgICAgLy9cbiAgICAgIC8vICAgbm9kZXNPcmlbbm9kby5pZF0uZ3JvdXAgPSAobm9kZXNPcmlbbm9kby5pZF0uZ3JvdXApID8gKGZhbHNlKSA6ICh0cnVlKTtcbiAgICAgIC8vXG4gICAgICAvLyAgIHJldHVybiBub2Rlc09yaTtcbiAgICAgIC8vXG4gICAgICAvL1xuICAgICAgLy8gICAvLyBsZXQgb2xkTGlua3MgPSBkYXRhU2Fua2V5LmxpbmtzO1xuICAgICAgLy9cbiAgICAgIC8vICAgLy8gaWYgKG5vZG8ucGFyZW50ID09PSBmYWxzZSkge1xuICAgICAgLy8gICAvLyAgIGNvbnNvbGUubG9nKCdTZSBleHBhbmRlIG5vZG8nKTtcbiAgICAgIC8vICAgLy8gICBjbGF2ZXNOb2Rvcy5mb3JFYWNoKChlbGVtZW50KSA9PiB7IGlmIChlbGVtZW50LmlkID09PSBub2RvLmlkICsgbW92ZUlkKSB7IGVsZW1lbnQuc3RhdGUgPSBmYWxzZTsgfSB9KTtcbiAgICAgIC8vICAgLy9cbiAgICAgIC8vICAgLy8gICBkYXRhU2Fua2V5Lm5vZGVzID0gbm9kb3NPcmlnaW5hbGVzO1xuICAgICAgLy8gICAvLyAgIGRhdGFTYW5rZXkubGlua3MgPSBsaW5rc09yaWdpbmFsZXM7XG4gICAgICAvLyAgIC8vXG4gICAgICAvLyAgIC8vICAgZGF0YVNhbmtleS5saW5rcyA9IGJ1c2NhckxpbmtzKGRhdGFTYW5rZXkubGlua3MsIHRydWUpO1xuICAgICAgLy8gICAvL1xuICAgICAgLy8gICAvLyAgIGRhdGFTYW5rZXkgPSBidXNjYXJOb2RlcyhkYXRhU2Fua2V5Lm5vZGVzLCBkYXRhU2Fua2V5LmxpbmtzKTtcbiAgICAgIC8vICAgLy8gICBtb3ZlSWQgPSAwO1xuICAgICAgLy8gICAvLyAgICQoJyNzYW5rZXknKS5lbXB0eSgpO1xuICAgICAgLy8gICAvLyAgIGRpYnVqYXJTYW5rZXkod2lkdGgsIGhlaWdodCwgZGF0YVNhbmtleSk7XG4gICAgICAvLyAgIC8vICAgLy8gYWN0dWFsaXphclNhbmtleSgkKCcjY29udGVudCcpLndpZHRoKCksICQoJyNjb250ZW50JykuaGVpZ2h0KCksIGRhdGFTYW5rZXksIG9sZExpbmtzKTtcbiAgICAgIC8vICAgLy8gfSBlbHNlIHtcbiAgICAgIC8vICAgLy8gICBjb25zb2xlLmxvZygnU2UgY29sYXBzYSBub2RvJyk7XG4gICAgICAvLyAgIC8vICAgLy8gbGV0IHBhcmVudCA9IGRhdGFTYW5rZXkubm9kZXMuZmlsdGVyKChlbGVtZW50KSA9PiAoZWxlbWVudC5uYW1lID09PSBub2RvLnBhcmVudCkpWzBdO1xuICAgICAgLy8gICAvLyAgIC8vIGNsYXZlc05vZG9zLmZpbHRlcigoZWxlbWVudCkgPT4gKGVsZW1lbnQuaWQgPT09IHBhcmVudC5pZCkpWzBdLnN0YXRlID0gdHJ1ZTtcbiAgICAgIC8vICAgLy8gICAvL1xuICAgICAgLy8gICAvLyAgIC8vIGRhdGFTYW5rZXkgPSBidXNjYXJOb2Rlcyhub2Rvc09yaWdpbmFsZXMsIGRhdGFTYW5rZXkubGlua3MgPSBidXNjYXJMaW5rcyhsaW5rc09yaWdpbmFsZXMpKTtcbiAgICAgIC8vICAgLy8gICAvL1xuICAgICAgLy8gICAvLyAgIC8vICQoJyNzYW5rZXknKS5lbXB0eSgpO1xuICAgICAgLy8gICAvLyAgIC8vIGRpYnVqYXJTYW5rZXkod2lkdGgsIGhlaWdodCwgZGF0YVNhbmtleSk7XG4gICAgICAvLyAgIC8vICAgLy8gYWN0dWFsaXphclNhbmtleSgkKCcjY29udGVudCcpLndpZHRoKCksICQoJyNjb250ZW50JykuaGVpZ2h0KCksIGRhdGFTYW5rZXksIG9sZExpbmtzKTtcbiAgICAgIC8vICAgLy8gfVxuICAgICAgLy8gfTtcbiAgICAgIGNvbnN0IGRpYnVqYXJTYW5rZXkgPSAod2lkdGgsIGhlaWd0aCwgZGF0YSkgPT4ge1xuXG4gICAgICAgIC8vIFZhcmlhYmxlc1xuICAgICAgICBsZXQgbWFyZ2luID0geyB0b3A6IDIwLCByaWdodDogMjAsIGJvdHRvbTogMjAsIGxlZnQ6IDIwIH07XG4gICAgICAgIGxldCBzaXplID0geyB3aWR0aDogKHdpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQpLCBoZWlnaHQ6IChoZWlndGggLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbSkgfTtcblxuICAgICAgICAkKCcjc2Fua2V5JykuZW1wdHkoKTtcblxuICAgICAgICAvLyBDcmVhY2nDs24gU1ZHXG4gICAgICAgIHN2ZyA9IGQzLnNlbGVjdCgnI3NhbmtleScpXG4gICAgICAgICAgLmFwcGVuZCgnc3ZnJylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHNpemUud2lkdGggKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBzaXplLmhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHsgbWFyZ2luLmxlZnQgfSwgJHsgbWFyZ2luLnRvcCB9KWApO1xuXG4gICAgICAgIC8vIENyZWFjacOzbiBTYW5rZXlcbiAgICAgICAgc2Fua2V5Q2hhcnREMyA9IGQzLnNhbmtleSgpXG4gICAgICAgICAgLm5vZGVXaWR0aCgyMCkgLy8gQW5jaG8gbm9kb1xuICAgICAgICAgIC5zaXplKFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0pXG4gICAgICAgICAgLm5vZGVzKGRhdGEubm9kZXMpXG4gICAgICAgICAgLmxpbmtzKGRhdGEubGlua3MpXG4gICAgICAgICAgLmxheW91dCgpO1xuXG4gICAgICAgIC8vIENyZWFjacOzbiBkZSBMaW5rc1xuICAgICAgICBwYXRoID0gc2Fua2V5Q2hhcnREMy5saW5rKCk7XG5cbiAgICAgICAgZm9udFNjYWxlLmRvbWFpbihkMy5leHRlbnQoZGF0YS5ub2RlcywgKGQpID0+IGQudmFsdWUpKTtcblxuICAgICAgICAvLyAgU2UgY3JlYW4gbGlua3NcbiAgICAgICAgbGV0IGxpbmsgPSBzdmcuYXBwZW5kKCdnJylcbiAgICAgICAgICAuYXR0cignaWQnLCAnbGlua3MnKVxuICAgICAgICAgIC5zZWxlY3RBbGwoJy5saW5rJylcbiAgICAgICAgICAuZGF0YShkYXRhLmxpbmtzKVxuICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluaycpXG4gICAgICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsIChkKSA9PiBNYXRoLm1heCgxLCBkLmR5KSlcbiAgICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgJ3NpbHZlcicpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMC43NSlcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgKGQpID0+IHsgZDMuc2VsZWN0KGQzLmV2ZW50LnRhcmdldCkuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMSk7IH0pXG4gICAgICAgICAgICAub24oJ21vdXNlb3V0JywgKGQpID0+IHsgZDMuc2VsZWN0KGQzLmV2ZW50LnRhcmdldCkuc3R5bGUoJ3N0cm9rZS1vcGFjaXR5JywgMC43NSk7IH0pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gKGIuZHkgLSBhLmR5KSk7XG5cbiAgICAgICAgbGluay5maWx0ZXIoKGVsZW1lbnQpID0+IChlbGVtZW50LnRhcmdldC5uYW1lID09PSAnRVhQT1JUQUNJT05FUycgfHwgZWxlbWVudC50YXJnZXQubmFtZSA9PT0gJ0NPTlNVTU8gUFJPUElPJyB8fCBlbGVtZW50LnRhcmdldC5uYW1lID09PSAnVFJBTlNQT1JURScgfHwgZWxlbWVudC50YXJnZXQubmFtZSA9PT0gJ1BFUkRJREEnKSlcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICcjQkEzRjFEJyk7XG4gICAgICAgIGxpbmsuZmlsdGVyKChlbGVtZW50KSA9PiAoZWxlbWVudC5zb3VyY2UubmFtZSA9PT0gJ0lNUE9SVEFDSU9ORVMnKSlcbiAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdncmVlbicpO1xuXG4gICAgICAgIC8vIFNlIGNyZWFuIG5vZG9zXG4gICAgICAgIGxldCBub2RlID0gc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgICAgLmF0dHIoJ2lkJywgJ25vZGVzJylcbiAgICAgICAgICAuc2VsZWN0QWxsKCcubm9kZScpXG4gICAgICAgICAgLmRhdGEoZGF0YS5ub2Rlcy5maWx0ZXIoKGVsZW1lbnQpID0+IChlbGVtZW50LnNvdXJjZUxpbmtzLmxlbmd0aCAhPT0gMCB8fCBlbGVtZW50LnRhcmdldExpbmtzLmxlbmd0aCAhPT0gMCkpKVxuICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAuYXR0cignaWQnLCAoZCkgPT4gZC5pZClcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdub2RlJylcbiAgICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4gYHRyYW5zbGF0ZSgkeyBkLnggfSwgJHsgZC55IH0pYClcbiAgICAgICAgICAgIC5jYWxsKGQzLmRyYWcoKS5vbignZHJhZycsIGRyYWdtb3ZlKSk7XG4gICAgICAgIC8vIFNlIGNyZWFuIHJlY3Rhbmd1bG9zIG5vZG9zXG4gICAgICAgIG5vZGUuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHNhbmtleUNoYXJ0RDMubm9kZVdpZHRoKCkpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgKGQpID0+IE1hdGgubWF4KDEwLCBkLmR5KSlcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIChkKSA9PiBzY2FsZUNvbG9yTGluayhkLmNhdGVnb3J5KSlcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgZmFkZUluKDAuMDI1KSlcbiAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCBmYWRlT3V0KCkpXG4gICAgICAgICAgICAub24oJ2RibGNsaWNrJywgKGUpID0+IHtcblxuICAgICAgICAgICAgICBpZiAobm9kZXNPcmlbZS5pZF0uZ3JvdXApIHtcbiAgICAgICAgICAgICAgICBub2Rlc09yaVtlLmlkXS5ncm91cCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGVzT3JpW2UuaWRdLmdyb3VwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjcmVhdGVCYWNrQnV0dG9uKGUpO1xuICAgICAgICAgICAgICBwcmVTYW5rZXkoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFNlIGNyZWFuIHRleHRvcyBub2Rvc1xuICAgICAgICBub2RlLmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgICAuYXR0cigneCcsIC0xMClcbiAgICAgICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdlbmQnKVxuICAgICAgICAgICAgLmF0dHIoJ3knLCAoZCkgPT4gKGQuZHkgLyAyKSlcbiAgICAgICAgICAgIC5hdHRyKCdkeScsICcuMzVlbScpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAoZCkgPT4gc2NhbGVDb2xvckxpbmsoZC5jYXRlZ29yeSkpXG4gICAgICAgICAgICAvLyAuc3R5bGUoJ2ZvbnQtc2l6ZScsICc4cHgnKVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXNpemUnLCAoZCkgPT4gYCR7IE1hdGguZmxvb3IoZm9udFNjYWxlKGQudmFsdWUpKSB9cHhgKVxuICAgICAgICAgICAgLy8gLnRleHQoKGQpID0+IChkLm5hbWUpKVxuICAgICAgICAgICAgLnRleHQoKGQpID0+IChkLm5hbWUubGVuZ3RoID4gOCkgPyAoZC5uYW1lLnN1YnN0cmluZygwLCA1KSArICcuLi4nKSA6IChkLm5hbWUpKVxuICAgICAgICAgICAgLmZpbHRlcigoZCkgPT4gKGQueCA8IHdpZHRoIC8gMikpXG4gICAgICAgICAgICAgIC5hdHRyKCd4JywgMTAgKyBzYW5rZXlDaGFydEQzLm5vZGVXaWR0aCgpKVxuICAgICAgICAgICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnc3RhcnQnKTtcbiAgICAgICAgLy8gU2UgYWdyZWdhIHRleHRvIHJlZmVyZW5jaWEgaG92ZXIgbGlua1xuICAgICAgICBsaW5rLmFwcGVuZCgndGl0bGUnKS50ZXh0KChkKSA9PiBgJHsgZC5zb3VyY2UubmFtZSB9ICgkeyBkLnNvdXJjZS5pZCB9KSDihpIgJHsgZC50YXJnZXQubmFtZSB9ICgkeyBkLnRhcmdldC5pZCB9KSDihpIgJHsgZC52YWx1ZSB9YCk7XG4gICAgICAgIC8vIFNlIGFncmVnYSB0ZXh0byByZWZlcmVuY2lhIGhvdmVyIG5vZGVcbiAgICAgICAgbm9kZS5hcHBlbmQoJ3RpdGxlJykudGV4dCgoZCkgPT4gYCR7IGQubmFtZSB9ICgkeyBkLmlkIH0pYCk7XG5cbiAgICAgICAgLy8gdGhlIGZ1bmN0aW9uIGZvciBtb3ZpbmcgdGhlIG5vZGVzXG4gICAgICAgIGZ1bmN0aW9uIGRyYWdtb3ZlKGQpIHtcbiAgICAgICAgICBkMy5zZWxlY3QodGhpcykuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgkeyBkLnggPSBNYXRoLm1heCgwLCBNYXRoLm1pbihzaXplLndpZHRoIC0gZC5keCwgZDMuZXZlbnQueCkpIH0sICR7IGQueSA9IE1hdGgubWF4KDAsIE1hdGgubWluKHNpemUuaGVpZ2h0IC0gZC5keSwgZDMuZXZlbnQueSkpIH0pYCk7XG4gICAgICAgICAgc2Fua2V5Q2hhcnREMy5yZWxheW91dCgpO1xuICAgICAgICAgIGxpbmsuYXR0cignZCcsIHBhdGgpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29uc3QgY3JlYXRlQmFja0J1dHRvbiA9IChub2RlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKG5vZGUpO1xuICAgICAgICBsZXQgYnV0dG9uID0gZDMuc2VsZWN0KCcjcGxhY2EgLmFncnVwJylcbiAgICAgICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAgICAgLmF0dHIoJ2lkJywgKCkgPT4gKGBub2RlXyR7IG5vZGUuaWQgfWApKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhY2tCdXR0b24nKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAobm9kZXNPcmlbbm9kZS5pZF0uZ3JvdXApIHtcbiAgICAgICAgICAgICAgICBub2Rlc09yaVtub2RlLmlkXS5ncm91cCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGVzT3JpW25vZGUuaWRdLmdyb3VwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICQoYCNub2RlXyR7IG5vZGUuaWQgfWApLnJlbW92ZSgpXG5cbiAgICAgICAgICAgICAgcHJlU2Fua2V5KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBidXR0b24uYXBwZW5kKCdzcGFuJykuYXR0cignY2xhc3MnLCAnYmFja0J1dHRvbl90ZXh0JykudGV4dChub2RlLm5hbWUpO1xuICAgICAgICBidXR0b24uYXBwZW5kKCdzcGFuJylcbiAgICAgICAgICAuYXBwZW5kKCdpJylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCAnZmEgZmEtdGltZXMnKVxuICAgICAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJylcbiAgICAgICAgICAuc3R5bGUoJ21hcmdpbi1sZWZ0JywgJzEwcHgnKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGFjdHVhbGl6YXJTYW5rZXkgPSAod2lkdGgsIGhlaWd0aCwgZGF0YSwgb2xkTGlua3MpID0+IHtcbiAgICAgICAgY29uc3QgbGlua3NEaWZmID0gKGxpbmtzX29sZCwgbGlua3NfbmV3KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2cobGlua3Nfb2xkKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhsaW5rc19uZXcpO1xuICAgICAgICAgIGxldCBsaW5rcyA9IFtdLFxuICAgICAgICAgICAgICBzb3VyY2UsXG4gICAgICAgICAgICAgIHRhcmdldDtcblxuICAgICAgICAgIGxpbmtzX25ldy5mb3JFYWNoKCh2LCBrKSA9PiB7XG4gICAgICAgICAgICBzb3VyY2UgID0gdi5zb3VyY2U7XG4gICAgICAgICAgICB0YXJnZXQgID0gdi50YXJnZXQ7XG5cbiAgICAgICAgICAgIGxpbmtzX29sZC5mb3JFYWNoKCh2LCBrKSA9PiB7IGlmICgoc291cmNlICE9PSB2LnNvdXJjZS5pZCkgfHwgKHRhcmdldCAhPT0gdi50YXJnZXQuaWQpKSB7IGxpbmtzLnB1c2godik7IH0gfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gbGlua3M7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gbGV0IG5ld05vZGVzID0gbm9kZXNEaWZmKGRhdGEsIHNhbmtleURhdGEpO1xuICAgICAgICAvLyBsZXQgbmV3TGlua3MgPSBsaW5rc0RpZmYob2xkTGlua3MsIGRhdGEubGlua3MpO1xuXG4gICAgICAgIC8vIFBhcmFtZXRyb3NcbiAgICAgICAgbGV0IG1hcmdpbiA9IHtcbiAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgIGxlZnQ6IDBcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHNpemUgPSB7XG4gICAgICAgICAgd2lkdGg6IHdpZHRoIC0gbWFyZ2luLmxlZnQgLSBtYXJnaW4ucmlnaHQsXG4gICAgICAgICAgaGVpZ2h0OiBoZWlndGggLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWFjacOzbiBTYW5rZXlcbiAgICAgICAgc2Fua2V5Q2hhcnREMyA9IGQzLnNhbmtleSgpXG4gICAgICAgICAgLm5vZGVXaWR0aCgyMCkgLy8gQW5jaG8gbm9kb1xuICAgICAgICAgIC5zaXplKFtzaXplLndpZHRoLCBzaXplLmhlaWdodF0pXG4gICAgICAgICAgLm5vZGVzKGRhdGEubm9kZXMpXG4gICAgICAgICAgLmxpbmtzKGRhdGEubGlua3MpXG4gICAgICAgICAgLmxheW91dCgzMik7XG5cbiAgICAgICAgc2Fua2V5Q2hhcnREMy5yZWxheW91dCgpO1xuXG4gICAgICAgIC8vIENyZWFjacOzbiBkZSBMaW5rc1xuICAgICAgICBwYXRoID0gc2Fua2V5Q2hhcnREMy5saW5rKCk7XG4gICAgICAgICQoJyNsaW5rcycpLmVtcHR5KCk7XG5cbiAgICAgICAgbGV0IGxpbmtzID0gZDMuc2VsZWN0KCcjbGlua3MnKVxuICAgICAgICAgIC5zZWxlY3RBbGwoJy5saW5rJylcbiAgICAgICAgICAuZGF0YShkYXRhLmxpbmtzKVxuICAgICAgICAgIC5lbnRlcigpO1xuXG4gICAgICAgIGxpbmtzLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGluaycpXG4gICAgICAgICAgICAuYXR0cignZCcsIChkKSA9PiBwYXRoKGQpKVxuICAgICAgICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAoZCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gZC5keTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdncmF5JylcbiAgICAgICAgICAgIC5vbignbW91c2VvdmVyJywgKGQpID0+IHtcbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZDMuZXZlbnQpO1xuICAgICAgICAgICAgICBkMy5zZWxlY3QoZDMuZXZlbnQudGFyZ2V0KS5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignbW91c2VvdXQnLCAoZCkgPT4ge1xuICAgICAgICAgICAgICBkMy5zZWxlY3QoZDMuZXZlbnQudGFyZ2V0KS5zdHlsZSgnc3Ryb2tlJywgJ2dyYXknKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGQzLnNlbGVjdEFsbCgnLmxpbmsnKVxuICAgICAgICAvLyAgIC5kYXRhKGRhdGEubGlua3MpXG4gICAgICAgIC8vICAgLmF0dHIoJ2QnLCAoZCkgPT4gcGF0aChkKSk7XG4gICAgICAgIGQzLnNlbGVjdEFsbCgnLm5vZGUnKVxuICAgICAgICAgIC5kYXRhKGRhdGEubm9kZXMpXG4gICAgICAgICAgLy8gLnRyYW5zaXRpb24oKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4gYHRyYW5zbGF0ZSgkeyBkLnggfSwgJHsgZC55IH0pYCk7XG4gICAgICAgIGQzLnNlbGVjdEFsbCgncmVjdCcpXG4gICAgICAgICAgLmRhdGEoZGF0YS5ub2RlcylcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIHNhbmtleUNoYXJ0RDMubm9kZVdpZHRoKCkpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIChkKSA9PiBkLmR5KVxuICAgICAgICAgIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAxKTtcblxuICAgICAgICAvLyBDcmVhdGUgRGlmZXJlbmNlXG4gICAgICAgIC8vIG5ld0xpbmtzLmZvckVhY2goKHYsIGspID0+IHtcbiAgICAgICAgLy8gICBsZXQgbGluayA9IGQzLnNlbGVjdCgnI2xpbmtzJylcbiAgICAgICAgLy8gICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgICAvLyAgICAgICAuYXR0cignY2xhc3MnLCAnbGluaycpXG4gICAgICAgIC8vICAgICAgIC5hdHRyKCdkJywgKCkgPT4gcGF0aCh2KSlcbiAgICAgICAgLy8gICAgICAgLnN0eWxlKCdzdHJva2Utd2lkdGgnLCAoKSA9PiBNYXRoLm1heCgxLCB2LmR5KSlcbiAgICAgICAgLy8gICAgICAgLnN0eWxlKCdzdHJva2UnLCAoKSA9PiBzY2FsZUNvbG9yKHYuc291cmNlLm5hbWUucmVwbGFjZSgnICcsICcnKSkpXG4gICAgICAgIC8vICAgICAgIC5zb3J0KChhLCBiKSA9PiAoYi5keSAtIGEuZHkpKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gICBsaW5rLmFwcGVuZCgndGl0bGUnKS50ZXh0KCgpID0+IGAkeyB2LnNvdXJjZS5uYW1lIH0g4oaSICR7IHYudGFyZ2V0Lm5hbWUgfSBcXG4gJHsgZm9ybWF0b051bWVybyh2LnZhbHVlKSB9YCk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IG1heFBhcmVudCA9IChub2RvKSA9PiB7XG4gICAgICAgIGxldCBwYXJlbnROb2RlID0gbm9kZXNHbG8uZmlsdGVyKChlbGVtZW50KSA9PiAoZWxlbWVudC5pZCA9PT0gbm9kby5wYXJlbnQpKVswXTtcblxuICAgICAgICBpZiAobm9kby5wYXJlbnQgIT09IGZhbHNlKSB7XG4gICAgICAgICAgaWYgKHR5cGVvZihwYXJlbnROb2RlKSAhPT0gJ3VuZGVmaW5lZCcgJiYgcGFyZW50Tm9kZS5ncm91cCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG1heFBhcmVudChub2Rlc0dsby5maWx0ZXIoKGVsZW1lbnQpID0+IChlbGVtZW50LmlkID09PSBub2RvLnBhcmVudCkpWzBdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5vZG87XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBub2RvO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29uc3QgYnVzY2FyTm9kb3MgPSAoKSA9PiB7XG4gICAgICAgIGxldCBkZWwgPSAwLFxuICAgICAgICAgICAgbm9kZXNEZWxldGUgPSBbXSxcbiAgICAgICAgICAgIHN0YXR1cztcblxuICAgICAgICAvLyBtb3ZlSWQgPSAwO1xuXG4gICAgICAgIG5vZGVzR2xvLmZvckVhY2goKG5vZGUsIG5vZGVJKSA9PiB7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coJ25vZG86ICcgKyBub2RlSSArICcgKCBpZDogJyArIG5vZGUuaWQgKyAnKScpO1xuICAgICAgICAgIHN0YXR1cyA9IGZhbHNlO1xuXG4gICAgICAgICAgLy8gQ29uc3VsdG8gc2kgZWwgbm9kbyBzZSB1dGlsaXphIGVuIGFsZ3VuIGxpbmtcbiAgICAgICAgICBsaW5rc0dsby5mb3JFYWNoKChsaW5rLCBsaW5rSSkgPT4ge1xuICAgICAgICAgICAgaWYgKG5vZGUuaWQgPT09IGxpbmsuc291cmNlKSB7XG4gICAgICAgICAgICAgIHN0YXR1cyA9IHRydWU7XG4gICAgICAgICAgICAgIGxpbmsuc291cmNlID0gbGluay5zb3VyY2UgLSBkZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm9kZS5pZCA9PT0gbGluay50YXJnZXQpIHtcbiAgICAgICAgICAgICAgc3RhdHVzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgbGluay50YXJnZXQgPSBsaW5rLnRhcmdldCAtIGRlbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIC8vIE1vZGlmaWNhciBlbCBJRCByZXN0YW5kbyBsYSBjYW50aWRhZCBkZSBlbGVtZW50b3MgYm9ycmFkb3NcbiAgICAgICAgICAvLyBub2RlLmlkID0gbm9kZS5pZCAtIGRlbDtcblxuICAgICAgICAgIGlmICghc3RhdHVzKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnQm9ycmFyJyk7XG4gICAgICAgICAgICBub2Rlc0RlbGV0ZS5wdXNoKG5vZGVJKTtcbiAgICAgICAgICAgIGRlbCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBlbHNlIHtcbiAgICAgICAgICAvLyAgIC8vIGNvbnNvbGUubG9nKCdub2RvOiAnICsgbm9kZUkgKyAnICggaWQ6ICcgKyBub2RlLmlkICsgJyk8LScpO1xuICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbm9kZXNEZWxldGUucmV2ZXJzZSgpLmZvckVhY2goKG5vZGUpID0+IHsgbm9kZXNHbG8uc3BsaWNlKG5vZGUsIDEpOyB9KTtcblxuICAgICAgICAvLyBtb3ZlSWQgPSBkZWw7XG4gICAgICAgIC8vIG5vZGVzLmZvckVhY2goKG5vZGUsIG5vZGVJKSA9PiB7XG4gICAgICAgIC8vICAgY29uc29sZS5sb2coJ25vZG86ICcgKyBub2RlSSArICcgKCBpZDogJyArIG5vZGUuaWQgKyAnKScpO1xuICAgICAgICAvLyB9KTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhsaW5rcyk7XG4gICAgICAgIHJldHVybiBub2Rlc0dsbztcbiAgICAgIH07XG4gICAgICBjb25zdCBidXNjYXJMaW5rcyA9IChkZXNhcnJvbGxvID0gZmFsc2UpID0+IHtcbiAgICAgICAgbGV0IGxpbmtzID0gW10sXG4gICAgICAgICAgICBzb3VyY2UsIHBhcmVudFNvdXJjZSwgc3RhdGVTb3VyY2UsXG4gICAgICAgICAgICB0YXJnZXQsIHBhcmVudFRhcmdldCwgc3RhdGVUYXJnZXQsXG4gICAgICAgICAgICBub2RvRXhpc3RlbnRlLFxuICAgICAgICAgICAgYWRkU291cmNlLFxuICAgICAgICAgICAgYWRkVGFyZ2V0LFxuICAgICAgICAgICAgYWRkVmFsdWU7XG5cbiAgICAgICAgbGlua3NHbG8uZm9yRWFjaCgodiwgaykgPT4ge1xuICAgICAgICAgIC8vU2Ugb2J0aWVuZSBzb3VyY2UgeSB0YXJnZXQgZGVsIGVsZW1lbnRvXG4gICAgICAgICAgICBzb3VyY2UgPSBub2Rlc0dsby5maWx0ZXIoKGVsZW1lbnQpID0+IChlbGVtZW50LmlkID09PSBwYXJzZUludCh2LnNvdXJjZSkpKVswXTtcbiAgICAgICAgICAgIHRhcmdldCA9IG5vZGVzR2xvLmZpbHRlcigoZWxlbWVudCkgPT4gKGVsZW1lbnQuaWQgPT09IHBhcnNlSW50KHYudGFyZ2V0KSkpWzBdO1xuICAgICAgICAgIC8vU2UgZ3VhcmRhIHNvdXJjZS1wYWRyZSB5IHRhcmdldC1wYWRyZVxuICAgICAgICAgICAgcGFyZW50U291cmNlID0gbWF4UGFyZW50KHNvdXJjZSk7XG4gICAgICAgICAgICBwYXJlbnRUYXJnZXQgPSBtYXhQYXJlbnQodGFyZ2V0KTtcbiAgICAgICAgICAvL1NlIGd1YXJkYSBzb3VyY2Utc3RhdGUgeSB0YXJnZXQtc3RhdGVcbiAgICAgICAgICAgIHN0YXRlU291cmNlID0gcGFyZW50U291cmNlLmdyb3VwO1xuICAgICAgICAgICAgc3RhdGVUYXJnZXQgPSBwYXJlbnRUYXJnZXQuZ3JvdXA7XG4gICAgICAgICAgLy9TZSBndWFyZGEgc291cmNlIHkgbGluayBhIGNyZWFyXG4gICAgICAgICAgICBhZGRTb3VyY2UgPSAoc3RhdGVTb3VyY2UpID8gKHBhcmVudFNvdXJjZSkgOiAoc291cmNlKTtcbiAgICAgICAgICAgIGFkZFRhcmdldCA9IChzdGF0ZVRhcmdldCkgPyAocGFyZW50VGFyZ2V0KSA6ICh0YXJnZXQpO1xuICAgICAgICAgICAgYWRkVmFsdWUgID0gcGFyc2VJbnQodi52YWx1ZSk7XG4gICAgICAgICAgLy9TZSBjb25zdWx0YSBzaSBlbCBub2RvIGV4aXN0ZVxuICAgICAgICAgICAgbm9kb0V4aXN0ZW50ZSA9IGxpbmtzLmZpbHRlcigoZWxlbWVudCkgPT4gKGVsZW1lbnQuc291cmNlID09PSBhZGRTb3VyY2UuaWQgJiYgZWxlbWVudC50YXJnZXQgPT09IGFkZFRhcmdldC5pZCkpO1xuXG4gICAgICAgICAgICBpZiAgKG5vZG9FeGlzdGVudGUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgIC8vU2Ugc3VtYSB2YWxvciBhIGR1cGxpY2Fkb1xuICAgICAgICAgICAgICBub2RvRXhpc3RlbnRlWzBdLnZhbHVlICs9IGFkZFZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy9TZSBjcmVvIG51ZXZvIGxpbmtcbiAgICAgICAgICAgICAgbGlua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgJ3NvdXJjZSc6IGFkZFNvdXJjZS5pZCxcbiAgICAgICAgICAgICAgICAndGFyZ2V0JzogYWRkVGFyZ2V0LmlkLFxuICAgICAgICAgICAgICAgICd2YWx1ZSc6ICBhZGRWYWx1ZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsaW5rcztcbiAgICAgIH07XG4gICAgICBjb25zdCBwcmVTYW5rZXkgPSAoKSA9PiB7XG4gICAgICAgIGxpbmtzR2xvID0gJC5leHRlbmQodHJ1ZSwgW10sIGxpbmtzT3JpKTtcbiAgICAgICAgbm9kZXNHbG8gPSAkLmV4dGVuZCh0cnVlLCBbXSwgbm9kZXNPcmkpO1xuXG4gICAgICAgIC8vU2UgZWxpbWluYW4gbGlua3MgcXVlIG5vIHNlIHV0aWxpemFuXG4gICAgICAgIGxpbmtzR2xvID0gYnVzY2FyTGlua3MoKTtcbiAgICAgICAgLy9TZSBlbGltaW5hbiBub2RvcyBxdWUgbm8gc2UgdXRpbGl6YW5cbiAgICAgICAgbm9kZXNHbG8gPSBidXNjYXJOb2RvcygpO1xuXG4gICAgICAgIGRpYnVqYXJTYW5rZXkod2lkdGgsIGhlaWdodCwgeyAnbm9kZXMnOiBub2Rlc0dsbywgJ2xpbmtzJzogbGlua3NHbG8gfSk7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBzdGFydCA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qgc29saWNpdGFyQXJjaGl2b3MgPSAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1NlIHNvbGljaXRhbiBhcmNoaXZvcycpOyAvLyBCb3JyYXJcbiAgICAgICAgICBjb25zdCBmb3JtYXRvU2Fua2V5ICAgICA9IChlbGVtZW50bywgZGF0YSkgPT4ge1xuICAgICAgICAgICAgbGV0IHByb2Nlc3NEYXRhID0gW107XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZWxlbWVudG8pIHtcbiAgICAgICAgICAgICAgY2FzZSAnbm9kb3MnOlxuICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgodiwgaykgPT4ge1xuICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICdpZCc6IHBhcnNlSW50KHYuaWQpLFxuICAgICAgICAgICAgICAgICAgICAnbmFtZSc6IHYubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgJ3BhcmVudCc6ICh2LnBhcmVudCA9PT0gJ251bGwnKT8oZmFsc2UpOihwYXJzZUludCh2LnBhcmVudCkpLFxuICAgICAgICAgICAgICAgICAgICAnY2F0ZWdvcnknOiB2LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgICAgICAneFBvcyc6IHBhcnNlSW50KHYucG9zaXRpb24pLFxuICAgICAgICAgICAgICAgICAgICAnZ3JvdXAnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAnaW1wJzogdi5pbXBvcnRhdGlvbi5zcGxpdCgnOycpLm1hcCgoZWxlbWVudCkgPT4gKHBhcnNlSW50KGVsZW1lbnQpKSksXG4gICAgICAgICAgICAgICAgICAgICdleHAnOiB2LmV4cG9ydGF0aW9uLnNwbGl0KCc7JykubWFwKChlbGVtZW50KSA9PiAocGFyc2VJbnQoZWxlbWVudCkpKSxcbiAgICAgICAgICAgICAgICAgICAgJ3Byb2QnOiB2LnByb2R1Y3Rpb24uc3BsaXQoJzsnKS5tYXAoKGVsZW1lbnQpID0+IChwYXJzZUludChlbGVtZW50KSkpXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSAnbGlua3MnOlxuICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgodiwgaykgPT4ge1xuICAgICAgICAgICAgICAgICAgcHJvY2Vzc0RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICdzb3VyY2UnOiBwYXJzZUludCh2LnNvdXJjZSksXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQnOiBwYXJzZUludCh2LnRhcmdldCksXG4gICAgICAgICAgICAgICAgICAgICd2YWx1ZSc6IHBhcnNlSW50KHYudmFsdWUpLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzRGF0YTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgoc3VjY2VzcykgPT4ge1xuICAgICAgICAgICAgZDMuY3N2KCdwdWJsaWMvc3JjL25vZGVzLmNzdicsXG4gICAgICAgICAgICAgIChub2RvcykgPT4ge1xuICAgICAgICAgICAgICAgIG5vZGVzT3JpID0gZm9ybWF0b1NhbmtleSgnbm9kb3MnLCBub2Rvcyk7XG5cbiAgICAgICAgICAgICAgICBkMy5jc3YoJ3B1YmxpYy9zcmMvbGlua3MuY3N2JyxcbiAgICAgICAgICAgICAgICAgIChsaW5rcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsaW5rc09yaSA9IGZvcm1hdG9TYW5rZXkoJ2xpbmtzJywgbGlua3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH07XG5cbiAgICAgICAgc29saWNpdGFyQXJjaGl2b3MoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICBwcmVTYW5rZXkoKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gIHN0YXJ0KCk7XG59KTtcbiJdfQ==
