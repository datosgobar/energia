let colores = ['#ffbb42','#808080', '#f1854b','#f2385a'];

//  Variables Globales
// let scaleColorLink  = d3.scaleOrdinal()
//   .range('white')
//   // .range(colores)
//   .domain('Energías Primarias', 'Centros de Transformación', 'Energías Secundarias', 'Consumo');
let fontScale       = d3.scaleLinear()
  .range([8, 16]);

//  Funciones
// const formatoNumero = (d) => {
//   let format = d3.format(',.0f');
//
//   return `${ format(d) } Twh`;
// };

/* Resta el porcentaje indicado a un color (RR, GG o BB) hexadecimal para oscurecerlo */
const subtractLight = function(color, amount){
  let cc = parseInt(color,16) - amount;
  let c = (cc < 0) ? 0 : (cc);
  c = (c.toString(16).length > 1 ) ? c.toString(16) : `0${c.toString(16)}`;

  return c;
};

/* Oscurece un color hexadecimal de 6 caracteres #RRGGBB segun el porcentaje indicado */
const darken = (color, amount) =>{
  color = (color.indexOf('#')>=0) ? color.substring(1,color.length) : color;
  amount = parseInt((255*amount)/100);
  color = `#${subtractLight(color.substring(0,2), amount)}${subtractLight(color.substring(2,4), amount)}${subtractLight(color.substring(4,6), amount)}`;

  return color;
};

