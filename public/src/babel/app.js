// VARIABLES
let COLORES_GRADIENTE = [ '#206aab', '#0075c9', '#009dda', '#4dcbec', '#7fdaf1', '#b2e9f7' ],
    GLOBAL_NODES,
    GLOBAL_LINKS,
    INTRO = {
      nodes: [
        3,
        28,
        15,
        26,
        12,
        31
      ],
      nodes_description: [
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      ]
    };

// FUNCIONES
const GENERAR_GRADIENTES = (colores) => {
  let keys = {};

  colores.forEach((v1, k1) => { colores.forEach((v2, k2) => { keys[`${ k1 + 1 }${ k2 + 1 }`] = [v1, v2]; }); });

  return keys;
};
const BUSCAR_NODO = (id, modificador = 0) => (GLOBAL_NODES.filter((element) => element.id === id + modificador)[0]);

$(() => {

  let height      = $('#sankey').height(),
      width       = $('#sankey').width(),
      nodesOri, linksOri,
      nodesGlo, linksGlo,
      sankeyChartD3, path, svg;

  const fade = (type = null, id = null) => (g, i) => {
    if (type !== null) {
      let all_links   = d3.selectAll('#sankey .link'),
          all_nodes   = d3.selectAll('#sankey .node'),
          element_id  = (id === null)?(g.id):(id),
          event_node;

      switch (type) {
        case 'fadeIn':
          // Estilos aplicados al nodo seleccionado
          event_node = d3.select(`#node_${ element_id }`);
            event_node.select('rect')
              .transition()
              .style('fill', COLORES_GRADIENTE[g.position - 1])
              .style('stroke', 'white');
            event_node.select('text')
              .transition()
              .style('fill', 'transparent');

          // Estilos aplicados a los links relacionados
          all_links.filter((d) => ((d.source.id === element_id && d.target.id !== 42) || (d.target.id === element_id && d.target.id !== 42)))
            .transition()
            .style('stroke', (d) => (`url(#key_${ d.source.position }${ d.target.position })`))
            .style('stroke-opacity', 0.5);
          all_links.filter((d) => ((d.source.id === element_id && d.target.id === 42) || (d.target.id === element_id && d.target.id === 42)))
            .transition()
            .style('stroke', 'red')
            .style('stroke-opacity', 0.5);
          break;
        case 'fadeOut':
          // Estilos aplicados al nodo seleccionado
          event_node = d3.select(`#node_${ element_id }`);
            event_node.select('rect')
              .transition()
              .style('fill', null)
              .style('stroke', null);
            event_node.select('text')
              .transition()
              .style('fill', null);

          // Estilos aplicados a los links relacionados
          all_links.style('stroke', null).style('stroke-opacity', null);

          $('#tooltip').removeAttr('style');
          break;
      }
    }
  };
  const intro = (stage, state = 'normal', action = 'none') => {
    let link_dom = d3.selectAll('#sankey .link').filter((link) => (link.source.id === INTRO.nodes[stage].id && link.target.id === INTRO.nodes[(stage + 1)].id)),
        node_dom = d3.selectAll('#sankey .node').filter((node) => (node.id === INTRO.nodes[stage].id)),
        intro_container, intro_buttons,
        button_last, button_next;

    const node_on = (node) => {
      node_dom.select('rect').transition().style('fill', COLORES_GRADIENTE[node.position - 1]).style('stroke', 'white');
      node_dom.select('text').transition().style('fill', 'black');
    };
    const node_off = (node) => {
      node_dom.select('rect').transition().style('fill', null).style('stroke', null);
      node_dom.select('text').transition().style('fill', null);
    };
    const link_on = (node, next_node) => {
      link_dom.transition().style('stroke', (d) => (`url(#key_${ d.source.position }${ d.target.position })`)).style('stroke-opacity', 0.5);
    };
    const link_off = (node, next_node) => {
      link_dom.transition().style('stroke', null).style('stroke-opacity', null);
    };

    switch (state) {
      case 'create':
        d3.select('#content').append('div').attr('id', 'intro_screen').style('top', '0px').style('left', '0px');
        intro_container = d3.select('#content').append('div').attr('id', 'tooltip_intro').style('bottom', '20px').style('right', '20px');
          intro_container.append('h2').attr('class', 'tooltip_name');
          intro_container.append('p').attr('class', 'tooltip_production');
        intro_buttons   = intro_container.append('div').attr('class', 'flex flex_justify_between');
        button_last     = intro_buttons.append('button').attr('id', 'last').text('Anterior');
        button_next     = intro_buttons.append('button').attr('id', 'next').text('Siguiente');
        break;
      case 'delete':
        d3.select('#tooltip_intro').remove();
        d3.select('#intro_screen').remove();
        d3.selectAll('#sankey .node rect').transition().style('fill', null).style('stroke', null);
        d3.selectAll('#sankey .node text').transition().style('fill', null);
        d3.selectAll('#sankey .link').transition().style('stroke', null).style('stroke-opacity', null);
        return false;
      case 'normal':
        intro_container = d3.select('#tooltip_intro');
        intro_buttons   = intro_container.select('div');
        button_last     = intro_buttons.select('#last');
        button_next     = intro_buttons.select('#next');
        break;
    }
    switch (action) {
      case 'next':
        node_on(INTRO.nodes[stage]);
        link_on(INTRO.nodes[stage], INTRO.nodes[stage + 1]);
        break;
      case 'back':
        node_off(INTRO.nodes[stage + 1]);
        link_off(INTRO.nodes[stage + 1], INTRO.nodes[stage + 2]);
        break;
    }

    intro_container.select('h2').text(INTRO.nodes[stage].name);
    intro_container.select('p').text(INTRO.nodes_description[stage]);

    if (stage === 0) {
      button_last.attr('class', 'btn btn-default btn-xs disabled').on('click', () => { intro(stage, 'normal', 'none'); });
      button_next.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage + 1, 'normal', 'next'); });
    } else if (stage === (INTRO.nodes.length - 1)) {
      button_last.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage - 1, 'normal', 'back'); });
      button_next.attr('class', 'btn btn-primary btn-xs').text('Comenzar').on('click', () => { intro(stage, 'delete', 'none'); });
    } else {
      button_last.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage - 1, 'normal', 'back'); });
      button_next.attr('class', 'btn btn-default btn-xs').on('click', () => { intro(stage + 1, 'normal', 'next'); });
    }
  };

      const tooltipIn = (d) => {

        $('#tooltip').css({ top: $('#sankey svg').position().top + d.y + 7 - 20, left: $('#sankey svg').position().left + d.x + 210 });

        if (d.position === 1 || d.position === 3 || d.position === 5) {
          $('.tooltip_name').text(d.name);
          $('.tooltip_ktep').css({'display': 'none'}).text(d.ketp);
          $('.tooltip_production').removeAttr('style').text(`Producción: ${ d.production }`);
          $('.tooltip_importation').removeAttr('style').text(`Importación: ${ d.importation }`);
          $('.tooltip_exportation').removeAttr('style').text(`Exportación: ${ d.exportation }`);
          $('.tooltip_consumo').css({'display': 'none'}).text(`Consumo: ${ d.consumo }`);
          $('.tooltip_losses').removeAttr('style').text(`Pérdida: ${ d.losses }`);
          $('.tooltip_others').removeAttr('style').text(`Otros: ${ d.others }`);
        } else if (d.position === 2 || d.position === 4) {
          $('.tooltip_name').text(d.name);
          $('.tooltip_ktep').removeAttr('style').text(d.ketp);
          $('.tooltip_production').removeAttr('style').text(`Producción: ${ d.production }`);
          $('.tooltip_importation').css({'display': 'none'}).text(`Importación: ${ d.importation }`);
          $('.tooltip_exportation').css({'display': 'none'}).text(`Exportación: ${ d.exportation }`);
          $('.tooltip_consumo').removeAttr('style').text(`Consumo: ${ d.consumo }`);
          $('.tooltip_losses').removeAttr('style').text(`Pérdida: ${ d.losses }`);
          $('.tooltip_others').css({'display': 'none'}).text(`Otros: ${ d.others }`);
        } else {
          $('.tooltip_name').text(d.name);
          $('.tooltip_ktep').removeAttr('style').text(d.ketp);
          $('.tooltip_production').css({'display': 'none'}).text(`Producción: ${ d.production }`);
          $('.tooltip_importation').css({'display': 'none'}).text(`Importación: ${ d.importation }`);
          $('.tooltip_exportation').css({'display': 'none'}).text(`Exportación: ${ d.exportation }`);
          $('.tooltip_consumo').css({'display': 'none'}).text(`Consumo: ${ d.consumo }`);
          $('.tooltip_losses').css({'display': 'none'}).text(`Pérdida: ${ d.losses }`);
          $('.tooltip_others').css({'display': 'none'}).text(`Otros: ${ d.others }`);
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

        // Se definen variables
        let margin      = { top: 40, right: 200, bottom: 40, left: 200, header: 20 },
        headerSize      = 19,
        size            = { width: 1400 - margin.left - margin.right, height: heigth - margin.top - margin.bottom - margin.header - headerSize },
        secciones       = [
          'Energías primarias',
          'Centros de transformación',
          'Energías secundarias',
          'Centros de transformación',
          'Energías terciarias',
          'Consumos',
          'No aprovechables'
        ],
        anchoNodo       = 20,
        separacionNodo  = 20,
        posColumnas     = [];

        // Creación SVG
        svg = d3.select('#sankey')
          .append('svg')
          .attr('width', size.width + margin.right + margin.left)
          .attr('height', size.height + margin.top + margin.bottom + margin.header + headerSize)
          .attr('preserveAspectRatio', 'xMidYMid meet');

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

        let keys = GENERAR_GRADIENTES(COLORES_GRADIENTE);

        for (let key in keys) {
          eval(`let key_${ key } = svg.append('defs')
          .append('linearGradient')
          .attr('id', 'key_${ key }')
          .attr('x1', '0%')
          .attr('x2', '100%')
          .attr('spreadMethod', 'pad');
          key_${ key }.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', '${ keys[key][0] }')
          .attr('stop-opacity', 1);
          key_${ key }.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', '${ keys[key][1] }')
          .attr('stop-opacity', 1);`);
        }

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
        node.filter((element) => (element.name !== 'borrar')).append('rect')
            .attr('width', sankeyChartD3.nodeWidth())
            .attr('height', (d) => (Math.max(5, d.dy)))
            .on('mouseover',  fade('fadeIn', null))
            .on('mouseout',   fade('fadeOut', null))
            .on('mousemove', tooltipIn);

        // Se crean textos nodos
        node.filter((element) => (element.name !== 'borrar')).append('text')
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
        posColumnas.sort((a, b) => (a - b)); // Se ordena posicion de columnas

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

  const downloadFile = () => {
    let promise = new Promise((success) => {
      d3.json('public/src/nodes.json', (nodos) => {
        GLOBAL_NODES = nodos;

        d3.json('public/src/links.json', (links) => {
            GLOBAL_LINKS = links;

            success();
          }
        );
      });
    });

    return promise;
  };

  downloadFile().then(() => {

    INTRO.nodes.forEach((v, k) => { INTRO.nodes[k] = BUSCAR_NODO(v); });

    dibujarSankey(width, height, { 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS });

    intro(0, 'create', 'next');

  });
});
