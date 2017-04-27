// VARIABLES
let GLOBAL_NODES,
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
    },
    SELECTORES = {
      categorias: [
        ['Energías primarias', ['categorias1', 'categorias1', 'categorias1', 'categorias1', 'categorias1']],
        ['Energías secundarias', ['categorias2', 'categorias2', 'categorias2', 'categorias2', 'categorias2']],
        ['Energías terciarias', ['categorias3', 'categorias3', 'categorias3', 'categorias3', 'categorias3']],
        ['Centros de transformación', ['categorias4', 'categorias4', 'categorias4', 'categorias4', 'categorias4']],
        ['Consumos', ['categorias5', 'categorias5', 'categorias5', 'categorias5', 'categorias5']],
        ['No aprovechables', ['categorias6', 'categorias6', 'categorias6', 'categorias6', 'categorias6']]
      ],
      anio: []
    };

// FUNCIONES
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
            .style('stroke', 'url(#gradient_link)')
            .style('stroke-opacity', 0.5);
          all_links.filter((d) => ((d.source.id === element_id && d.target.id === 42) || (d.target.id === element_id && d.target.id === 42)))
            .style('stroke', 'url(#gradient_lossses_on)')
            .style('stroke-opacity', 0.5);
          break;
        case 'fadeOut':
          // Estilos aplicados al nodo seleccionado
          event_node = d3.select(`#node_${ element_id }`);
            event_node.select('rect')
              .style('stroke', null);
            event_node.select('text')
              .transition()
              .style('fill', null);

          // Estilos aplicados a los links relacionados
          all_links.filter((d) => ((d.source.id === element_id && d.target.id !== 42) || (d.target.id === element_id && d.target.id !== 42)))
            .style('stroke', null)
            .style('stroke-opacity', null);
          all_links.filter((d) => ((d.source.id === element_id && d.target.id === 42) || (d.target.id === element_id && d.target.id === 42)))
            .style('stroke', 'url(#gradient_lossses_off)')
            .style('stroke-opacity', null);

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
      link_dom.style('stroke', 'url(#gradient_link)').style('stroke-opacity', 0.5);
    };
    const link_off = (node, next_node) => {
      link_dom.style('stroke', null).style('stroke-opacity', null);
    };

    switch (state) {
      case 'create':
        d3.select('#content').append('div').attr('id', 'intro_screen').style('top', '0px').style('left', '0px');
        intro_container = d3.select('#content').append('div').attr('id', 'tooltip_intro').style('bottom', '20px').style('right', '20px');
          intro_container.append('div');
          intro_container.select('div').attr('class', 'flex flex_justify_between flex_align_start').append('h2').attr('class', 'tooltip_name');
          intro_container.select('div').append('span').attr('class', 'glyphicon glyphicon-remove tooltip_exit');
          intro_container.append('p').attr('class', 'tooltip_production');
        intro_buttons   = intro_container.append('div').attr('class', 'flex flex_justify_between');
        button_last     = intro_buttons.append('button').attr('id', 'last').text('Anterior');
        button_next     = intro_buttons.append('button').attr('id', 'next').text('Siguiente');

        $('.tooltip_exit').on('click', () => {
          intro(stage, 'delete', 'none');
        });
        $(document).keyup((e) => {
          if (e.keyCode === 27 && $('.tooltip_exit').length === 1 ) { intro(stage, 'delete', 'none'); }
        });

        break;
      case 'delete':
        d3.select('#tooltip_intro').remove();
        d3.select('#intro_screen').remove();
        d3.selectAll('#sankey .node rect').transition().style('fill', null).style('stroke', null);
        d3.selectAll('#sankey .node text').transition().style('fill', null);
        d3.selectAll('#sankey .link').filter((d) => (d.target.id !== 42)).transition().style('stroke', null).style('stroke-opacity', null);
        return false;
      case 'normal':
        intro_container = d3.select('#tooltip_intro');
        intro_buttons   = intro_container.select('div:nth-child(3)');
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

    intro_container.select('h2').text(INTRO.nodes[stage].nombre);
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

    $('#tooltip').css({ top: $('#sankey svg').position().top + d.y + 7, left: $('#sankey svg').position().left + d.x + 210 });

    if (d.posicionX === 1 || d.posicionX === 3 || d.posicionX === 5) {
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(`total: ${ d.oferta_interna }`);
      $('.tooltip_production').removeAttr('style').text(`Producción: ${ d.produccion }`);
      $('.tooltip_importation').removeAttr('style').text(`Importación: ${ d.importacion }`);
      $('.tooltip_exportation').removeAttr('style').text(`Exportación: ${ d.exportacion }`);
      $('.tooltip_consumo').css({'display': 'none'}).text(`Consumo: ${ d.consumo }`);
      $('.tooltip_losses').removeAttr('style').text(`Pérdida: ${ d.perdidas }`);
      $('.tooltip_others').removeAttr('style').text(`Otros: ${ d.otros }`);
    } else if (d.posicionX === 2 || d.posicionX === 4) {
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(`total: ${ d.oferta_interna }`);
      $('.tooltip_production').removeAttr('style').text(`Producción: ${ d.produccion }`);
      $('.tooltip_importation').css({'display': 'none'}).text(`Importación: ${ d.importacion }`);
      $('.tooltip_exportation').css({'display': 'none'}).text(`Exportación: ${ d.exportacion }`);
      $('.tooltip_consumo').removeAttr('style').text(`Consumo: ${ d.consumo }`);
      $('.tooltip_losses').removeAttr('style').text(`Pérdida: ${ d.perdidas }`);
      $('.tooltip_others').css({'display': 'none'}).text(`Otros: ${ d.otros }`);
    } else {
      $('.tooltip_name').text(d.nombre);
      $('.tooltip_ktep').text(`total: ${ d.oferta_interna }`);
      $('.tooltip_production').css({'display': 'none'}).text(`Producción: ${ d.produccion }`);
      $('.tooltip_importation').css({'display': 'none'}).text(`Importación: ${ d.importacion }`);
      $('.tooltip_exportation').css({'display': 'none'}).text(`Exportación: ${ d.exportacion }`);
      $('.tooltip_consumo').css({'display': 'none'}).text(`Consumo: ${ d.consumo }`);
      $('.tooltip_losses').css({'display': 'none'}).text(`Pérdida: ${ d.perdidas }`);
      $('.tooltip_others').css({'display': 'none'}).text(`Otros: ${ d.otros }`);
    }
  };
  const downloadFile = (anio) => {
    let promise = new Promise((success) => {
      d3.json(`public/src/data_${anio}.json`, (data) => {

        GLOBAL_NODES = data.nodes;
        GLOBAL_LINKS = data.links;

        success();
      });
    });

    return promise;
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

    // Creación Sankey
    sankeyChartD3 = d3.sankey()
      .nodeWidth(anchoNodo)
      .nodePadding(separacionNodo)
      .size([size.width, size.height])
      .nodes(data.nodes)
      .links(data.links)
      .layout();

    // Gradientes
    let lossesGradientOff = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'gradient_lossses_on')
      .attr('x1', '50%')
      .attr('x2', '50%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    lossesGradientOff.append('stop').attr('offset', '0%').attr('stop-color', 'red').attr('stop-opacity', 1);
    lossesGradientOff.append('stop').attr('offset', '50%').attr('stop-color', 'red').attr('stop-opacity', 1);
    lossesGradientOff.append('stop').attr('offset', '100%').attr('stop-color', 'white').attr('stop-opacity', 0);
    let lossesGradientOn = svg.select('defs')
      .append('linearGradient')
      .attr('id', 'gradient_lossses_off')
      .attr('x1', '50%')
      .attr('x2', '50%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    lossesGradientOn.append('stop').attr('offset', '0%').attr('stop-color', 'silver').attr('stop-opacity', 1);
    lossesGradientOn.append('stop').attr('offset', '50%').attr('stop-color', 'silver').attr('stop-opacity', 1);
    lossesGradientOn.append('stop').attr('offset', '100%').attr('stop-color', 'white').attr('stop-opacity', 0);
    svg.select('defs')
      .append('svg:pattern')
      .attr('id', 'gradient_link')
      .attr('x', 0)
      .attr('y', 0)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('height', '100%')
      .attr('width', '100%')
      .append('svg:image')
      .attr('y', 0)
      .attr('x', 0)
      .attr('xlink:href', './public/image/gradient_link.svg')
      .attr('width', '100%')
      .attr('height', '100%');

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
      .filter((d) => (d.target.id === 42))
      .style('stroke', 'url(#gradient_lossses_off)');

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
    node.filter((element) => (element.nombre !== 'borrar' && element.oferta_interna > 0 || typeof(element.oferta_interna) === 'undefined')).append('rect')
        .attr('width', sankeyChartD3.nodeWidth())
        .attr('height', (d) => (Math.max(5, d.dy)))
        .on('mouseover',  fade('fadeIn', null))
        .on('mouseout',   fade('fadeOut', null))
        .on('mousemove', tooltipIn);

    // Se crean textos nodos
    node.filter((element) => (element.nombre !== 'borrar' && element.oferta_interna > 0 || typeof(element.oferta_interna) === 'undefined')).append('text')
      .attr('class', 'node-text')
      .attr('x', 10 + sankeyChartD3.nodeWidth())
      .attr('y', (d) => (d.dy / 2))
      .attr('dy', '0.35em')
      .text((d) => (d.nombre))
      .filter((d) => (d.targetLinks.length === 0))
      .attr('class', 'node-text-start')
      .attr('x', -10);

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
  };
  const habilitarSelectores = () => {

      // Selector 1
      SELECTORES.categorias.forEach((v, k) => {
        $('select[name=categorias]').append(`<option value="${ k }">${ v[0] }</option>`);
      });

      // Selector 2
      SELECTORES.categorias[$('select[name=categorias]')[0].value][1].forEach((v, k) => {
        $('select[name=subcategorias]').append(`<option value="${ k }">${ v }</option>`);
      });

      // Selector 1 - change
      $('select[name=categorias]').on('change', (event) => {
        // Selector 2 - change
        $('select[name=subcategorias]').empty();

        SELECTORES.categorias[$('select[name=categorias]')[0].value][1].forEach((v, k) => {
          $('select[name=subcategorias]').append(`<option value="${ k }">${ v }</option>`);
        });
      });

      // SELECTOR AÑO
      for (let i = 2015; i > 1959; i--) { $('select[name=anio]').append(`<option value="${ i }">${ i }</option>`); }
      // SELECTOR AÑO - CHANGE
      $('select[name=anio]').on('change', (event) => {
        downloadFile($('select[name=anio]')[0].value).then(() => {
          $('#sankey').empty();
          dibujarSankey(width, height, { 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS });
        });
      });


  };

  downloadFile(2015).then(() => {

    INTRO.nodes.forEach((v, k) => { INTRO.nodes[k] = BUSCAR_NODO(v); });

    dibujarSankey(width, height, { 'nodes': GLOBAL_NODES, 'links': GLOBAL_LINKS });

    intro(0, 'create', 'next');

    habilitarSelectores();
  });
});