$(() => {

  let height      = $('#content').height(),
      width       = $('#content').width() - $('#placa').width(),
      // clavesNodos = [],
      // dataSankey  = {},
      // moveId = 0,
      nodesOri, linksOri,
      nodesGlo, linksGlo,
      sankeyChartD3, path, svg;

  //  Funciones
      // const generarPuertas    = () => {
      //   dataSankey.nodes.filter((element) => (element.parent === false)).forEach((v, k) => {
      //     clavesNodos.push({ 'id': v.id, 'state': true });
      //   });
      // };
      const createGrafico = (data, container) => {
        // Variables
        let margin = { top: 0, right: 0, bottom: 0, left: 0 };
        let size = { width: (300 - margin.left - margin.right), height: (50 - margin.top - margin.bottom) };
        let years = ['2012', '2013', '2014', '2015', '2016', '2017'];
        let newData = [];

        data.forEach((v, k) => { newData.push({ date: new Date(years[k]), value: v }); });

        let svgGrafico = container.html('').append('svg')
          .attr('width', size.width + margin.left + margin.right)
          .attr('height', size.height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', `translate(${ margin.left }, ${ margin.top })`);

        // let parseTime = d3.timeParse('%d-%b-%y');

        let x = d3.scaleTime()
          .domain(d3.extent(newData, (d) => d.date))
          .rangeRound([0, size.width]);
        let y = d3.scaleLinear()
          .domain(d3.extent(newData, (d) => d.value))
          .rangeRound([size.height, 0]);


        let line = d3.line().x((d) => x(d.date)).y((d) => y(d.value));

        svgGrafico.append('g')
          .call(d3.axisBottom(x))
          .style('transform', `translate(0px, ${ size.height - 1 }px)`);

        svgGrafico.append('g')
          .call(d3.axisLeft(y));
        // .append('text')
        //   .attr('fill', '#000')
        //   .attr('transform', 'rotate(-90)')
        //   .attr('y', 6)
        //   .attr('dy', '0.71em')
        //   .attr('text-anchor', 'end')
        //   .text('Price ($)');

        svgGrafico.append('path')
          .datum(newData)
          .attr('fill', 'none')
          .attr('stroke', 'steelblue')
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .attr('stroke-width', 1.5)
          .attr('d', line);
      };
      const updatePlaca = (element) => {
        let contenedor = d3.select('#placa');
            contenedor.select('.placa_titulo').style('text-transform', 'uppercase').text(element.name);
            contenedor.select('.placa_prod').text(element.value);
            contenedor.select('.placa_imp').text(element.value * 0.2);
            contenedor.select('.placa_exp').text(element.value * 0.1);
            contenedor.select('.placa_lost').text(element.value * 0.05);
            contenedor.select('.placa_efi').text(((element.value -  (element.value * 0.05)) * 100) / element.value);
            contenedor.select('.placa_more').text(element.value  * 0.01);

        createGrafico(element.prod, contenedor.select('.placa_grafico.grafico_prod'));
        createGrafico(element.imp, contenedor.select('.placa_grafico.grafico_imp'));
        createGrafico(element.exp, contenedor.select('.placa_grafico.grafico_exp'));
      };

      const fadeIn = (opacity) => (g, i) => {
        updatePlaca(g);

        let id_nodes = [],
            links,
            linksFilter,
            nodes,
            nodesFilter;

        // add event node
        id_nodes.push(g.id);
        // add sourceLinks
        g.sourceLinks.forEach((link) => { id_nodes.push(link.target.id); });
        // add targetLinks
        g.targetLinks.forEach((link) => { id_nodes.push(link.source.id); });

        // select links
        links = d3.selectAll('#sankey .link');
        //  links focusIn
        // d3.selectAll('#sankey .link')
        //   .filter((d) => (d.source.id === g.id || d.target.id === g.id))
        //   .transition().style('stroke-opacity', .75);
        // links focusOut
        linksFilter = links.filter((d) => (d.source.id !== g.id && d.target.id !== g.id));
        linksFilter.transition().style('stroke-opacity', opacity);

        //  select nodes
        nodes = d3.selectAll('#sankey .node');
        // nodes focusIn
        nodesFilter = nodes.filter((d) => {
          let statusNode = false;

          id_nodes.forEach((element) => { if (element === d.id) { statusNode = true; } });

          return statusNode;
        });
        nodesFilter.select('rect').transition().style('fill', (d) => darken('white', 20));
        // nodesFilter.select('rect').transition().style('fill', (d) => darken(colores[d.pos - 1], 20));
        nodesFilter.select('text')
          .transition()
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          // .text((d) => (d.name))
          .attr('x', (d) => (d.dx / 2));
        // nodes focusOut
        nodesFilter = nodes.filter((d) => {
          let statusNode = true;

          id_nodes.forEach((element) => { if (element === d.id) { statusNode = false; } });

          return statusNode;
        });
        nodesFilter.transition().style('opacity', opacity);
        };
      const fadeOut = (opacity) => (g, i) => {

        let id_nodes = [],
            links,
            linksFilter,
            nodes,
            nodesFilter;

        // add event node
        id_nodes.push(g.id);
        // add sourceLinks
        g.sourceLinks.forEach((link) => { id_nodes.push(link.target.id); });
        // add targetLinks
        g.targetLinks.forEach((link) => { id_nodes.push(link.source.id); });

        // select links
        links = d3.selectAll('#sankey .link');
        //  links focusIn
        // d3.selectAll('#sankey .link')
        //   .filter((d) => (d.source.id === g.id || d.target.id === g.id))
        //   .transition().style('stroke-opacity', .75);
        // links focusOut
        linksFilter = links.filter((d) => (d.source.id !== g.id && d.target.id !== g.id));
        linksFilter.transition().style('stroke-opacity', 0.75);

        //  select nodes
        nodes = d3.selectAll('#sankey .node');
        // nodes focusIn
        nodesFilter = nodes.filter((d) => {
          let statusNode = false;

          id_nodes.forEach((element) => { if (element === d.id) { statusNode = true; } });

          return statusNode;
        });
        nodesFilter.select('rect')
          .transition()
          .style('fill', (d) => 'white');
          // .style('fill', (d) => colores[d.pos - 1]);
        nodesFilter.select('text')
          .transition()
          .attr('text-anchor', 'end')
          .attr('y', (d) => (d.dy / 2)).attr('x', -10)
          // .text((d) => (d.name.length > 8) ? (d.name.substring(0, 5) + '...') : (d.name))
          .filter((d) => (d.x < width / 2))
            .attr('x', 10 + sankeyChartD3.nodeWidth())
            .attr('text-anchor', 'start');
        // nodes focusOut
        nodesFilter = nodes.filter((d) => {
          let statusNode = true;

          id_nodes.forEach((element) => { if (element === d.id) { statusNode = false; } });

          return statusNode;
        });
        nodesFilter.transition().style('opacity', 1);
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
      const createBackButton = (node) => {
        console.log(node);
        let button = d3.select('#placa .agrup')
          .append('div')
            .attr('id', () => (`node_${ node.id }`))
            .attr('class', 'backButton')
            .on('click', (event) => {
              if (nodesOri[node.id].group) {
                nodesOri[node.id].group = false;
              } else {
                nodesOri[node.id].group = true;
              }

              $(`#node_${ node.id }`).remove();

              preSankey();
            });

        button.append('span').attr('class', 'backButton_text').text(node.name);
        button.append('span')
          .append('i')
          .attr('class', 'fa fa-times')
          .attr('aria-hidden', 'true')
          .style('margin-left', '10px');
      };
      const dibujarSankey = (width, heigth, data) => {

        // Variables
        let margin = { top: 50, right: 50, bottom: 50, left: 50 };
        let size = { width: (width - margin.left - margin.right), height: (heigth - margin.top - margin.bottom) };
        let anchoNodo = 20;

        $('#sankey').empty();

        // Creación SVG
        svg = d3.select('#sankey')
          .append('svg')
            .attr('width', size.width + margin.left + margin.right)
            .attr('height', size.height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', `translate(${ margin.left }, ${ margin.top })`);

        // Creación Sankey
        sankeyChartD3 = d3.sankey()
          .nodeWidth(anchoNodo) // Ancho nodo
          .size([size.width, size.height])
          .nodes(data.nodes)
          .links(data.links)
          .layout();

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

        fontScale.domain(d3.extent(data.nodes, (d) => d.value));

        //  Se crean links
        let link = svg.append('g')
          .attr('id', 'links')
          .selectAll('.link')
          .data(data.links)
          .enter()
          .append('path')
            .attr('class', 'link')
            .attr('d', path)
            .style('stroke-width', (d) => Math.max(1, d.dy))
            // .style('stroke', 'silver')
            // trabajando
            .style('stroke', (d) => 'silver')
            // .style('stroke', (d) => {
            //   let key = [d.source.pos, d.target.pos];
            //
            //   return `url(#key_${ key[0] }${ key[1] })`;
            // })
            .style('stroke-opacity', 0.75)
            .on('mouseover', (d) => { d3.select(d3.event.target).style('stroke-opacity', 1); })
            .on('mouseout', (d) => { d3.select(d3.event.target).style('stroke-opacity', 0.75); })
            .sort((a, b) => (b.dy - a.dy));

        link.filter((element) => (element.target.name === 'EXPORTACIONES' || element.target.name === 'CONSUMO PROPIO' || element.target.name === 'TRANSPORTE' || element.target.name === 'PERDIDA'))
          .style('stroke', '#BA3F1D');
        link.filter((element) => (element.source.name === 'IMPORTACIONES'))
          .style('stroke', 'green');

        // Se crean nodos
        let node = svg.append('g')
          .attr('id', 'nodes')
          .selectAll('.node')
          .data(data.nodes.filter((element) => (element.sourceLinks.length !== 0 || element.targetLinks.length !== 0)))
          .enter()
          .append('g')
            .attr('id', (d) => d.id)
            .attr('class', 'node')
            .attr('transform', (d) => `translate(${ d.x }, ${ d.y })`)
            .call(d3.drag().on('drag', dragmove));
        // Se crean rectangulos nodos
        node.append('rect')
            .attr('width', sankeyChartD3.nodeWidth())
            .attr('height', (d) => Math.max(10, d.dy))
            .style('stroke', (d) => 'silver')
            .style('fill', (d) => 'white')
            // .style('fill', (d) => colores[d.pos - 1])
            .on('mouseover', fadeIn(0.025))
            .on('mouseout', fadeOut())
            .on('dblclick', (e) => {

              if (nodesOri[e.id].group) {
                nodesOri[e.id].group = false;
              } else {
                nodesOri[e.id].group = true;
              }
              createBackButton(e);
              preSankey();
            });

        // Se crean textos nodos
        node.append('text')
            .attr('x', -10)
            .attr('text-anchor', 'end')
            .attr('y', (d) => (d.dy / 2))
            .attr('dy', '.35em')
            .style('fill', 'black')
            // .style('fill', (d) => colores[d.pos - 1])
            .style('font-size', '14px')
            .style('font-weight', 'normal')
            // .style('font-size', (d) => `${ Math.floor(fontScale(d.value)) }px`)
            .text((d) => (d.name))
            // .text((d) => (d.name.length > 8) ? (d.name.substring(0, 5) + '...') : (d.name))
            .filter((d) => (d.x < width / 2))
              .attr('x', 10 + sankeyChartD3.nodeWidth())
              .attr('text-anchor', 'start');
        // Se agrega texto referencia hover link
        link.append('title').text((d) => `${ d.source.name } (${ d.source.id }) → ${ d.target.name } (${ d.target.id }) → ${ d.value }`);
        // Se agrega texto referencia hover node
        // node.append('title').text((d) => `${ d.name } (${ d.id })`);

        // the function for moving the nodes
        function dragmove(d) {
          d3.select(this).attr('transform', `translate(${ d.x = Math.max(0, Math.min(size.width - d.dx, d3.event.x)) }, ${ d.y = Math.max(0, Math.min(size.height - d.dy, d3.event.y)) })`);
          sankeyChartD3.relayout();
          link.attr('d', path);
        }
      };

      const actualizarSankey = (width, heigth, data, oldLinks) => {
        const linksDiff = (links_old, links_new) => {
          console.log(links_old);
          console.log(links_new);
          let links = [],
              source,
              target;

          links_new.forEach((v, k) => {
            source  = v.source;
            target  = v.target;

            links_old.forEach((v, k) => { if ((source !== v.source.id) || (target !== v.target.id)) { links.push(v); } });
          });

          return links;
        };

        // let newNodes = nodesDiff(data, sankeyData);
        // let newLinks = linksDiff(oldLinks, data.links);

        // Parametros
        let margin = {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        };
        let size = {
          width: width - margin.left - margin.right,
          height: heigth - margin.top - margin.bottom
        };

        // Creación Sankey
        sankeyChartD3 = d3.sankey()
          .nodeWidth(20) // Ancho nodo
          .size([size.width, size.height])
          .nodes(data.nodes)
          .links(data.links)
          .layout(32);

        sankeyChartD3.relayout();

        // Creación de Links
        path = sankeyChartD3.link();
        $('#links').empty();

        let links = d3.select('#links')
          .selectAll('.link')
          .data(data.links)
          .enter();

        links.append('path')
            .attr('class', 'link')
            .attr('d', (d) => path(d))
            .style('stroke-width', (d) => {
              return d.dy;
            })
            .style('stroke', 'gray')
            .on('mouseover', (d) => {
              // console.log(d3.event);
              d3.select(d3.event.target).style('stroke', 'red');
            })
            .on('mouseout', (d) => {
              d3.select(d3.event.target).style('stroke', 'gray');
            });

        // d3.selectAll('.link')
        //   .data(data.links)
        //   .attr('d', (d) => path(d));
        d3.selectAll('.node')
          .data(data.nodes)
          // .transition()
          .attr('transform', (d) => `translate(${ d.x }, ${ d.y })`);
        d3.selectAll('rect')
          .data(data.nodes)
          .style('opacity', 0)
          .attr('width', sankeyChartD3.nodeWidth())
          .attr('height', (d) => d.dy)
          .transition()
          .style('opacity', 1);

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
      const maxParent = (nodo) => {
        // console.log(nodo);
        let parentNode = nodesGlo.filter((element) => (element.id === nodo.parent))[0];

        if (nodo.parent !== false) {
          if (typeof(parentNode) !== 'undefined' && parentNode.group === true) {
            return maxParent(nodesGlo.filter((element) => (element.id === nodo.parent))[0]);
          } else {
            return nodo;
          }
        } else {
          return nodo;
        }
      };
      const deleteEmptyNodes = () => {
        let del = 0,
            nodesDelete = [],
            status;

        // moveId = 0;

        nodesGlo.forEach((node, nodeI) => {
          // console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')');
          status = false;

          // Consulto si el nodo se utiliza en algun link
          linksGlo.forEach((link, linkI) => {
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

        nodesDelete.reverse().forEach((node) => { nodesGlo.splice(node, 1); });

        // moveId = del;
        // nodes.forEach((node, nodeI) => {
        //   console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')');
        // });

        // console.log(links);
        return nodesGlo;
      };

      const declareGroupLinks = (desarrollo = false) => {
        let links = [],
            source, parentSource, stateSource,
            target, parentTarget, stateTarget,
            nodoExistente,
            addSource,
            addTarget,
            addValue;

        linksGlo.forEach((v, k) => {
          //Se obtiene source y target del elemento
          source = nodesGlo.filter((element) => (element.id === parseInt(v.source)))[0];
          target = nodesGlo.filter((element) => (element.id === parseInt(v.target)))[0];
          //Se guarda source-padre y target-padre
          parentSource = maxParent(source);
          parentTarget = maxParent(target);
          //Se guarda source-state y target-state
          stateSource = parentSource.group;
          stateTarget = parentTarget.group;
          //Se guarda source y link a crear
          addSource = (stateSource) ? (parentSource) : (source);
          addTarget = (stateTarget) ? (parentTarget) : (target);
          addValue  = parseInt(v.value);
          //Se consulta si el nodo existe
          nodoExistente = links.filter((element) => (element.source === addSource.id && element.target === addTarget.id));

          if  (nodoExistente.length !== 0) {
            //Se suma valor a duplicado
            nodoExistente[0].value += addValue;
          } else {
            //Se creo nuevo link
            links.push({
              'source': addSource.id,
              'target': addTarget.id,
              'value':  addValue
            });
          }
        });
        return links;
      };

      const preSankey = () => {
        linksGlo = $.extend(true, [], linksOri);
        nodesGlo = $.extend(true, [], nodesOri);
        linksGlo = declareGroupLinks();
        nodesGlo = deleteEmptyNodes();

        dibujarSankey(width, height, { 'nodes': nodesGlo, 'links': linksGlo });
      };

      const init = () => {

        const downloadFile = () => {
          console.log('Se solicitan archivos'); // Borrar

          const formatoSankey     = (elemento, data) => {
            let processData = [];

            switch (elemento) {
              case 'nodos':
                data.forEach((v, k) => {
                  processData.push({
                    'id'      : parseInt(v.id),
                    'name'    : v.name,
                    'parent'  : (v.parent === 'null')?(false):(parseInt(v.parent)),
                    'category': v.category,
                    'pos'     : parseInt(v.position),
                    'group'   : (v.group === 'true')?(true):(false),
                    'imp'     : v.importation.split(';').map((element) => (parseInt(element))),
                    'exp'     : v.exportation.split(';').map((element) => (parseInt(element))),
                    'prod'    : v.production.split(';').map((element) => (parseInt(element)))
                  });
                });
                break;
              case 'links':
                data.forEach((v, k) => {
                  processData.push({
                    'source': parseInt(v.source),
                    'target': parseInt(v.target),
                    'value' : parseInt(v.value),
                  });
                });
                break;
            }

            return processData;
          };

          let promise = new Promise((success) => {
            d3.csv('public/src/nodes.csv',
              (nodos) => {
                nodesOri = formatoSankey('nodos', nodos);

                d3.csv('public/src/links.csv',
                  (links) => {
                    linksOri = formatoSankey('links', links);

                    success();
                  }
                );
              }
            );
          });

          return promise;
        };

        downloadFile().then(() => {
          preSankey();
        });
      };

  init();
});
