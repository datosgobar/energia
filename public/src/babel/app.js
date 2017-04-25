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
    },
    SANKEY = {
      secciones_header: [
        ['ENERGÍAS', 'PRIMARIAS'],
        ['CENTROS DE', 'TRANSFORMACIÓN'],
        ['ENERGÍAS', 'SECUNDARIAS'],
        ['CENTROS DE', 'TRANSFORMACIÓN'],
        ['ENERGÍAS', 'TERCIARIAS'],
        ['SECTORES', 'DE CONSUMOS'],
        ['NO APROVECHABLES']
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
              .style('stroke', 'black');
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
            .style('stroke', (`url(#losses)`))
            .style('stroke-opacity', 0.5);
          break;
        case 'fadeOut':
          // Estilos aplicados al nodo seleccionado
          event_node = d3.select(`#node_${ element_id }`);
            event_node.select('rect')
              .transition()
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
      node_dom.select('rect').transition().style('stroke', 'black');
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
      $('.tooltip_ktep').text(d.ketp);
      $('.tooltip_production').removeAttr('style').text(`Producción: ${ d.production }`);
      $('.tooltip_importation').removeAttr('style').text(`Importación: ${ d.importation }`);
      $('.tooltip_exportation').removeAttr('style').text(`Exportación: ${ d.exportation }`);
      $('.tooltip_consumo').css({'display': 'none'}).text(`Consumo: ${ d.consumo }`);
      $('.tooltip_losses').removeAttr('style').text(`Pérdida: ${ d.losses }`);
      $('.tooltip_others').removeAttr('style').text(`Otros: ${ d.others }`);
    } else if (d.position === 2 || d.position === 4) {
      $('.tooltip_name').text(d.name);
      $('.tooltip_ktep').text(d.ketp);
      $('.tooltip_production').removeAttr('style').text(`Producción: ${ d.production }`);
      $('.tooltip_importation').css({'display': 'none'}).text(`Importación: ${ d.importation }`);
      $('.tooltip_exportation').css({'display': 'none'}).text(`Exportación: ${ d.exportation }`);
      $('.tooltip_consumo').removeAttr('style').text(`Consumo: ${ d.consumo }`);
      $('.tooltip_losses').removeAttr('style').text(`Pérdida: ${ d.losses }`);
      $('.tooltip_others').css({'display': 'none'}).text(`Otros: ${ d.others }`);
    } else {
      $('.tooltip_name').text(d.name);
      $('.tooltip_ktep').text(d.ketp);
      $('.tooltip_production').css({'display': 'none'}).text(`Producción: ${ d.production }`);
      $('.tooltip_importation').css({'display': 'none'}).text(`Importación: ${ d.importation }`);
      $('.tooltip_exportation').css({'display': 'none'}).text(`Exportación: ${ d.exportation }`);
      $('.tooltip_consumo').css({'display': 'none'}).text(`Consumo: ${ d.consumo }`);
      $('.tooltip_losses').css({'display': 'none'}).text(`Pérdida: ${ d.losses }`);
      $('.tooltip_others').css({'display': 'none'}).text(`Otros: ${ d.others }`);
    }
  };
  const dibujarSankey = (width, heigth, data) => {

    // Se definen variables
    let margin      = { top: 40, right: 200, bottom: 40, left: 200, header: 20 },
    headerSize      = 38,
    size            = { width: 1400 - margin.left - margin.right, height: heigth - margin.top - margin.bottom - margin.header - headerSize },
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
      .text(SANKEY.secciones_header[0][0]);
    encabezado.append('text')
      .attr('class', 'chart-encabezado-left')
      .attr('x', -10)
      .attr('y', 19)
      .text(SANKEY.secciones_header[0][1]);

    // Se crea grafico
    let chart = svg.append('g')
      .attr('transform', `translate(${ margin.left }, ${ margin.top + $('#chart-encabezado')[0].getBBox().height + margin.header })`);
    console.log(data.nodes);
    console.log(data.nodes.filter((element) => (element.internal_offer > 0 || typeof(element.internal_offer) === 'undefined')));
    // Creación Sankey
    sankeyChartD3 = d3.sankey()
      .nodeWidth(anchoNodo)
      .nodePadding(separacionNodo)
      .size([size.width, size.height])
      .nodes(data.nodes)
      .links(data.links)
      .layout();

    let keys = GENERAR_GRADIENTES(COLORES_GRADIENTE);

    svg.append('defs')
      .append('linearGradient')
      .attr('id', 'losses')
      .attr('x1', '50%')
      .attr('x2', '50%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    d3.select('#losses').append('stop').attr('offset', '0%').attr('stop-color', `red`).attr('stop-opacity', 1);
    d3.select('#losses').append('stop').attr('offset', '50%').attr('stop-color', `red`).attr('stop-opacity', 1);
    d3.select('#losses').append('stop').attr('offset', '100%').attr('stop-color', `white`).attr('stop-opacity', 0);

    for (let key in keys) {
      svg.select('defs').append('linearGradient').attr('id', `key_${ key }`).attr('gradientUnits', 'userSpaceOnUse');
      d3.select(`#key_${ key }`).append('stop').attr('offset', '0%').attr('stop-color', `${ keys[key][0] }`).attr('stop-opacity', 1);
      d3.select(`#key_${ key }`).append('stop').attr('offset', '100%').attr('stop-color', `${ keys[key][1] }`).attr('stop-opacity', 1);
    }

    // Creación de Links
    path = sankeyChartD3.link();

    //  Se crean links
    let link = chart.append('g')
      .attr('id', 'links')
      .selectAll('.link')
      .data(sankeyChartD3.links())
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'link')
      .style('stroke-width', (d) => Math.max(1, d.dy))
      // .on('mouseover', (d) => { d3.select(d3.event.target).style('stroke-opacity', 1); })
      // .on('mouseout', (d) => { d3.select(d3.event.target).style('stroke-opacity', 0.75); })
      .sort((a, b) => (b.dy - a.dy));

    // Se crean nodos
    let node = chart.append('g')
      .attr('id', 'nodes')
      .selectAll('.node')
      .data(sankeyChartD3.nodes())
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
    node.filter((element) => (element.name !== 'borrar' && element.internal_offer > 0 || typeof(element.internal_offer) === 'undefined')).append('rect')
        .attr('width', sankeyChartD3.nodeWidth())
        .attr('height', (d) => (Math.max(5, d.dy)))
        .on('mouseover',  fade('fadeIn', null))
        .on('mouseout',   fade('fadeOut', null))
        .on('mousemove', tooltipIn);

    // Se crean textos nodos
    node.filter((element) => (element.name !== 'borrar' && element.internal_offer > 0 || typeof(element.internal_offer) === 'undefined')).append('text')
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

    SANKEY.secciones_header.forEach((v, k) => {
      encabezado.append('text')
        .filter((d) => (k > 0))
        .attr('class', 'chart-encabezado-right')
        .attr('x', (d) => (posColumnas[k] + anchoNodo + 10))
        .text(v[0]);
      encabezado.append('text')
        .filter((d) => (k > 0))
        .attr('class', 'chart-encabezado-right')
        .attr('x', (d) => (posColumnas[k] + anchoNodo + 10))
        .attr('y', 19)
        .text(v[1]);
    });

    // the function for moving the nodes
    // function dragmove(d) {
    //   d3.select(this).attr('transform', `translate(${ d.x = Math.max(0, Math.min(size.width - d.dx, d3.event.x)) }, ${ d.y = Math.max(0, Math.min(size.height - d.dy, d3.event.y)) })`);
    //   sankeyChartD3.relayout();
    //   link.attr('d', path);
    // }
  };
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
