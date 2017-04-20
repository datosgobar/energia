// VARIABLES GLOBALES
const colores = [
  '#0075C9',
  '#009DDA',
  '#00B5E4'
];

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

  let height      = $('#sankey').height(),
      width       = $('#sankey').width(),
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

      const fadeIn = (id = null) => (g, i) => {
        let all_links = d3.selectAll('#sankey .link'),
            all_nodes = d3.selectAll('#sankey .node'),
            nodes_id  = [],
            element_id = (id === null)?(g.id):(id);

        console.log(element_id);

        let event_node = all_nodes.filter((d) => (d.id === element_id));
        event_node.select('rect')
          .transition()
          .style('fill', 'black')
          .style('stroke', 'black');
        event_node.select('text')
          .transition()
          .style('fill', 'black');

        let filter_nodes = all_nodes.filter((d) => {
          let state = false;

          nodes_id.forEach((element) => { if(d.id === element) { state = true; } });

          return state;
        });
        filter_nodes.select('rect')
          .transition()
          .style('fill', 'black')
          .style('stroke', 'black');
        filter_nodes.select('text')
          .transition()
          .style('fill', 'black');

        let filter_links = all_links.filter((d) => {
          let state = true;

          if (d.source.id === element_id) {
            nodes_id.push(d.target.id);
          } else if (d.target.id === element_id) {
            nodes_id.push(d.source.id);
          } else {
            state = false;
          }

          return state;
        });
        filter_links.transition()
          .style('stroke', '#0075C9')
          .style('stroke-opacity', 0.5);
      };
      const tooltipIn = (d) => {
        $('#tooltip').css({ top: event.layerY + 20, left: event.layerX + 20 });
        $('.tooltip_name').text(d.name);
        $('.tooltip_production').text(`Producción: ${ d.production }`);
        $('.tooltip_losses').text(`Pérdida: ${ d.losses }`);
      };
      const fadeOut = (opacity) => (g, i) => {
        let all_links = d3.selectAll('#sankey .link'),
            all_nodes = d3.selectAll('#sankey .node'),
            nodes_id  = [];

        let event_node = all_nodes.filter((d) => (d.id === g.id));
        event_node.select('rect')
          .transition()
          .style('fill', null)
          .style('stroke', null);
        event_node.select('text')
          .transition()
          .style('fill', null);

        let filter_nodes = all_nodes.filter((d) => {
          let state = false;

          nodes_id.forEach((element) => { if(d.id === element) { state = true; } });

          return state;
        });
        filter_nodes.select('rect')
          .transition()
          .style('fill', null)
          .style('stroke', null);
        filter_nodes.select('text')
          .transition()
          .style('fill', null);

        let filter_links = all_links.filter((d) => {
          let state = true;

          if (d.source.id === g.id) {
            nodes_id.push(d.target.id);
          } else if (d.target.id === g.id) {
            nodes_id.push(d.source.id);
          } else {
            state = false;
          }

          return state;
        });
        filter_links.transition()
          .style('stroke', null)
          .style('stroke-opacity', null);

        $('#tooltip').removeAttr('style');
      };
      const buscarNodo = (id) => nodesOri.filter((element) => element.id === id)[0];
      const intro = (stage, tooltip_create = false, tooltip_delete = false, next = true) => {
        let node_map    = [ 2, 27, 13, 26, 12, 31 ],
            node        = buscarNodo(node_map[stage]),
            next_node_1 = buscarNodo(node_map[stage + 1]),
            next_node_2 = buscarNodo(node_map[stage + 2]),
            intro_container, intro_buttons,
            button_last, button_next,
            state;

        const node_on = (node) => {
          let node_dom = d3.select(`#node_${ node.id }`);

          node_dom.select('rect')
            .transition()
            .style('fill', 'black')
            .style('stroke', 'black');
          node_dom.select('text')
            .transition()
            .style('fill', 'black');
        };
        const link_on = (node, next_node) => {
          let link_dom = d3.selectAll('#sankey .link').filter((d) => (d.source.id === node.id && d.target.id === next_node.id));

          link_dom.transition()
            .style('stroke', '#0075C9')
            .style('stroke-opacity', 0.5);
        };
        const node_off = (node) => {
          let node_dom = d3.select(`#node_${ node.id }`);

          node_dom.select('rect')
            .transition()
            .style('fill', null)
            .style('stroke', null);
          node_dom.select('text')
            .transition()
            .style('fill', null);
        };
        const link_off = (node, next_node) => {
          let link_dom = d3.selectAll('#sankey .link').filter((d) => (d.source.id === node.id && d.target.id === next_node.id));

          link_dom.transition()
            .style('stroke', null)
            .style('stroke-opacity', null);
        };

        // Create tooltip_intro
        if (tooltip_create) {
          d3.select('#content')
            .append('div')
            .attr('id', 'intro_screen')
            .style('top', '0px')
            .style('left', '0px');
          intro_container = d3.select('#content')
            .append('div')
            .attr('id', 'tooltip_intro')
            .style('bottom', '20px')
            .style('right', '20px');
          intro_container.append('h2').attr('class', 'tooltip_name');
          intro_container.append('p').attr('class', 'tooltip_production');
          intro_buttons = intro_container.append('div').attr('class', 'flex flex_justify_between');
          button_last = intro_buttons.append('button').attr('id', 'last').text('Anterior');
          button_next = intro_buttons.append('button').attr('id', 'next').text('Siguiente');
        } else {
          intro_container = d3.select('#tooltip_intro');
          intro_buttons = intro_container.select('div');
          button_last = intro_buttons.select('#last');
          button_next = intro_buttons.select('#next');
        }
        // Delete tooltip_intro
        if (tooltip_delete) {
          d3.select('#tooltip_intro').remove();
          d3.select('#intro_screen').remove();

          node_map.forEach((v, k) => {
            let node = buscarNodo(node_map[k]);
            let next = buscarNodo(node_map[k + 1]);

            node_off(node);
            link_off(node, next);
          });

          return false;
        }

        if (next) {
          node_on(node);
          link_on(node, next_node_1);
        } else {
          node_off(next_node_1);
          link_off(next_node_1, next_node_2);
        }

        intro_container.select('h2').text(node.name);
        intro_container.select('p').text('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');
        button_last.attr('class', 'btn btn-default btn-xs').on('click', () => {
          intro(stage - 1, false, false, false);
        });
        button_next.attr('class', 'btn btn-default btn-xs').on('click', () => {
          intro(stage + 1);
        });

        if (stage === 0) {
          button_last.attr('class', 'btn btn-default btn-xs disabled').on('click', () => {
            intro(stage);
          });
        } else if (stage === (node_map.length - 1)) {
          button_next.attr('class', 'btn btn-primary btn-xs').text('Comenzar').on('click', () => {
            intro(stage, false, true);
          });
        }
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

      const dibujarSankey = (width, heigth, data) => {

        // Se vacia contenedor
        $('#sankey').empty();

        // Se definen variables
        let margin = {
          top: 40,
          right: 200,
          bottom: 40,
          left: 200,
          header: 20
        },
        headerSize = 19,
        size = {
          width: (((width < 1400)?(width):(1400)) - margin.left - margin.right),
          height: (heigth - margin.top - margin.bottom - margin.header - headerSize)
        },
        secciones = [
          'COL 01',
          'COL 02',
          'COL 03',
          'COL 04',
          'COL 05',
          'COL 06',
        ],
        anchoNodo = 20,
        separacionNodo = 20,
        posColumnas = [];

        // Creación SVG
        svg = d3.select('#sankey')
          .append('svg')
          .attr('width', size.width + margin.right + margin.left)
          .attr('height', size.height + margin.top + margin.bottom + margin.header + headerSize);

        // Borrar
        // svg.append('g')
        //   .attr('transform', `translate(${ 0 }, ${ 0 })`)
        //   .append('rect')
        //   .attr('width', `${ size.width + margin.right + margin.left }px`)
        //   .attr('height', `${ margin.top }px`)
        //   .style('fill', 'silver');
        // Borrar
        // svg.append('g')
        //   .attr('transform', `translate(${ 0 }, ${ height - margin.bottom })`)
        //   .append('rect')
        //   .attr('width', `${ size.width + margin.right + margin.left }px`)
        //   .attr('height', `${ margin.top }px`)
        //   .style('fill', 'silver');
        // Borrar
        // svg.append('g')
        //   .attr('transform', `translate(${ 0 }, ${ margin.top + headerSize })`)
        //   .append('rect')
        //   .attr('width', `${ size.width + margin.right + margin.left }px`)
        //   .attr('height', `${ margin.header }px`)
        //   .style('fill', 'silver');

        // Se agregan encabezados
        let encabezado = svg.append('g')
          .attr('id', 'chart-encabezado')
          .attr('transform', `translate(${ margin.left }, ${ margin.top + 15 })`);
        encabezado.append('text')
          .attr('class', 'chart-encabezado-left')
          .attr('x', -10)
          .text(secciones[0]);

        // Se crea grafico
        let chart = svg.append('g')
          .attr('transform', `translate(${ margin.left }, ${ margin.top + $('#chart-encabezado')[0].getBBox().height + margin.header })`);

        // Creación Sankey
        sankeyChartD3 = d3.sankey()
          .nodeWidth(anchoNodo)
          .nodePadding(separacionNodo)
          .size([size.width, size.height])
          .nodes(data.nodes)
          .links(data.links)
          .layout();

        // Creación de Links
        path = sankeyChartD3.link();

        //  Se crean links
        let link = chart.append('g')
          .attr('id', 'links')
          .selectAll('.link')
          .data(data.links)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('class', 'link')
          .style('stroke-width', (d) => Math.max(1, d.dy))
          // .on('mouseover', (d) => { d3.select(d3.event.target).style('stroke-opacity', 1); })
          // .on('mouseout', (d) => { d3.select(d3.event.target).style('stroke-opacity', 0.75); })
          .sort((a, b) => (b.dy - a.dy));

          // link.filter((element) => (element.target.name === 'EXPORTACIONES' || element.target.name === 'CONSUMO PROPIO' || element.target.name === 'TRANSPORTE' || element.target.name === 'PERDIDA'))
          //   .style('stroke', '#BA3F1D');

        // Se crean nodos
        let node = chart.append('g')
          .attr('id', 'nodes')
          .selectAll('.node')
          .data(data.nodes)
          .enter()
          .append('g')
            .attr('id', (d) => `node_${ d.id }`)
            .attr('class', 'node')
            .attr('transform', (d) => {

              if (posColumnas.indexOf(d.x) === -1) {
                posColumnas.push(d.x);
              }

              return `translate(${ d.x }, ${ d.y })`;
            }); // error compatibilidad
            // .call(d3.drag().on('drag', dragmove));

        // Se crean rectangulos nodos
        node.append('rect')
            .attr('width', sankeyChartD3.nodeWidth())
            .attr('height', (d) => Math.max(5, d.dy))
            .on('mouseover', fadeIn())
            .on('mouseout', fadeOut())
            .on('mousemove', tooltipIn);

        // Se crean textos nodos
        node.append('text')
          .attr('class', 'node-text')
          .attr('x', 10 + sankeyChartD3.nodeWidth())
          .attr('y', (d) => (d.dy / 2))
          .attr('dy', '0.35em')
          .text((d) => (d.name))
          .filter((d) => (d.targetLinks.length === 0))
          .attr('class', 'node-text-start')
          .attr('x', -10);

        // Se agrega texto referencia hover link
        // link.append('title').text((d) => `${ d.source.name } (${ d.source.id }) → ${ d.target.name } (${ d.target.id }) → ${ d.value }`);

        // Se agrega texto referencia hover node
        // node.append('title').text((d) => `${ d.name } (${ d.id })`);

        // Se agregan encabezados
        posColumnas.sort(); // Se ordena posicion de columnas
        secciones.forEach((v, k) => {
          encabezado.append('text')
            .filter((d) => (k > 0))
            .attr('class', 'chart-encabezado-right')
            .attr('x', (d) => (posColumnas[k] + anchoNodo + 10))
            .text(v);
        });

        // the function for moving the nodes
        // function dragmove(d) {
        //   d3.select(this).attr('transform', `translate(${ d.x = Math.max(0, Math.min(size.width - d.dx, d3.event.x)) }, ${ d.y = Math.max(0, Math.min(size.height - d.dy, d3.event.y)) })`);
        //   sankeyChartD3.relayout();
        //   link.attr('d', path);
        // }
      };

      // const actualizarSankey = (width, heigth, data, oldLinks) => {
      //   const linksDiff = (links_old, links_new) => {
      //     console.log(links_old);
      //     console.log(links_new);
      //     let links = [],
      //         source,
      //         target;
      //
      //     links_new.forEach((v, k) => {
      //       source  = v.source;
      //       target  = v.target;
      //
      //       links_old.forEach((v, k) => { if ((source !== v.source.id) || (target !== v.target.id)) { links.push(v); } });
      //     });
      //
      //     return links;
      //   };
      //
      //   // let newNodes = nodesDiff(data, sankeyData);
      //   // let newLinks = linksDiff(oldLinks, data.links);
      //
      //   // Parametros
      //   let margin = {
      //     top: 0,
      //     right: 0,
      //     bottom: 0,
      //     left: 0
      //   };
      //   let size = {
      //     width: width - margin.left - margin.right,
      //     height: heigth - margin.top - margin.bottom
      //   };
      //
      //   // Creación Sankey
      //   sankeyChartD3 = d3.sankey()
      //     .nodeWidth(20) // Ancho nodo
      //     .size([size.width, size.height])
      //     .nodes(data.nodes)
      //     .links(data.links)
      //     .layout(32);
      //
      //   sankeyChartD3.relayout();
      //
      //   // Creación de Links
      //   path = sankeyChartD3.link();
      //   $('#links').empty();
      //
      //   let links = d3.select('#links')
      //     .selectAll('.link')
      //     .data(data.links)
      //     .enter();
      //
      //   links.append('path')
      //       .attr('class', 'link')
      //       .attr('d', (d) => path(d))
      //       .style('stroke-width', (d) => {
      //         return d.dy;
      //       })
      //       .style('stroke', 'gray')
      //       .on('mouseover', (d) => {
      //         // console.log(d3.event);
      //         d3.select(d3.event.target).style('stroke', 'red');
      //       })
      //       .on('mouseout', (d) => {
      //         d3.select(d3.event.target).style('stroke', 'gray');
      //       });
      //
      //   // d3.selectAll('.link')
      //   //   .data(data.links)
      //   //   .attr('d', (d) => path(d));
      //   d3.selectAll('.node')
      //     .data(data.nodes)
      //     // .transition()
      //     .attr('transform', (d) => `translate(${ d.x }, ${ d.y })`);
      //   d3.selectAll('rect')
      //     .data(data.nodes)
      //     .style('opacity', 0)
      //     .attr('width', sankeyChartD3.nodeWidth())
      //     .attr('height', (d) => d.dy)
      //     .transition()
      //     .style('opacity', 1);
      //
      //   // Create Diference
      //   // newLinks.forEach((v, k) => {
      //   //   let link = d3.select('#links')
      //   //     .append('path')
      //   //       .attr('class', 'link')
      //   //       .attr('d', () => path(v))
      //   //       .style('stroke-width', () => Math.max(1, v.dy))
      //   //       .style('stroke', () => scaleColor(v.source.name.replace(' ', '')))
      //   //       .sort((a, b) => (b.dy - a.dy));
      //   //
      //   //   link.append('title').text(() => `${ v.source.name } → ${ v.target.name } \n ${ formatoNumero(v.value) }`);
      //   // });
      // };
      // const maxParent = (nodo) => {
      //   // console.log(nodo);
      //   let parentNode = nodesGlo.filter((element) => (element.id === nodo.parent))[0];
      //
      //   if (nodo.parent !== false) {
      //     if (typeof(parentNode) !== 'undefined' && parentNode.group === true) {
      //       return maxParent(nodesGlo.filter((element) => (element.id === nodo.parent))[0]);
      //     } else {
      //       return nodo;
      //     }
      //   } else {
      //     return nodo;
      //   }
      // };
      // const deleteEmptyNodes = () => {
      //   let del = 0,
      //       nodesDelete = [],
      //       status;
      //
      //   // moveId = 0;
      //
      //   nodesGlo.forEach((node, nodeI) => {
      //
      //     // console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')');
      //     status = false;
      //
      //     // Consulto si el nodo se utiliza en algun link
      //     linksGlo.forEach((link, linkI) => {
      //       if (node.id === link.source) {
      //         status = true;
      //         link.source = link.source - del;
      //       }
      //       if (node.id === link.target) {
      //         status = true;
      //         link.target = link.target - del;
      //       }
      //     });
      //
      //     // // Modificar el ID restando la cantidad de elementos borrados
      //     // node.id = node.id - del;
      //
      //     if (!status) {
      //       // console.log('Borrar');
      //       nodesDelete.push(nodeI);
      //       del++;
      //     }
      //     // else {
      //     //   // console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')<-');
      //     // }
      //   });
      //
      //   nodesDelete.reverse().forEach((node) => { nodesGlo.splice(node, 1); });
      //
      //   // moveId = del;
      //   // nodes.forEach((node, nodeI) => {
      //   //   console.log('nodo: ' + nodeI + ' ( id: ' + node.id + ')');
      //   // });
      //
      //   // console.log(links);
      //   return nodesGlo;
      // };
      // const declareGroupLinks = () => {
      //   let links = [],
      //       source, parentSource, stateSource,
      //       target, parentTarget, stateTarget,
      //       nodoExistente,
      //       addSource,
      //       addTarget,
      //       addValue;
      //
      //   linksGlo.forEach((v, k) => {
      //
      //     //Se obtiene source y target del elemento
      //     source = nodesGlo.filter((element) => (element.id === parseInt(v.source)))[0];
      //     target = nodesGlo.filter((element) => (element.id === parseInt(v.target)))[0];
      //     //Se guarda source-padre y target-padre
      //     parentSource = maxParent(source);
      //     parentTarget = maxParent(target);
      //     //Se guarda source-state y target-state
      //     stateSource = parentSource.group;
      //     stateTarget = parentTarget.group;
      //     //Se guarda source y link a crear
      //     addSource = (stateSource) ? (parentSource) : (source);
      //     addTarget = (stateTarget) ? (parentTarget) : (target);
      //     addValue  = parseInt(v.value);
      //     //Se consulta si el nodo existe
      //     nodoExistente = links.filter((element) => (element.source === addSource.id && element.target === addTarget.id));
      //
      //     if (nodoExistente.length !== 0) {
      //       //Se suma valor a duplicado
      //       nodoExistente[0].value += addValue;
      //     } else {
      //       //Se creo nuevo link
      //       links.push({
      //         'source': addSource.id,
      //         'target': addTarget.id,
      //         'value':  addValue
      //       });
      //     }
      //   });
      //   return links;
      // };
      // const preSankey = () => {
      //   linksGlo = $.extend(true, [], linksOri);
      //   nodesGlo = $.extend(true, [], nodesOri);
      //   linksGlo = declareGroupLinks();
      //   nodesGlo = deleteEmptyNodes();
      //
      //   dibujarSankey(width, height, { 'nodes': nodesGlo, 'links': linksGlo });
      // };

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
            d3.json('public/src/nodes.json', (nodos) => {
              nodesOri = nodos;

              d3.json('public/src/links.json',
                (links) => {
                  linksOri = links;

                  success();
                }
              );
            });

            // d3.csv('public/src/nodes.csv',
            //   (nodos) => {
            //     nodesOri = formatoSankey('nodos', nodos);
            //
            //     d3.csv('public/src/links.csv',
            //       (links) => {
            //         linksOri = formatoSankey('links', links);
            //
            //         success();
            //       }
            //     );
            //   }
            // );
          });

          return promise;
        };

        downloadFile().then(() => {
          dibujarSankey(width, height, { 'nodes': nodesOri, 'links': linksOri });
          intro(0, true);
          // preSankey();
        });
      };

  init();
});
