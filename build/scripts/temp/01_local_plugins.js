"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
    var curvature = 0.75,
        formaLink;

    function link(d) {
      var xs = d.source.x + d.source.dx,
          ys = d.source.y + d.sy + d.dy / 2,
          xt = d.target.x,
          yt = d.target.y + d.ty + d.dy / 2,
          xi = d3.interpolateNumber(xs, xt),
          xsc = xi(curvature),
          xtc = xi(1 - curvature),
          modificador_ancho = xt - xs - 10,
          modificador_alto = yt - ys;

      if (d.source.posicionX < d.target.posicionX) {
        if (d.target.id === 31) {
          formaLink = "m " + xs + " " + ys + " h 10 l 10 10";
        } // Link de exportación
        if (d.target.id !== 31) {
          formaLink = "M " + xs + " " + ys + " C " + xsc + " " + ys + " " + xtc + " " + yt + " " + xt + " " + yt;
        } // Link normal
      } else {
        if (d.source.id === 30) {
          formaLink = "m " + (xt - 20) + " " + (yt - 10) + " l 10 10 h 10";
        } // Link de importación
        if (d.source.id !== 30) {
          formaLink = "M " + xs + " " + ys + " h 5 c 5 0 5 10 0 10 c " + modificador_ancho * 1.5 + " 0 " + modificador_ancho * 1.5 + " " + (modificador_alto - 10) + " " + modificador_ancho + " " + (modificador_alto - 10) + " h 5";
        }
      }

      return formaLink;
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
        cantidadCol = 6;

    // Work from left to right.
    // Keep updating the breath (x-position) of nodes that are target of recently updated nodes.

    while (remainingNodes.length && x < nodes.length) {
      nextNodes = [];

      remainingNodes.forEach(function (node) {
        node.x = node.posicionX - 1;
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
      node.sourceLinks.sort(ascendingSourceDepth);
      node.targetLinks.sort(ascendingTargetDepth);
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

(function (a) {
  (jQuery.browser = jQuery.browser || {}).mobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4));
})(navigator.userAgent || navigator.vendor || window.opera);

/*!
 * jquery.sumoselect - v3.0.3
 * http://hemantnegi.github.io/jquery.sumoselect
 */

!function (e) {
  "use strict";
  "function" == typeof define && define.amd ? define(["jquery"], e) : "undefined" != typeof exports ? module.exports = e(require("jquery")) : e(jQuery);
}(function (e) {
  "namespace sumo";
  e.fn.SumoSelect = function (t) {
    var l = e.extend({ placeholder: "Select Here", csvDispCount: 3, captionFormat: "{0} Selected", captionFormatAllSelected: "{0} all selected!", floatWidth: 400, forceCustomRendering: !1, nativeOnDevice: ["Android", "BlackBerry", "iPhone", "iPad", "iPod", "Opera Mini", "IEMobile", "Silk"], outputAsCSV: !1, csvSepChar: ",", okCancelInMulti: !1, isClickAwayOk: !1, triggerChangeCombined: !0, selectAll: !1, search: !1, searchText: "Search...", noMatch: 'No matches for "{0}"', prefix: "", locale: ["OK", "Cancel", "Select All"], up: !1, showTitle: !0 }, t),
        s = this.each(function () {
      var t = this;!this.sumo && e(this).is("select") && (this.sumo = { E: e(t), is_multi: e(t).attr("multiple"), select: "", caption: "", placeholder: "", optDiv: "", CaptionCont: "", ul: "", is_floating: !1, is_opened: !1, mob: !1, Pstate: [], createElems: function createElems() {
          var t = this;return t.E.wrap('<div class="SumoSelect" tabindex="0" role="button" aria-expanded="false">'), t.select = t.E.parent(), t.caption = e("<span>"), t.CaptionCont = e('<p class="CaptionCont SelectBox" ><label><i></i></label></p>').attr("style", t.E.attr("style")).prepend(t.caption), t.select.append(t.CaptionCont), t.is_multi || (l.okCancelInMulti = !1), t.E.attr("disabled") && t.select.addClass("disabled").removeAttr("tabindex"), l.outputAsCSV && t.is_multi && t.E.attr("name") && (t.select.append(e('<input class="HEMANT123" type="hidden" />').attr("name", t.E.attr("name")).val(t.getSelStr())), t.E.removeAttr("name")), t.isMobile() && !l.forceCustomRendering ? void t.setNativeMobile() : (t.E.attr("name") && t.select.addClass("sumo_" + t.E.attr("name").replace(/\[\]/, "")), t.E.addClass("SumoUnder").attr("tabindex", "-1"), t.optDiv = e('<div class="optWrapper ' + (l.up ? "up" : "") + '">'), t.floatingList(), t.ul = e('<ul class="options">'), t.optDiv.append(t.ul), l.selectAll && t.is_multi && t.SelAll(), l.search && t.Search(), t.ul.append(t.prepItems(t.E.children())), t.is_multi && t.multiSelelect(), t.select.append(t.optDiv), t.basicEvents(), void t.selAllState());
        }, prepItems: function prepItems(t, l) {
          var i = [],
              s = this;return e(t).each(function (t, n) {
            n = e(n), i.push(n.is("optgroup") ? e('<li class="group ' + (n[0].disabled ? "disabled" : "") + '"><label>' + n.attr("label") + "</label><ul></ul></li>").find("ul").append(s.prepItems(n.children(), n[0].disabled)).end() : s.createLi(n, l));
          }), i;
        }, createLi: function createLi(t, l) {
          var i = this;t.attr("value") || t.attr("value", t.val());var s = e('<li class="opt"><label>' + t.text() + "</label></li>");return s.data("opt", t), t.data("li", s), i.is_multi && s.prepend("<span><i></i></span>"), (t[0].disabled || l) && (s = s.addClass("disabled")), i.onOptClick(s), t[0].selected && s.addClass("selected"), t.attr("class") && s.addClass(t.attr("class")), t.attr("title") && s.attr("title", t.attr("title")), s;
        }, getSelStr: function getSelStr() {
          return sopt = [], this.E.find("option:selected").each(function () {
            sopt.push(e(this).val());
          }), sopt.join(l.csvSepChar);
        }, multiSelelect: function multiSelelect() {
          var t = this;t.optDiv.addClass("multiple"), t.okbtn = e('<p tabindex="0" class="btnOk">' + l.locale[0] + "</p>").click(function () {
            t._okbtn(), t.hideOpts();
          }), t.cancelBtn = e('<p tabindex="0" class="btnCancel">' + l.locale[1] + "</p>").click(function () {
            t._cnbtn(), t.hideOpts();
          });var i = t.okbtn.add(t.cancelBtn);t.optDiv.append(e('<div class="MultiControls">').append(i)), i.on("keydown.sumo", function (l) {
            var i = e(this);switch (l.which) {case 32:case 13:
                i.trigger("click");break;case 9:
                if (i.hasClass("btnOk")) return;case 27:
                return t._cnbtn(), void t.hideOpts();}l.stopPropagation(), l.preventDefault();
          });
        }, _okbtn: function _okbtn() {
          var e = this,
              t = 0;l.triggerChangeCombined && (e.E.find("option:selected").length != e.Pstate.length ? t = 1 : e.E.find("option").each(function (l, i) {
            i.selected && e.Pstate.indexOf(l) < 0 && (t = 1);
          }), t && (e.callChange(), e.setText()));
        }, _cnbtn: function _cnbtn() {
          var e = this;e.E.find("option:selected").each(function () {
            this.selected = !1;
          }), e.optDiv.find("li.selected").removeClass("selected");for (var t = 0; t < e.Pstate.length; t++) {
            e.E.find("option")[e.Pstate[t]].selected = !0, e.ul.find("li.opt").eq(e.Pstate[t]).addClass("selected");
          }e.selAllState();
        }, SelAll: function SelAll() {
          var t = this;t.is_multi && (t.selAll = e('<p class="select-all"><span><i></i></span><label>' + l.locale[2] + "</label></p>"), t.optDiv.addClass("selall"), t.selAll.on("click", function () {
            t.selAll.toggleClass("selected"), t.toggSelAll(t.selAll.hasClass("selected"), 1);
          }), t.optDiv.prepend(t.selAll));
        }, Search: function Search() {
          var t = this,
              i = t.CaptionCont.addClass("search"),
              s = e('<p class="no-match">');t.ftxt = e('<input type="text" class="search-txt" value="" placeholder="' + l.searchText + '">').on("click", function (e) {
            e.stopPropagation();
          }), i.append(t.ftxt), t.optDiv.children("ul").after(s), t.ftxt.on("keyup.sumo", function () {
            var i = t.optDiv.find("ul.options li.opt").each(function (l, i) {
              var i = e(i),
                  s = i.data("opt")[0];s.hidden = i.text().toLowerCase().indexOf(t.ftxt.val().toLowerCase()) < 0, i.toggleClass("hidden", s.hidden);
            }).not(".hidden");s.html(l.noMatch.replace(/\{0\}/g, "<em></em>")).toggle(!i.length), s.find("em").text(t.ftxt.val()), t.selAllState();
          });
        }, selAllState: function selAllState() {
          var t = this;if (l.selectAll && t.is_multi) {
            var i = 0,
                s = 0;t.optDiv.find("li.opt").not(".hidden").each(function (t, l) {
              e(l).hasClass("selected") && i++, e(l).hasClass("disabled") || s++;
            }), i == s ? t.selAll.removeClass("partial").addClass("selected") : 0 == i ? t.selAll.removeClass("selected partial") : t.selAll.addClass("partial");
          }
        }, showOpts: function showOpts() {
          var t = this;t.E.attr("disabled") || (t.E.trigger("sumo:opening", t), t.is_opened = !0, t.select.addClass("open").attr("aria-expanded", "true"), t.E.trigger("sumo:opened", t), t.ftxt ? t.ftxt.focus() : t.select.focus(), e(document).on("click.sumo", function (e) {
            if (!t.select.is(e.target) && 0 === t.select.has(e.target).length) {
              if (!t.is_opened) return;t.hideOpts(), l.okCancelInMulti && (l.isClickAwayOk ? t._okbtn() : t._cnbtn());
            }
          }), t.is_floating && (H = t.optDiv.children("ul").outerHeight() + 2, t.is_multi && (H += parseInt(t.optDiv.css("padding-bottom"))), t.optDiv.css("height", H), e("body").addClass("sumoStopScroll")), t.setPstate());
        }, setPstate: function setPstate() {
          var e = this;e.is_multi && (e.is_floating || l.okCancelInMulti) && (e.Pstate = [], e.E.find("option").each(function (t, l) {
            l.selected && e.Pstate.push(t);
          }));
        }, callChange: function callChange() {
          this.E.trigger("change").trigger("click");
        }, hideOpts: function hideOpts() {
          var t = this;t.is_opened && (t.E.trigger("sumo:closing", t), t.is_opened = !1, t.select.removeClass("open").attr("aria-expanded", "true").find("ul li.sel").removeClass("sel"), t.E.trigger("sumo:closed", t), e(document).off("click.sumo"), t.select.focus(), e("body").removeClass("sumoStopScroll"), l.search && (t.ftxt.val(""), t.ftxt.trigger("keyup.sumo")));
        }, setOnOpen: function setOnOpen() {
          var e = this,
              t = e.optDiv.find("li.opt:not(.hidden)").eq(l.search ? 0 : e.E[0].selectedIndex);t.hasClass("disabled") && (t = t.next(":not(disabled)"), !t.length) || (e.optDiv.find("li.sel").removeClass("sel"), t.addClass("sel"), e.showOpts());
        }, nav: function nav(e) {
          var t,
              l = this,
              i = l.ul.find("li.opt:not(.disabled, .hidden)"),
              s = l.ul.find("li.opt.sel:not(.hidden)"),
              n = i.index(s);if (l.is_opened && s.length) {
            if (e && n > 0) t = i.eq(n - 1);else {
              if (!(!e && n < i.length - 1 && n > -1)) return;t = i.eq(n + 1);
            }s.removeClass("sel"), s = t.addClass("sel");var a = l.ul,
                o = a.scrollTop(),
                c = s.position().top + o;c >= o + a.height() - s.outerHeight() && a.scrollTop(c - a.height() + s.outerHeight()), o > c && a.scrollTop(c);
          } else l.setOnOpen();
        }, basicEvents: function basicEvents() {
          var t = this;t.CaptionCont.click(function (e) {
            t.E.trigger("click"), t.is_opened ? t.hideOpts() : t.showOpts(), e.stopPropagation();
          }), t.select.on("keydown.sumo", function (e) {
            switch (e.which) {case 38:
                t.nav(!0);break;case 40:
                t.nav(!1);break;case 65:
                if (t.is_multi && e.ctrlKey) {
                  t.toggSelAll(!e.shiftKey, 1);break;
                }return;case 32:
                if (l.search && t.ftxt.is(e.target)) return;case 13:
                t.is_opened ? t.optDiv.find("ul li.sel").trigger("click") : t.setOnOpen();break;case 9:
                return void (l.okCancelInMulti || t.hideOpts());case 27:
                return l.okCancelInMulti && t._cnbtn(), void t.hideOpts();default:
                return;}e.preventDefault();
          }), e(window).on("resize.sumo", function () {
            t.floatingList();
          });
        }, onOptClick: function onOptClick(t) {
          var i = this;t.click(function () {
            var t = e(this);if (!t.hasClass("disabled")) {
              i.is_multi ? (t.toggleClass("selected"), t.data("opt")[0].selected = t.hasClass("selected"), i.selAllState()) : (t.parent().find("li.selected").removeClass("selected"), t.toggleClass("selected"), t.data("opt")[0].selected = !0), i.is_multi && l.triggerChangeCombined && (i.is_floating || l.okCancelInMulti) || (i.setText(), i.callChange()), i.is_multi || i.hideOpts();
            }
          });
        }, setText: function setText() {
          var t = this;if (t.placeholder = "", t.is_multi) {
            for (sels = t.E.find(":selected").not(":disabled"), i = 0; i < sels.length; i++) {
              if (i + 1 >= l.csvDispCount && l.csvDispCount) {
                sels.length == t.E.find("option").length && l.captionFormatAllSelected ? t.placeholder = l.captionFormatAllSelected.replace(/\{0\}/g, sels.length) + "," : t.placeholder = l.captionFormat.replace(/\{0\}/g, sels.length) + ",";break;
              }t.placeholder += e(sels[i]).text() + ", ";
            }t.placeholder = t.placeholder.replace(/,([^,]*)$/, "$1");
          } else t.placeholder = t.E.find(":selected").not(":disabled").text();var s = !1;t.placeholder || (s = !0, t.placeholder = t.E.attr("placeholder"), t.placeholder || (t.placeholder = t.E.find("option:disabled:selected").text())), t.placeholder = t.placeholder ? l.prefix + " " + t.placeholder : l.placeholder, t.caption.html(t.placeholder), l.showTitle && t.CaptionCont.attr("title", t.placeholder);var n = t.select.find("input.HEMANT123");return n.length && n.val(t.getSelStr()), s ? t.caption.addClass("placeholder") : t.caption.removeClass("placeholder"), t.placeholder;
        }, isMobile: function isMobile() {
          for (var e = navigator.userAgent || navigator.vendor || window.opera, t = 0; t < l.nativeOnDevice.length; t++) {
            if (e.toString().toLowerCase().indexOf(l.nativeOnDevice[t].toLowerCase()) > 0) return l.nativeOnDevice[t];
          }return !1;
        }, setNativeMobile: function setNativeMobile() {
          var e = this;e.E.addClass("SelectClass"), e.mob = !0, e.E.change(function () {
            e.setText();
          });
        }, floatingList: function floatingList() {
          var t = this;t.is_floating = e(window).width() <= l.floatWidth, t.optDiv.toggleClass("isFloating", t.is_floating), t.is_floating || t.optDiv.css("height", ""), t.optDiv.toggleClass("okCancelInMulti", l.okCancelInMulti && !t.is_floating);
        }, vRange: function vRange(e) {
          var t = this,
              l = t.E.find("option");if (l.length <= e || 0 > e) throw "index out of bounds";return t;
        }, toggSel: function toggSel(t, l) {
          var i,
              s = this;"number" == typeof l ? (s.vRange(l), i = s.E.find("option")[l]) : i = s.E.find('option[value="' + l + '"]')[0] || 0, i && !i.disabled && i.selected != t && (i.selected = t, s.mob || e(i).data("li").toggleClass("selected", t), s.callChange(), s.setPstate(), s.setText(), s.selAllState());
        }, toggDis: function toggDis(e, t) {
          var l = this.vRange(t);l.E.find("option")[t].disabled = e, e && (l.E.find("option")[t].selected = !1), l.mob || l.optDiv.find("ul.options li").eq(t).toggleClass("disabled", e).removeClass("selected"), l.setText();
        }, toggSumo: function toggSumo(e) {
          var t = this;return t.enabled = e, t.select.toggleClass("disabled", e), e ? (t.E.attr("disabled", "disabled"), t.select.removeAttr("tabindex")) : (t.E.removeAttr("disabled"), t.select.attr("tabindex", "0")), t;
        }, toggSelAll: function toggSelAll(t, l) {
          var i = this;i.E.find("option:not(:disabled,:hidden)").each(function (l, i) {
            var s = i.selected,
                i = e(i).data("li");i.hasClass("hidden") || (t ? s || i.trigger("click") : s && i.trigger("click"));
          }), l || (!i.mob && i.selAll && i.selAll.removeClass("partial").toggleClass("selected", !!t), i.callChange(), i.setText(), i.setPstate());
        }, reload: function reload() {
          var t = this.unload();return e(t).SumoSelect(l);
        }, unload: function unload() {
          var e = this;return e.select.before(e.E), e.E.show(), l.outputAsCSV && e.is_multi && e.select.find("input.HEMANT123").length && e.E.attr("name", e.select.find("input.HEMANT123").attr("name")), e.select.remove(), delete t.sumo, t;
        }, add: function add(l, i, s) {
          if ("undefined" == typeof l) throw "No value to add";var n = this;if (opts = n.E.find("option"), "number" == typeof i && (s = i, i = l), "undefined" == typeof i && (i = l), opt = e("<option></option>").val(l).html(i), opts.length < s) throw "index out of bounds";return "undefined" == typeof s || opts.length == s ? (n.E.append(opt), n.mob || n.ul.append(n.createLi(opt))) : (opts.eq(s).before(opt), n.mob || n.ul.find("li.opt").eq(s).before(n.createLi(opt))), t;
        }, remove: function remove(e) {
          var t = this.vRange(e);t.E.find("option").eq(e).remove(), t.mob || t.optDiv.find("ul.options li").eq(e).remove(), t.setText();
        }, selectItem: function selectItem(e) {
          this.toggSel(!0, e);
        }, unSelectItem: function unSelectItem(e) {
          this.toggSel(!1, e);
        }, selectAll: function selectAll() {
          this.toggSelAll(!0);
        }, unSelectAll: function unSelectAll() {
          this.toggSelAll(!1);
        }, disableItem: function disableItem(e) {
          this.toggDis(!0, e);
        }, enableItem: function enableItem(e) {
          this.toggDis(!1, e);
        }, enabled: !0, enable: function enable() {
          return this.toggSumo(!1);
        }, disable: function disable() {
          return this.toggSumo(!0);
        }, init: function init() {
          var e = this;return e.createElems(), e.setText(), e;
        } }, t.sumo.init());
    });return 1 == s.length ? s[0] : s;
  };
});
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
var randomString = function randomString(quantity) {
  var text = '',
      possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var _i2 = 0; _i2 < quantity; _i2++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};
// Check 05.07.2017 - Sobreescribe los atributos de un objeto en otro
var mergeStructure = function mergeStructure(target, source) {
  return {
    settings: jQuery.extend(target.settings, source.settings),
    attr: source.hasOwnProperty('attr') ? source.attr : {},
    styles: jQuery.extend(target.styles, source.styles),
    childrens: source.hasOwnProperty('childrens') ? source.childrens : []
  };
};
// Check 05.07.2017 - Inyecta los estilos de un componente
var injectStyles = function injectStyles(component, styles) {

  for (var style in styles) {
    component.style[style] = styles[style];
  }

  return true;
};
// Check 05.07.2017 - Inyecta los atributos de un componente
var injectAttributes = function injectAttributes(component, attributes) {

  for (var attr in attributes) {
    if (attr === 'class') {
      attributes[attr].split(' ').forEach(function (className) {
        component.classList.add(className);
      });
    } else {
      component.setAttribute(attr, attributes[attr]);
    }
  }

  return true;
};
// Check 05.07.2017 - Inyecta los componentes hijos de un componente
var injectChildrens = function injectChildrens(component, childrens) {
  childrens.forEach(function (children) {
    component.appendChild(children);
  });

  return true;
};
// Check 05.07.2017 - Muesta el componente cuando el mouse esta dentro del modulo
var buttonShareShow = function buttonShareShow(component) {
  component.querySelector('.modalShare').style.opacity = 1;

  return true;
};
// Check 05.07.2017 - Oculta el componente cuando el mouse esta fuera del modulo
var buttonShareHide = function buttonShareHide(component) {
  component.querySelector('.modalShare').style.opacity = '';
  component.querySelector('.modalShare input').checked = false;

  return true;
};
// Check 05.07.2017 - Comparte en redes sociales un modulo especifico
var share = function share(social, elemento) {
  var node = elemento.parentNode.parentNode.parentNode,
      nroModule = node.getAttribute('module-nro'),
      date = new Date();

  // Generar imagen Uint8Array
  var w = node.offsetWidth,
      h = node.offsetHeight,
      imageW = void 0,
      imageH = void 0;

  if (w > h) {
    imageW = 2400;
    imageH = imageW / w * h;
  } else {
    imageH = 1260;
    imageW = imageH / h * w;
  }

  domtoimage.toBlob(node).then(function (file) {
    // domtoimage.toBlob(node, {height: imageH, width: imageW}).then((file) => {
    
    firebaseStorage.child("module_" + nroModule + "_" + randomString(10) + "_" + date.getTime()).put(file).then(function (snapshot) {
      var url = snapshot.metadata.downloadURLs[0];

      switch (social) {
        case 'facebook':
          window.open("https://www.facebook.com/sharer.php?u=https://datosgobar.github.io/GDE&picture=" + url, 'pop', 'width=600, height=260, scrollbars=no');break;
        case 'twitter':
          window.open("https://twitter.com/share?save.snapshot.downloadURL=https://datosgobar.github.io/GDE&image=" + url);break;
      }
    });
  });
};
// Check 05.07.2017 - Muesta el contenedor para embeber el modulo
var embebedContainerShow = function embebedContainerShow(component) {
  component.parentNode.parentNode.parentNode.querySelector('.embebedContainer').style.opacity = '';
  component.parentNode.parentNode.parentNode.querySelector('.embebedContainer').style.visibility = '';

  return true;
};
// Check 05.07.2017 - Oculta el contenedor para embeber el modulo
var embebedContainerHide = function embebedContainerHide(component) {
  component.parentNode.style.opacity = 0;
  component.parentNode.style.visibility = 'hidden';

  return true;
};
// Check 05.07.2017 - Guarda en el portapapeles el texto de un elemento
var copyText = function copyText(elemento) {
  var copy = elemento.parentNode.querySelector('input').select();

  window.document.execCommand('copy');

  return true;
};

// Componente Modal
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var Modal = {
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
    simple: function simple(structureParams) {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          share: false,
          embebed: false,
          theme: 'dark',
          transform: 'mod-col-col',
          quantity: 1
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        seccion: { html: 'section', class: 'modalContainer' },
        default: { html: 'section', class: 'modalContainer' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
      component.setAttribute('module-nro', Modal.variables.counts.modulos);
      // Se crea contenedor responsive
      var responsive = Modal.module.responsive({
        settings: {
          transform: structure.settings.transform,
          quantity: structure.settings.quantity
        }
      });
      // Se crea boton para compartir el modulo
      if (structure.settings.share) {
        var _share = Modal.module.share({
          settings: {
            theme: structure.settings.theme,
            embebed: structure.settings.embebed
          }
        });

        component.setAttribute('onmouseenter', 'buttonShareShow(this)');
        component.setAttribute('onmouseleave', 'buttonShareHide(this)');
        responsive.appendChild(_share);

        if (structure.settings.embebed) {
          var iframe = window.document.createElement('iframe');
          iframe.setAttribute('src', window.location.origin + "?seccion=" + Modal.variables.counts.modulos);
          iframe.setAttribute('width', '100%');
          iframe.setAttribute('height', '400px');
          var background = window.document.createElement('div');
          background.classList.add('embebedContainer');
          background.style.opacity = 0;
          background.style.visibility = 'hidden';
          var exit = window.document.createElement('span');
          exit.classList.add('embebedExit');
          exit.setAttribute('onclick', 'embebedContainerHide(this)');
          exit.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
          var input = window.document.createElement('input');
          input.setAttribute('value', iframe.outerHTML);
          var button = Modal.add.button({
            settings: { type: 'squareBig', text: '<i class="fa fa-clone" aria-hidden="true"></i><span style="margin-left: 10px;">Copiar</span>' },
            attr: { onclick: 'copyText(this)' },
            styles: { backgroundColor: Modal.variables.colors.gobar_ligth, color: 'white', margin: '0px 0px 0px 10px' }
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
    responsive: function responsive(structureParams) {
      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          transform: 'mod-col-col',
          quantity: 1
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'div', class: 'modalResponsive' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
      component.classList.add(structure.settings.transform);
      component.classList.add("child-" + structure.settings.quantity);

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
    share: function share(structureParams) {
      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          theme: 'dark',
          embebed: false
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'div', class: 'modalShare' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
      // Se crea input-checkbox para manejar el estado del componente
      var input = window.document.createElement('input');
      input.setAttribute('id', "share-" + Modal.variables.counts.modulos);
      input.setAttribute('type', 'checkbox');
      input.classList.add('share-open');
      // Se crea boton hamburguesa
      var label = window.document.createElement('label');
      label.setAttribute('for', "share-" + Modal.variables.counts.modulos);
      label.classList.add("share-open-button");
      label.classList.add("hamburger-" + structure.settings.theme);
      // Se generan las 3 lineas del boton hamburguesa
      for (var _i3 = 1; _i3 < 4; _i3++) {
        var span = window.document.createElement('span');
        span.classList.add("hamburger-" + _i3);

        label.appendChild(span);
      }
      // Se crean botones para embeber codigo y compartir en redes sociales
      var embebedButton = Modal.add.button({
        settings: { type: 'circleSmall', text: '<i class="fa fa-code" aria-hidden="true"></i>' },
        attr: { class: 'share-item buttonEmbebed', title: 'Embeber sección', onclick: 'embebedContainerShow(this)' },
        styles: { backgroundColor: 'black', color: 'white', right: '0px' }
      });
      var facebookButton = Modal.add.button({
        settings: { type: 'circleSmall', text: '<i class="fa fa-twitter" aria-hidden="true"></i>' },
        attr: { class: 'share-item', title: 'Compartir en Twitter', onclick: 'share("twitter", this)' },
        styles: { backgroundColor: '#1DA1F2', color: 'white', right: '0px' }
      });
      var twitterButton = Modal.add.button({
        settings: { type: 'circleSmall', text: '<i class="fa fa-facebook" aria-hidden="true"></i>' },
        attr: { class: 'share-item', title: 'Compartir en Facebook', onclick: 'share("facebook", this)' },
        styles: { backgroundColor: '#3B5998', color: 'white', right: '0px' }
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
    button: function button(structureParams) {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          text: 'Button'
        }, styles: { backgroundColor: Modal.variables.colors.gobar_dark, color: 'white' }
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'button', class: 'button buttonRound', classEfect: 'buttonBig boton_efecto' },
        roundBig: { html: 'button', class: 'button buttonRound', classEfect: 'buttonBig boton_efecto' },
        roundSmall: { html: 'button', class: 'button buttonRound', classEfect: 'buttonSmall boton_efecto' },
        squareBig: { html: 'button', class: 'button buttonSquare', classEfect: 'buttonBig boton_efecto' },
        squareSmall: { html: 'button', class: 'button buttonSquare', classEfect: 'buttonSmall boton_efecto' },
        circleBig: { html: 'button', class: 'button buttonCircle', classEfect: 'buttonCircleBig boton_efecto' },
        circleSmall: { html: 'button', class: 'button buttonCircle', classEfect: 'buttonCircleSmall boton_efecto' }
      };
      var effectOptions = {
        default: { html: 'span', class: 'buttonBig boton_efecto' },
        roundBig: { html: 'span', class: 'buttonBig boton_efecto' },
        roundSmall: { html: 'span', class: 'buttonSmall boton_efecto' },
        squareBig: { html: 'span', class: 'buttonBig boton_efecto' },
        squareSmall: { html: 'span', class: 'buttonSmall boton_efecto' },
        circleBig: { html: 'span', class: 'buttonCircleBig boton_efecto' },
        circleSmall: { html: 'span', class: 'buttonCircleSmall boton_efecto' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];
      var effectOption = effectOptions[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
      // Se crea mascara para iluminar el boton
      var lightEffect = window.document.createElement('span');
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
    title: function title(structureParams) {
      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          text: 'Titulo'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'h2', class: 'title' },
        title1: { html: 'h1', class: 'title' },
        title2: { html: 'h2', class: 'title' },
        title3: { html: 'h3', class: 'title' },
        title4: { html: 'h4', class: 'title' },
        title5: { html: 'h5', class: 'title' },
        title6: { html: 'h6', class: 'title' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
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
    paragraph: function paragraph(structureParams) {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'p', class: 'paragraph' },
        small: { html: 'p', class: 'paragraph pSmall' },
        normal: { html: 'p', class: 'paragraph' },
        big: { html: 'p', class: 'paragraph pBig' },
        flywheel: { html: 'p', class: 'paragraph pFly' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
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
    space: function space(structureParams) {
      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          quantity: 1
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'div', class: 'breakLine' },
        allways: { html: 'div', class: 'breakLine' },
        onlyWeb: { html: 'div', class: 'breakLine onlyWeb' },
        onlyMobile: { html: 'div', class: 'breakLine onlyMobile' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);

      // Se insertan la cantidad de hr definida por el componente
      for (var _i4 = 0; _i4 < structure.settings.quantity; _i4++) {
        var breakLine = window.document.createElement('hr');

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
    increment: function increment(structureParams) {
      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          start: 0,
          end: 1000,
          format: '(.ddd)'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'div', class: 'increment incrMedium odometer' },
        small: { html: 'div', class: 'increment incrSmall odometer' },
        normal: { html: 'div', class: 'increment incrMedium odometer' },
        big: { html: 'div', class: 'increment incrBig odometer' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
      // Se configura odometer
      var odometer = new Odometer({
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
    subContainer: function subContainer(structureParams) {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'div', class: 'subContainer' },
        div: { html: 'div', class: 'subContainer' },
        footer: { html: 'footer', class: 'subContainer' },
        header: { html: 'header', class: 'subContainer' },
        section: { html: 'section', class: 'subContainer' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);

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
    image: function image(structureParams) {
      // disable children

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          width: '200px',
          height: '200px'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'img', class: 'image' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
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
    link: function link(structureParams) {

      // Preparación de parametros
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Parametros por defecto del componente
      var structureDefault = {
        settings: {
          type: 'default',
          text: 'Esto es un enlace.'
        }, styles: {}
      };
      // Mezclar estructura por defecto con estructura recibida por parametro
      var structure = mergeStructure(structureDefault, structureParams);
      // Opciones predeterminadas
      var options = {
        default: { html: 'a', class: 'link' },
        link: { html: 'a', class: 'link link-inline' },
        block: { html: 'a', class: 'link link-block' }
      };
      // Se selecciona una opcion
      var option = options[structure.settings.type];

      // Creación del componente
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////

      // Se crea componente
      var component = window.document.createElement(option.html);
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
        horizontal: function horizontal(data) {
          var contenedor = void 0;

          contenedor = window.document.createElement('svg');
          contenedor.setAttribute('id', data.parametros.id);

          return contenedor;
        }
      },
      torta: function torta(data) {
        var contenedor = void 0,
            svg = void 0,
            arc = void 0,
            angulo = Math.PI / 180,
            dataset = void 0,
            arco = void 0,
            path = void 0,
            width = 280,
            height = 280,
            texto_contenedor = void 0,
            texto = void 0;

        contenedor = window.document.createElement('div');
        contenedor.classList.add('grafico_torta');
        contenedor.style.width = width + "px";
        contenedor.style.height = height + "px";

        dataset = data.dataset;

        svg = d3.select(contenedor).append('svg').attr('width', width).attr('height', height);

        arc = d3.arc().innerRadius(width / 2 - 25).outerRadius(width / 2).startAngle(0).endAngle(360 * angulo);

        arco = svg.selectAll('.arco').data(dataset).enter();

        arco.append('g').attr('transform', "translate(" + width / 2 + ", " + height / 2 + ")").append('path').attr('class', 'arco_fondo').attr('d', arc);

        arc.endAngle(function (d) {
          return d.value * angulo;
        });

        path = arco.append('g').attr('transform', "translate(" + width / 2 + ", " + height / 2 + ")").append('path').attr('class', 'arco');

        var arcTween = function arcTween(b) {
          var i = d3.interpolate({ value: b.previous }, b);
          return function (t) {
            return arc(i(t));
          };
        };
        var update = function update() {
          arco.each(function (d) {
            d.previous = d.value, d.value = d.change;
          });
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
      modelo: function modelo() {
        var contenedor = window.document.createElement('div');
        contenedor.classList.add('modelo_grafico');

        return contenedor;
      }
    }
  }
};

/*! nanoScrollerJS - v0.8.7 - 2015
* http://jamesflorentino.github.com/nanoScrollerJS/
* Copyright (c) 2015 James Florentino; Licensed MIT */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    return define(['jquery'], function ($) {
      return factory($, window, document);
    });
  } else if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === 'object') {
    return module.exports = factory(require('jquery'), window, document);
  } else {
    return factory(jQuery, window, document);
  }
})(function ($, window, document) {
  "use strict";

  var BROWSER_IS_IE7, BROWSER_SCROLLBAR_WIDTH, DOMSCROLL, DOWN, DRAG, ENTER, KEYDOWN, KEYUP, MOUSEDOWN, MOUSEENTER, MOUSEMOVE, MOUSEUP, MOUSEWHEEL, NanoScroll, PANEDOWN, RESIZE, SCROLL, SCROLLBAR, TOUCHMOVE, UP, WHEEL, cAF, defaults, getBrowserScrollbarWidth, hasTransform, isFFWithBuggyScrollbar, rAF, transform, _elementStyle, _prefixStyle, _vendor;
  defaults = {

    /**
      a classname for the pane element.
      @property paneClass
      @type String
      @default 'nano-pane'
     */
    paneClass: 'nano-pane',

    /**
      a classname for the slider element.
      @property sliderClass
      @type String
      @default 'nano-slider'
     */
    sliderClass: 'nano-slider',

    /**
      a classname for the content element.
      @property contentClass
      @type String
      @default 'nano-content'
     */
    contentClass: 'nano-content',

    /**
      a classname for enabled mode
      @property enabledClass
      @type String
      @default 'has-scrollbar'
     */
    enabledClass: 'has-scrollbar',

    /**
      a classname for flashed mode
      @property flashedClass
      @type String
      @default 'flashed'
     */
    flashedClass: 'flashed',

    /**
      a classname for active mode
      @property activeClass
      @type String
      @default 'active'
     */
    activeClass: 'active',

    /**
      a setting to enable native scrolling in iOS devices.
      @property iOSNativeScrolling
      @type Boolean
      @default false
     */
    iOSNativeScrolling: false,

    /**
      a setting to prevent the rest of the page being
      scrolled when user scrolls the `.content` element.
      @property preventPageScrolling
      @type Boolean
      @default false
     */
    preventPageScrolling: false,

    /**
      a setting to disable binding to the resize event.
      @property disableResize
      @type Boolean
      @default false
     */
    disableResize: false,

    /**
      a setting to make the scrollbar always visible.
      @property alwaysVisible
      @type Boolean
      @default false
     */
    alwaysVisible: false,

    /**
      a default timeout for the `flash()` method.
      @property flashDelay
      @type Number
      @default 1500
     */
    flashDelay: 1500,

    /**
      a minimum height for the `.slider` element.
      @property sliderMinHeight
      @type Number
      @default 20
     */
    sliderMinHeight: 20,

    /**
      a maximum height for the `.slider` element.
      @property sliderMaxHeight
      @type Number
      @default null
     */
    sliderMaxHeight: null,

    /**
      an alternate document context.
      @property documentContext
      @type Document
      @default null
     */
    documentContext: null,

    /**
      an alternate window context.
      @property windowContext
      @type Window
      @default null
     */
    windowContext: null
  };

  /**
    @property SCROLLBAR
    @type String
    @static
    @final
    @private
   */
  SCROLLBAR = 'scrollbar';

  /**
    @property SCROLL
    @type String
    @static
    @final
    @private
   */
  SCROLL = 'scroll';

  /**
    @property MOUSEDOWN
    @type String
    @final
    @private
   */
  MOUSEDOWN = 'mousedown';

  /**
    @property MOUSEENTER
    @type String
    @final
    @private
   */
  MOUSEENTER = 'mouseenter';

  /**
    @property MOUSEMOVE
    @type String
    @static
    @final
    @private
   */
  MOUSEMOVE = 'mousemove';

  /**
    @property MOUSEWHEEL
    @type String
    @final
    @private
   */
  MOUSEWHEEL = 'mousewheel';

  /**
    @property MOUSEUP
    @type String
    @static
    @final
    @private
   */
  MOUSEUP = 'mouseup';

  /**
    @property RESIZE
    @type String
    @final
    @private
   */
  RESIZE = 'resize';

  /**
    @property DRAG
    @type String
    @static
    @final
    @private
   */
  DRAG = 'drag';

  /**
    @property ENTER
    @type String
    @static
    @final
    @private
   */
  ENTER = 'enter';

  /**
    @property UP
    @type String
    @static
    @final
    @private
   */
  UP = 'up';

  /**
    @property PANEDOWN
    @type String
    @static
    @final
    @private
   */
  PANEDOWN = 'panedown';

  /**
    @property DOMSCROLL
    @type String
    @static
    @final
    @private
   */
  DOMSCROLL = 'DOMMouseScroll';

  /**
    @property DOWN
    @type String
    @static
    @final
    @private
   */
  DOWN = 'down';

  /**
    @property WHEEL
    @type String
    @static
    @final
    @private
   */
  WHEEL = 'wheel';

  /**
    @property KEYDOWN
    @type String
    @static
    @final
    @private
   */
  KEYDOWN = 'keydown';

  /**
    @property KEYUP
    @type String
    @static
    @final
    @private
   */
  KEYUP = 'keyup';

  /**
    @property TOUCHMOVE
    @type String
    @static
    @final
    @private
   */
  TOUCHMOVE = 'touchmove';

  /**
    @property BROWSER_IS_IE7
    @type Boolean
    @static
    @final
    @private
   */
  BROWSER_IS_IE7 = window.navigator.appName === 'Microsoft Internet Explorer' && /msie 7./i.test(window.navigator.appVersion) && window.ActiveXObject;

  /**
    @property BROWSER_SCROLLBAR_WIDTH
    @type Number
    @static
    @default null
    @private
   */
  BROWSER_SCROLLBAR_WIDTH = null;
  rAF = window.requestAnimationFrame;
  cAF = window.cancelAnimationFrame;
  _elementStyle = document.createElement('div').style;
  _vendor = function () {
    var i, transform, vendor, vendors, _i, _len;
    vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'];
    for (i = _i = 0, _len = vendors.length; _i < _len; i = ++_i) {
      vendor = vendors[i];
      transform = vendors[i] + 'ransform';
      if (transform in _elementStyle) {
        return vendors[i].substr(0, vendors[i].length - 1);
      }
    }
    return false;
  }();
  _prefixStyle = function _prefixStyle(style) {
    if (_vendor === false) {
      return false;
    }
    if (_vendor === '') {
      return style;
    }
    return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
  };
  transform = _prefixStyle('transform');
  hasTransform = transform !== false;

  /**
    Returns browser's native scrollbar width
    @method getBrowserScrollbarWidth
    @return {Number} the scrollbar width in pixels
    @static
    @private
   */
  getBrowserScrollbarWidth = function getBrowserScrollbarWidth() {
    var outer, outerStyle, scrollbarWidth;
    outer = document.createElement('div');
    outerStyle = outer.style;
    outerStyle.position = 'absolute';
    outerStyle.width = '100px';
    outerStyle.height = '100px';
    outerStyle.overflow = SCROLL;
    outerStyle.top = '-9999px';
    document.body.appendChild(outer);
    scrollbarWidth = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
    return scrollbarWidth;
  };
  isFFWithBuggyScrollbar = function isFFWithBuggyScrollbar() {
    var isOSXFF, ua, version;
    ua = window.navigator.userAgent;
    isOSXFF = /(?=.+Mac OS X)(?=.+Firefox)/.test(ua);
    if (!isOSXFF) {
      return false;
    }
    version = /Firefox\/\d{2}\./.exec(ua);
    if (version) {
      version = version[0].replace(/\D+/g, '');
    }
    return isOSXFF && +version > 23;
  };

  /**
    @class NanoScroll
    @param element {HTMLElement|Node} the main element
    @param options {Object} nanoScroller's options
    @constructor
   */
  NanoScroll = function () {
    function NanoScroll(el, options) {
      this.el = el;
      this.options = options;
      BROWSER_SCROLLBAR_WIDTH || (BROWSER_SCROLLBAR_WIDTH = getBrowserScrollbarWidth());
      this.$el = $(this.el);
      this.doc = $(this.options.documentContext || document);
      this.win = $(this.options.windowContext || window);
      this.body = this.doc.find('body');
      this.$content = this.$el.children("." + this.options.contentClass);
      this.$content.attr('tabindex', this.options.tabIndex || 0);
      this.content = this.$content[0];
      this.previousPosition = 0;
      if (this.options.iOSNativeScrolling && this.el.style.WebkitOverflowScrolling != null) {
        this.nativeScrolling();
      } else {
        this.generate();
      }
      this.createEvents();
      this.addEvents();
      this.reset();
    }

    /**
      Prevents the rest of the page being scrolled
      when user scrolls the `.nano-content` element.
      @method preventScrolling
      @param event {Event}
      @param direction {String} Scroll direction (up or down)
      @private
     */

    NanoScroll.prototype.preventScrolling = function (e, direction) {
      if (!this.isActive) {
        return;
      }
      if (e.type === DOMSCROLL) {
        if (direction === DOWN && e.originalEvent.detail > 0 || direction === UP && e.originalEvent.detail < 0) {
          e.preventDefault();
        }
      } else if (e.type === MOUSEWHEEL) {
        if (!e.originalEvent || !e.originalEvent.wheelDelta) {
          return;
        }
        if (direction === DOWN && e.originalEvent.wheelDelta < 0 || direction === UP && e.originalEvent.wheelDelta > 0) {
          e.preventDefault();
        }
      }
    };

    /**
      Enable iOS native scrolling
      @method nativeScrolling
      @private
     */

    NanoScroll.prototype.nativeScrolling = function () {
      this.$content.css({
        WebkitOverflowScrolling: 'touch'
      });
      this.iOSNativeScrolling = true;
      this.isActive = true;
    };

    /**
      Updates those nanoScroller properties that
      are related to current scrollbar position.
      @method updateScrollValues
      @private
     */

    NanoScroll.prototype.updateScrollValues = function () {
      var content, direction;
      content = this.content;
      this.maxScrollTop = content.scrollHeight - content.clientHeight;
      this.prevScrollTop = this.contentScrollTop || 0;
      this.contentScrollTop = content.scrollTop;
      direction = this.contentScrollTop > this.previousPosition ? "down" : this.contentScrollTop < this.previousPosition ? "up" : "same";
      this.previousPosition = this.contentScrollTop;
      if (direction !== "same") {
        this.$el.trigger('update', {
          position: this.contentScrollTop,
          maximum: this.maxScrollTop,
          direction: direction
        });
      }
      if (!this.iOSNativeScrolling) {
        this.maxSliderTop = this.paneHeight - this.sliderHeight;
        this.sliderTop = this.maxScrollTop === 0 ? 0 : this.contentScrollTop * this.maxSliderTop / this.maxScrollTop;
      }
    };

    /**
      Updates CSS styles for current scroll position.
      Uses CSS 2d transfroms and `window.requestAnimationFrame` if available.
      @method setOnScrollStyles
      @private
     */

    NanoScroll.prototype.setOnScrollStyles = function () {
      var cssValue;
      if (hasTransform) {
        cssValue = {};
        cssValue[transform] = "translate(0, " + this.sliderTop + "px)";
      } else {
        cssValue = {
          top: this.sliderTop
        };
      }
      if (rAF) {
        if (cAF && this.scrollRAF) {
          cAF(this.scrollRAF);
        }
        this.scrollRAF = rAF(function (_this) {
          return function () {
            _this.scrollRAF = null;
            return _this.slider.css(cssValue);
          };
        }(this));
      } else {
        this.slider.css(cssValue);
      }
    };

    /**
      Creates event related methods
      @method createEvents
      @private
     */

    NanoScroll.prototype.createEvents = function () {
      this.events = {
        down: function (_this) {
          return function (e) {
            _this.isBeingDragged = true;
            _this.offsetY = e.pageY - _this.slider.offset().top;
            if (!_this.slider.is(e.target)) {
              _this.offsetY = 0;
            }
            _this.pane.addClass(_this.options.activeClass);
            _this.doc.bind(MOUSEMOVE, _this.events[DRAG]).bind(MOUSEUP, _this.events[UP]);
            _this.body.bind(MOUSEENTER, _this.events[ENTER]);
            return false;
          };
        }(this),
        drag: function (_this) {
          return function (e) {
            _this.sliderY = e.pageY - _this.$el.offset().top - _this.paneTop - (_this.offsetY || _this.sliderHeight * 0.5);
            _this.scroll();
            if (_this.contentScrollTop >= _this.maxScrollTop && _this.prevScrollTop !== _this.maxScrollTop) {
              _this.$el.trigger('scrollend');
            } else if (_this.contentScrollTop === 0 && _this.prevScrollTop !== 0) {
              _this.$el.trigger('scrolltop');
            }
            return false;
          };
        }(this),
        up: function (_this) {
          return function (e) {
            _this.isBeingDragged = false;
            _this.pane.removeClass(_this.options.activeClass);
            _this.doc.unbind(MOUSEMOVE, _this.events[DRAG]).unbind(MOUSEUP, _this.events[UP]);
            _this.body.unbind(MOUSEENTER, _this.events[ENTER]);
            return false;
          };
        }(this),
        resize: function (_this) {
          return function (e) {
            _this.reset();
          };
        }(this),
        panedown: function (_this) {
          return function (e) {
            _this.sliderY = (e.offsetY || e.originalEvent.layerY) - _this.sliderHeight * 0.5;
            _this.scroll();
            _this.events.down(e);
            return false;
          };
        }(this),
        scroll: function (_this) {
          return function (e) {
            _this.updateScrollValues();
            if (_this.isBeingDragged) {
              return;
            }
            if (!_this.iOSNativeScrolling) {
              _this.sliderY = _this.sliderTop;
              _this.setOnScrollStyles();
            }
            if (e == null) {
              return;
            }
            if (_this.contentScrollTop >= _this.maxScrollTop) {
              if (_this.options.preventPageScrolling) {
                _this.preventScrolling(e, DOWN);
              }
              if (_this.prevScrollTop !== _this.maxScrollTop) {
                _this.$el.trigger('scrollend');
              }
            } else if (_this.contentScrollTop === 0) {
              if (_this.options.preventPageScrolling) {
                _this.preventScrolling(e, UP);
              }
              if (_this.prevScrollTop !== 0) {
                _this.$el.trigger('scrolltop');
              }
            }
          };
        }(this),
        wheel: function (_this) {
          return function (e) {
            var delta;
            if (e == null) {
              return;
            }
            delta = e.delta || e.wheelDelta || e.originalEvent && e.originalEvent.wheelDelta || -e.detail || e.originalEvent && -e.originalEvent.detail;
            if (delta) {
              _this.sliderY += -delta / 3;
            }
            _this.scroll();
            return false;
          };
        }(this),
        enter: function (_this) {
          return function (e) {
            var _ref;
            if (!_this.isBeingDragged) {
              return;
            }
            if ((e.buttons || e.which) !== 1) {
              return (_ref = _this.events)[UP].apply(_ref, arguments);
            }
          };
        }(this)
      };
    };

    /**
      Adds event listeners with jQuery.
      @method addEvents
      @private
     */

    NanoScroll.prototype.addEvents = function () {
      var events;
      this.removeEvents();
      events = this.events;
      if (!this.options.disableResize) {
        this.win.bind(RESIZE, events[RESIZE]);
      }
      if (!this.iOSNativeScrolling) {
        this.slider.bind(MOUSEDOWN, events[DOWN]);
        this.pane.bind(MOUSEDOWN, events[PANEDOWN]).bind("" + MOUSEWHEEL + " " + DOMSCROLL, events[WHEEL]);
      }
      this.$content.bind("" + SCROLL + " " + MOUSEWHEEL + " " + DOMSCROLL + " " + TOUCHMOVE, events[SCROLL]);
    };

    /**
      Removes event listeners with jQuery.
      @method removeEvents
      @private
     */

    NanoScroll.prototype.removeEvents = function () {
      var events;
      events = this.events;
      this.win.unbind(RESIZE, events[RESIZE]);
      if (!this.iOSNativeScrolling) {
        this.slider.unbind();
        this.pane.unbind();
      }
      this.$content.unbind("" + SCROLL + " " + MOUSEWHEEL + " " + DOMSCROLL + " " + TOUCHMOVE, events[SCROLL]);
    };

    /**
      Generates nanoScroller's scrollbar and elements for it.
      @method generate
      @chainable
      @private
     */

    NanoScroll.prototype.generate = function () {
      var contentClass, cssRule, currentPadding, options, pane, paneClass, sliderClass;
      options = this.options;
      paneClass = options.paneClass, sliderClass = options.sliderClass, contentClass = options.contentClass;
      if (!(pane = this.$el.children("." + paneClass)).length && !pane.children("." + sliderClass).length) {
        this.$el.append("<div class=\"" + paneClass + "\"><div class=\"" + sliderClass + "\" /></div>");
      }
      this.pane = this.$el.children("." + paneClass);
      this.slider = this.pane.find("." + sliderClass);
      if (BROWSER_SCROLLBAR_WIDTH === 0 && isFFWithBuggyScrollbar()) {
        currentPadding = window.getComputedStyle(this.content, null).getPropertyValue('padding-right').replace(/[^0-9.]+/g, '');
        cssRule = {
          right: -14,
          paddingRight: +currentPadding + 14
        };
      } else if (BROWSER_SCROLLBAR_WIDTH) {
        cssRule = {
          right: -BROWSER_SCROLLBAR_WIDTH
        };
        this.$el.addClass(options.enabledClass);
      }
      if (cssRule != null) {
        this.$content.css(cssRule);
      }
      return this;
    };

    /**
      @method restore
      @private
     */

    NanoScroll.prototype.restore = function () {
      this.stopped = false;
      if (!this.iOSNativeScrolling) {
        this.pane.show();
      }
      this.addEvents();
    };

    /**
      Resets nanoScroller's scrollbar.
      @method reset
      @chainable
      @example
          $(".nano").nanoScroller();
     */

    NanoScroll.prototype.reset = function () {
      var content, contentHeight, contentPosition, contentStyle, contentStyleOverflowY, paneBottom, paneHeight, paneOuterHeight, paneTop, parentMaxHeight, right, sliderHeight;
      if (this.iOSNativeScrolling) {
        this.contentHeight = this.content.scrollHeight;
        return;
      }
      if (!this.$el.find("." + this.options.paneClass).length) {
        this.generate().stop();
      }
      if (this.stopped) {
        this.restore();
      }
      content = this.content;
      contentStyle = content.style;
      contentStyleOverflowY = contentStyle.overflowY;
      if (BROWSER_IS_IE7) {
        this.$content.css({
          height: this.$content.height()
        });
      }
      contentHeight = content.scrollHeight + BROWSER_SCROLLBAR_WIDTH;
      parentMaxHeight = parseInt(this.$el.css("max-height"), 10);
      if (parentMaxHeight > 0) {
        this.$el.height("");
        this.$el.height(content.scrollHeight > parentMaxHeight ? parentMaxHeight : content.scrollHeight);
      }
      paneHeight = this.pane.outerHeight(false);
      paneTop = parseInt(this.pane.css('top'), 10);
      paneBottom = parseInt(this.pane.css('bottom'), 10);
      paneOuterHeight = paneHeight + paneTop + paneBottom;
      sliderHeight = Math.round(paneOuterHeight / contentHeight * paneHeight);
      if (sliderHeight < this.options.sliderMinHeight) {
        sliderHeight = this.options.sliderMinHeight;
      } else if (this.options.sliderMaxHeight != null && sliderHeight > this.options.sliderMaxHeight) {
        sliderHeight = this.options.sliderMaxHeight;
      }
      if (contentStyleOverflowY === SCROLL && contentStyle.overflowX !== SCROLL) {
        sliderHeight += BROWSER_SCROLLBAR_WIDTH;
      }
      this.maxSliderTop = paneOuterHeight - sliderHeight;
      this.contentHeight = contentHeight;
      this.paneHeight = paneHeight;
      this.paneOuterHeight = paneOuterHeight;
      this.sliderHeight = sliderHeight;
      this.paneTop = paneTop;
      this.slider.height(sliderHeight);
      this.events.scroll();
      this.pane.show();
      this.isActive = true;
      if (content.scrollHeight === content.clientHeight || this.pane.outerHeight(true) >= content.scrollHeight && contentStyleOverflowY !== SCROLL) {
        this.pane.hide();
        this.isActive = false;
      } else if (this.el.clientHeight === content.scrollHeight && contentStyleOverflowY === SCROLL) {
        this.slider.hide();
      } else {
        this.slider.show();
      }
      this.pane.css({
        opacity: this.options.alwaysVisible ? 1 : '',
        visibility: this.options.alwaysVisible ? 'visible' : ''
      });
      contentPosition = this.$content.css('position');
      if (contentPosition === 'static' || contentPosition === 'relative') {
        right = parseInt(this.$content.css('right'), 10);
        if (right) {
          this.$content.css({
            right: '',
            marginRight: right
          });
        }
      }
      return this;
    };

    /**
      @method scroll
      @private
      @example
          $(".nano").nanoScroller({ scroll: 'top' });
     */

    NanoScroll.prototype.scroll = function () {
      if (!this.isActive) {
        return;
      }
      this.sliderY = Math.max(0, this.sliderY);
      this.sliderY = Math.min(this.maxSliderTop, this.sliderY);
      this.$content.scrollTop(this.maxScrollTop * this.sliderY / this.maxSliderTop);
      if (!this.iOSNativeScrolling) {
        this.updateScrollValues();
        this.setOnScrollStyles();
      }
      return this;
    };

    /**
      Scroll at the bottom with an offset value
      @method scrollBottom
      @param offsetY {Number}
      @chainable
      @example
          $(".nano").nanoScroller({ scrollBottom: value });
     */

    NanoScroll.prototype.scrollBottom = function (offsetY) {
      if (!this.isActive) {
        return;
      }
      this.$content.scrollTop(this.contentHeight - this.$content.height() - offsetY).trigger(MOUSEWHEEL);
      this.stop().restore();
      return this;
    };

    /**
      Scroll at the top with an offset value
      @method scrollTop
      @param offsetY {Number}
      @chainable
      @example
          $(".nano").nanoScroller({ scrollTop: value });
     */

    NanoScroll.prototype.scrollTop = function (offsetY) {
      if (!this.isActive) {
        return;
      }
      this.$content.scrollTop(+offsetY).trigger(MOUSEWHEEL);
      this.stop().restore();
      return this;
    };

    /**
      Scroll to an element
      @method scrollTo
      @param node {Node} A node to scroll to.
      @chainable
      @example
          $(".nano").nanoScroller({ scrollTo: $('#a_node') });
     */

    NanoScroll.prototype.scrollTo = function (node) {
      if (!this.isActive) {
        return;
      }
      this.scrollTop(this.$el.find(node).get(0).offsetTop);
      return this;
    };

    /**
      To stop the operation.
      This option will tell the plugin to disable all event bindings and hide the gadget scrollbar from the UI.
      @method stop
      @chainable
      @example
          $(".nano").nanoScroller({ stop: true });
     */

    NanoScroll.prototype.stop = function () {
      if (cAF && this.scrollRAF) {
        cAF(this.scrollRAF);
        this.scrollRAF = null;
      }
      this.stopped = true;
      this.removeEvents();
      if (!this.iOSNativeScrolling) {
        this.pane.hide();
      }
      return this;
    };

    /**
      Destroys nanoScroller and restores browser's native scrollbar.
      @method destroy
      @chainable
      @example
          $(".nano").nanoScroller({ destroy: true });
     */

    NanoScroll.prototype.destroy = function () {
      if (!this.stopped) {
        this.stop();
      }
      if (!this.iOSNativeScrolling && this.pane.length) {
        this.pane.remove();
      }
      if (BROWSER_IS_IE7) {
        this.$content.height('');
      }
      this.$content.removeAttr('tabindex');
      if (this.$el.hasClass(this.options.enabledClass)) {
        this.$el.removeClass(this.options.enabledClass);
        this.$content.css({
          right: ''
        });
      }
      return this;
    };

    /**
      To flash the scrollbar gadget for an amount of time defined in plugin settings (defaults to 1,5s).
      Useful if you want to show the user (e.g. on pageload) that there is more content waiting for him.
      @method flash
      @chainable
      @example
          $(".nano").nanoScroller({ flash: true });
     */

    NanoScroll.prototype.flash = function () {
      if (this.iOSNativeScrolling) {
        return;
      }
      if (!this.isActive) {
        return;
      }
      this.reset();
      this.pane.addClass(this.options.flashedClass);
      setTimeout(function (_this) {
        return function () {
          _this.pane.removeClass(_this.options.flashedClass);
        };
      }(this), this.options.flashDelay);
      return this;
    };

    return NanoScroll;
  }();
  $.fn.nanoScroller = function (settings) {
    return this.each(function () {
      var options, scrollbar;
      if (!(scrollbar = this.nanoscroller)) {
        options = $.extend({}, defaults, settings);
        this.nanoscroller = scrollbar = new NanoScroll(this, options);
      }
      if (settings && (typeof settings === "undefined" ? "undefined" : _typeof(settings)) === "object") {
        $.extend(scrollbar.options, settings);
        if (settings.scrollBottom != null) {
          return scrollbar.scrollBottom(settings.scrollBottom);
        }
        if (settings.scrollTop != null) {
          return scrollbar.scrollTop(settings.scrollTop);
        }
        if (settings.scrollTo) {
          return scrollbar.scrollTo(settings.scrollTo);
        }
        if (settings.scroll === 'bottom') {
          return scrollbar.scrollBottom(0);
        }
        if (settings.scroll === 'top') {
          return scrollbar.scrollTop(0);
        }
        if (settings.scroll && settings.scroll instanceof $) {
          return scrollbar.scrollTo(settings.scroll);
        }
        if (settings.stop) {
          return scrollbar.stop();
        }
        if (settings.destroy) {
          return scrollbar.destroy();
        }
        if (settings.flash) {
          return scrollbar.flash();
        }
      }
      return scrollbar.reset();
    });
  };
  $.fn.nanoScroller.Constructor = NanoScroll;
});

//# sourceMappingURL=jquery.nanoscroller.js.map

/*!
 * Waves v0.6.4
 * http://fian.my.id/Waves
 *
 * Copyright 2014 Alfiana E. Sibuea and other contributors
 * Released under the MIT license
 * https://github.com/fians/Waves/blob/master/LICENSE
 */

;(function (window) {
  'use strict';

  var Waves = Waves || {};
  var $$ = document.querySelectorAll.bind(document);

  // Find exact position of element
  function isWindow(obj) {
    return obj !== null && obj === obj.window;
  }

  function getWindow(elem) {
    return isWindow(elem) ? elem : elem.nodeType === 9 && elem.defaultView;
  }

  function offset(elem) {
    var docElem,
        win,
        box = { top: 0, left: 0 },
        doc = elem && elem.ownerDocument;

    docElem = doc.documentElement;

    if (_typeof(elem.getBoundingClientRect) !== (typeof undefined === "undefined" ? "undefined" : _typeof(undefined))) {
      box = elem.getBoundingClientRect();
    }
    win = getWindow(doc);
    return {
      top: box.top + win.pageYOffset - docElem.clientTop,
      left: box.left + win.pageXOffset - docElem.clientLeft
    };
  }

  function convertStyle(obj) {
    var style = '';

    for (var a in obj) {
      if (obj.hasOwnProperty(a)) {
        style += a + ':' + obj[a] + ';';
      }
    }

    return style;
  }

  var Effect = {

    // Effect delay
    duration: 750,

    show: function show(e, element) {

      // Disable right click
      if (e.button === 2) {
        return false;
      }

      var el = element || this;

      // Create ripple
      var ripple = document.createElement('div');
      ripple.className = 'waves-ripple';
      el.appendChild(ripple);

      // Get click coordinate and element witdh
      var pos = offset(el);
      var relativeY = e.pageY - pos.top;
      var relativeX = e.pageX - pos.left;
      var scale = 'scale(' + el.clientWidth / 100 * 10 + ')';

      // Support for touch devices
      if ('touches' in e) {
        relativeY = e.touches[0].pageY - pos.top;
        relativeX = e.touches[0].pageX - pos.left;
      }

      // Attach data to element
      ripple.setAttribute('data-hold', Date.now());
      ripple.setAttribute('data-scale', scale);
      ripple.setAttribute('data-x', relativeX);
      ripple.setAttribute('data-y', relativeY);

      // Set ripple position
      var rippleStyle = {
        'top': relativeY + 'px',
        'left': relativeX + 'px'
      };

      ripple.className = ripple.className + ' waves-notransition';
      ripple.setAttribute('style', convertStyle(rippleStyle));
      ripple.className = ripple.className.replace('waves-notransition', '');

      // Scale the ripple
      rippleStyle['-webkit-transform'] = scale;
      rippleStyle['-moz-transform'] = scale;
      rippleStyle['-ms-transform'] = scale;
      rippleStyle['-o-transform'] = scale;
      rippleStyle.transform = scale;
      rippleStyle.opacity = '1';

      rippleStyle['-webkit-transition-duration'] = Effect.duration + 'ms';
      rippleStyle['-moz-transition-duration'] = Effect.duration + 'ms';
      rippleStyle['-o-transition-duration'] = Effect.duration + 'ms';
      rippleStyle['transition-duration'] = Effect.duration + 'ms';

      rippleStyle['-webkit-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
      rippleStyle['-moz-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
      rippleStyle['-o-transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';
      rippleStyle['transition-timing-function'] = 'cubic-bezier(0.250, 0.460, 0.450, 0.940)';

      ripple.setAttribute('style', convertStyle(rippleStyle));
    },

    hide: function hide(e) {
      TouchHandler.touchup(e);

      var el = this;
      var width = el.clientWidth * 1.4;

      // Get first ripple
      var ripple = null;
      var ripples = el.getElementsByClassName('waves-ripple');
      if (ripples.length > 0) {
        ripple = ripples[ripples.length - 1];
      } else {
        return false;
      }

      var relativeX = ripple.getAttribute('data-x');
      var relativeY = ripple.getAttribute('data-y');
      var scale = ripple.getAttribute('data-scale');

      // Get delay beetween mousedown and mouse leave
      var diff = Date.now() - Number(ripple.getAttribute('data-hold'));
      var delay = 350 - diff;

      if (delay < 0) {
        delay = 0;
      }

      // Fade out ripple after delay
      setTimeout(function () {
        var style = {
          'top': relativeY + 'px',
          'left': relativeX + 'px',
          'opacity': '0',

          // Duration
          '-webkit-transition-duration': Effect.duration + 'ms',
          '-moz-transition-duration': Effect.duration + 'ms',
          '-o-transition-duration': Effect.duration + 'ms',
          'transition-duration': Effect.duration + 'ms',
          '-webkit-transform': scale,
          '-moz-transform': scale,
          '-ms-transform': scale,
          '-o-transform': scale,
          'transform': scale
        };

        ripple.setAttribute('style', convertStyle(style));

        setTimeout(function () {
          try {
            el.removeChild(ripple);
          } catch (e) {
            return false;
          }
        }, Effect.duration);
      }, delay);
    },

    // Little hack to make <input> can perform waves effect
    wrapInput: function wrapInput(elements) {
      for (var a = 0; a < elements.length; a++) {
        var el = elements[a];

        if (el.tagName.toLowerCase() === 'input') {
          var parent = el.parentNode;

          // If input already have parent just pass through
          if (parent.tagName.toLowerCase() === 'i' && parent.className.indexOf('boton_efecto') !== -1) {
            continue;
          }

          // Put element class and style to the specified parent
          var wrapper = document.createElement('i');
          wrapper.className = el.className + ' waves-input-wrapper';

          var elementStyle = el.getAttribute('style');

          if (!elementStyle) {
            elementStyle = '';
          }

          wrapper.setAttribute('style', elementStyle);

          el.className = 'waves-button-input';
          el.removeAttribute('style');

          // Put element as child
          parent.replaceChild(wrapper, el);
          wrapper.appendChild(el);
        }
      }
    }
  };

  /**
   * Disable mousedown event for 500ms during and after touch
   */
  var TouchHandler = {
    /* uses an integer rather than bool so there's no issues with
     * needing to clear timeouts if another touch event occurred
     * within the 500ms. Cannot mouseup between touchstart and
     * touchend, nor in the 500ms after touchend. */
    touches: 0,
    allowEvent: function allowEvent(e) {
      var allow = true;

      if (e.type === 'touchstart') {
        TouchHandler.touches += 1; //push
      } else if (e.type === 'touchend' || e.type === 'touchcancel') {
        setTimeout(function () {
          if (TouchHandler.touches > 0) {
            TouchHandler.touches -= 1; //pop after 500ms
          }
        }, 500);
      } else if (e.type === 'mousedown' && TouchHandler.touches > 0) {
        allow = false;
      }

      return allow;
    },
    touchup: function touchup(e) {
      TouchHandler.allowEvent(e);
    }
  };

  /**
   * Delegated click handler for .boton_efecto element.
   * returns null when .boton_efecto element not in "click tree"
   */
  function getWavesEffectElement(e) {
    if (TouchHandler.allowEvent(e) === false) {
      return null;
    }

    var element = null;
    var target = e.target || e.srcElement;

    while (target.parentElement !== null) {
      if (!(target instanceof SVGElement) && target.className.indexOf('boton_efecto') !== -1) {
        element = target;
        break;
      } else if (target.classList.contains('boton_efecto')) {
        element = target;
        break;
      }
      target = target.parentElement;
    }

    return element;
  }

  /**
   * Bubble the click and show effect if .boton_efecto elem was found
   */
  function showEffect(e) {
    var element = getWavesEffectElement(e);

    if (element !== null) {
      Effect.show(e, element);

      if ('ontouchstart' in window) {
        element.addEventListener('touchend', Effect.hide, false);
        element.addEventListener('touchcancel', Effect.hide, false);
      }

      element.addEventListener('mouseup', Effect.hide, false);
      element.addEventListener('mouseleave', Effect.hide, false);
    }
  }

  Waves.displayEffect = function (options) {
    options = options || {};

    if ('duration' in options) {
      Effect.duration = options.duration;
    }

    //Wrap input inside <i> tag
    Effect.wrapInput($$('.boton_efecto'));

    if ('ontouchstart' in window) {
      document.body.addEventListener('touchstart', showEffect, false);
    }

    document.body.addEventListener('mousedown', showEffect, false);
  };

  /**
   * Attach Waves to an input element (or any element which doesn't
   * bubble mouseup/mousedown events).
   *   Intended to be used with dynamically loaded forms/inputs, or
   * where the user doesn't want a delegated click handler.
   */
  Waves.attach = function (element) {
    //FUTURE: automatically add waves classes and allow users
    // to specify them with an options param? Eg. light/classic/button
    if (element.tagName.toLowerCase() === 'input') {
      Effect.wrapInput([element]);
      element = element.parentElement;
    }

    if ('ontouchstart' in window) {
      element.addEventListener('touchstart', showEffect, false);
    }

    element.addEventListener('mousedown', showEffect, false);
  };

  window.Waves = Waves;

  document.addEventListener('DOMContentLoaded', function () {
    Waves.displayEffect();
  }, false);
})(window);