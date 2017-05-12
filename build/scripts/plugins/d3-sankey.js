d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 30,
      size = [1, 1],
      nodes = [],
      links = [],
      sinksRight = true;

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };
  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };
  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };
  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };
  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };
  sankey.sinksRight = function (_) {
    if (!arguments.length) return sinksRight;
    sinksRight = _;
    return sankey;
 };
  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    return sankey;
  };
  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  // SVG path data generator, to be used as "d" attribute on "path" element selection.
  sankey.link = function() {
    var curvature = 0.75,
        formaLink;

    function link(d) {
      var xs  = d.source.x + d.source.dx,
          ys  = d.source.y + d.sy + d.dy / 2,
          xt  = d.target.x,
          yt  = d.target.y + d.ty + d.dy / 2,
          xi  = d3.interpolateNumber(xs, xt),
          xsc = xi(curvature),
          xtc = xi(1 - curvature),
          modificador_ancho = xt - xs - 10,
          modificador_alto = yt - ys;

      if (d.source.posicionX < d.target.posicionX) {
        if (d.target.id === 31) { formaLink = `m ${ xs } ${ ys } h 10 l 10 10`; } // Link de exportación
        if (d.target.id !== 31) { formaLink = `M ${ xs } ${ ys } C ${ xsc } ${ ys } ${ xtc } ${ yt } ${ xt } ${ yt }`; } // Link normal
      } else {
        if (d.source.id === 30) { formaLink = `m ${ xt - 20 } ${ yt - 10 } l 10 10 h 10`; } // Link de importación
        if (d.source.id !== 30) { formaLink = `M ${ xs } ${ ys } h 5 c 5 0 5 10 0 10 c ${ modificador_ancho * 1.5 } 0 ${ modificador_ancho * 1.5 } ${ (modificador_alto - 10) } ${ modificador_ancho } ${ (modificador_alto - 10) } h 5`; }
      }

      return formaLink;
    }

    link.curvature = function(_) {
      if (!arguments.length) { return curvature; }
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      // Links that have this node as source.
      node.sourceLinks = [];
      // Links that have this node as target.
      node.targetLinks = [];
    });
    links.forEach(function(link) {
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
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
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
        cantidadCol = 6;

    // Work from left to right.
    // Keep updating the breath (x-position) of nodes that are target of recently updated nodes.

    while (remainingNodes.length && x < nodes.length) {
      nextNodes = [];

      remainingNodes.forEach(function(node) {
        node.x = node.posicionX - 1;
        node.dx = nodeWidth;

        node.sourceLinks.forEach(function(link) {
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
    for (var n=nodes.length - 1; n >= 0; n--) {
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
    nodes.forEach(function(node) {
      if (!node.targetLinks.length) {
        node.x = d3.min(node.sourceLinks, function(d) { return d.target.x; }) - 1;
      }
    });
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  // Compute the depth (y-position) for each node.
  function computeNodeDepths(iterations) {
    // Group nodes by breath.
    var nodesByBreadth = d3.nest()
        .key(function(d) { return d.x; })
        .sortKeys(d3.ascending)
        .entries(nodes)
        .map(function(d) { return d.values; });

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
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
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
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
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
      nodesByBreadth.forEach(function(nodes) {
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
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingSourceDepth);
      node.targetLinks.sort(ascendingTargetDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(b, a) {
      if (a.target.id === 30 || b.target.id === 30) {
        return 1;
      } else {
        return a.dy - b.dy;
      }
    }

    function ascendingTargetDepth(a, b) {
      return a.target.posicionY - b.target.posicionY;
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
    var firstValue = first.posicionY,
        secondValue = second.posicionY;

    if (firstValue < secondValue) {
      return 1;
    } else if (firstValue > secondValue) {
      return -1;
    }

    return 0;
  }

  return sankey;
};
