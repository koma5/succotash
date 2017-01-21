function nodesLinksFromRdfProperty(store, property, graph, source) {

  var matches = store.statementsMatching(undefined, property, undefined, source)
  for (var i=0; i<matches.length; i++) {
    match = matches[i]
    addUniqueNodes(graph, match.subject.uri)
    addUniqueNodes(graph, match.object.uri)
    graph.links.push({
      source: match.subject.uri,
      target: match.object.uri,
      uri: property.value
    })
  }

}

function addUniqueNodes(graph, uri) {
  unique = true
  for(var i=0; i < graph.nodes.length; i++) {
    unique &= graph.nodes[i].id != uri;
  }
  if(unique) {
    rdftype = store.statementsMatching($rdf.sym(uri), rdf("type"), undefined)
    graph.nodes.push({id: uri, rdftype: rdftype.length > 0 ? rdftype[0].object.uri : ""})
  }
}

function resize() {
  width = window.innerWidth, height = window.innerHeight;
  svg.attr("width", width).attr("height", height);
  simulation.force("center", d3.forceCenter(width / 2, height / 2))
  .alphaTarget(0.3).restart();

  setTimeout(function () {
      simulation.alphaTarget(0);
  }, 500);

}

//http://stackoverflow.com/questions/13165913/draw-an-arrow-between-two-circles/20909533#20909533
var diff, div, free, length, prod, scale, sum, unit;

length = function(arg) {
  var x, y;
  x = arg.x, y = arg.y;
  return Math.sqrt(x * x + y * y);
};

sum = function(arg, arg1) {
  var x1, x2, y1, y2;
  x1 = arg.x, y1 = arg.y;
  x2 = arg1.x, y2 = arg1.y;
  return {
    x: x1 + x2,
    y: y1 + y2
  };
};

diff = function(arg, arg1) {
  var x1, x2, y1, y2;
  x1 = arg.x, y1 = arg.y;
  x2 = arg1.x, y2 = arg1.y;
  return {
    x: x1 - x2,
    y: y1 - y2
  };
};

prod = function(arg, scalar) {
  var x, y;
  x = arg.x, y = arg.y;
  return {
    x: x * scalar,
    y: y * scalar
  };
};

div = function(arg, scalar) {
  var x, y;
  x = arg.x, y = arg.y;
  return {
    x: x / scalar,
    y: y / scalar
  };
};

unit = function(vector) {
  return div(vector, length(vector));
};

scale = function(vector, scalar) {
  return prod(unit(vector), scalar);
};

free = function(arg) {
  var coord1, coord2;
  coord1 = arg[0], coord2 = arg[1];
  return diff(coord2, coord1);
};

function ticked() {
  link
  .attr('x1', function(d) {
    return sum(d.source, scale(free([d.source, d.target]), circleSizeNormal+1.5)).x;
  })
  .attr('y1', function(d) {
    return sum(d.source, scale(free([d.source, d.target]), circleSizeNormal+1.5)).y;
  })
  .attr('x2', function(d) {
    return diff(d.target, scale(free([d.source, d.target]), circleSizeNormal+1.5)).x;
  })
  .attr('y2', function(d) {
    return diff(d.target, scale(free([d.source, d.target]), circleSizeNormal+1.5)).y;
  });

  node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
  node.on('click', null)
  .on('mouseover', null)
  .on("mouseout", null)
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
  node.on('click', function(d) {clickNode(d);})
  .on('mouseover', function(d) {mouseOverNode(d);})
  .on("mouseout", function(d) {mouseOutNode(d);})
}

function mouseOverNode(node) {
  unfocusNodes();
  focusNodes(node);
}

function mouseOutNode(node) {
  unfocusNodes();
  if(clickedNode != null) {
    focusNodes(clickedNode)
  }
}

function focusNodes(node) {
  showInfo(node);

  links = [];

  svg.selectAll('.link').each(function(l) {
    if(l.source.id != node.id && l.target.id != node.id) {
      d3.select(this).attr('class', " link faint")
    }
    else {
      links.push(l);
    }
  })

  svg.selectAll('.node').each(function(n) {
    unconnected = true
    if(n.id == node.id) { //clicked node
      d3.select(this).attr('r', circleSizeBig)
    }
    for(i = 0; i < links.length; i++) {
      unconnected &= links[i].source.id != n.id && links[i].target.id != n.id
    }

    if(unconnected) {
      d3.select(this).attr('class', "node faint")
    }
  })
}

function unfocusNodes() {
  info.attr('style', 'display:none');
  svg.selectAll('.link').each(function(l) {
    d3.select(this).attr('class', " link")
  });
  svg.selectAll('.node').each(function(l) {
    d3.select(this).attr('class', " node").attr('r', circleSizeNormal);
  });


}

function clickNode(node) {
  d3.event.stopPropagation();
  clickedNode = node;
  focusNodes(node);

  //if(node.id.includes(window.location.origin) {
  if(node.id.includes('/succotash')) { //dev purpose! ##################
    window.history.pushState('', '', window.location.pathname +  '#' + node.id.split('#')[1]);
  }
  else {
    window.history.pushState('', '', window.location.pathname);
  }

}

function clickSvg() {
  clickedNode = null;
  unfocusNodes();
  window.history.pushState('', '', window.location.pathname);
}

function showInfo(node) {

  var html = '<h1>%name%<span class="langTagName">%langTagName%</span> <span class="uri">&lt;%uri%&gt;</span></h1>\
  <p>%rdfType% <span class="typeLabel">rdf:type</span></p>\
  <p class="description">%description%\
  <span class="langTagDesc">%langTagDesc%</span></p>\
  <p><a href="%link%">link</a> \
  <a href="%repo%">repo</a></p>'
  try {
    var type = store.statementsMatching($rdf.sym(node.id), rdf("type"), undefined)[0].object.value;
  } catch(err) {}

  if (type == doap('Project').value) { //doap:Project

    var rdfType = "doap:Project";
    html = html.replace('%rdfType%', rdfType);
    html = html.replace('%uri%', node.id);

    try {
      var name = store.statementsMatching($rdf.sym(node.id), doap("name"), undefined)[0].object.value;
      html = html.replace('%name%', name);
    } catch(err) {}
    try {
      var langTagName = store.statementsMatching($rdf.sym(node.id), doap("name"), undefined)[0].object.lang;
      html = html.replace('%langTagName%', langTagName != '' ? '@' + langTagName : '' );
    } catch(err) {
      html = html.replace('%langTagName%', '');
    }
    try {
      var description = store.statementsMatching($rdf.sym(node.id), doap("description"), undefined)[0].object.value;
      html = html.replace('%description%', description);
    } catch(err) {}
    try {
      var langTagDesc = store.statementsMatching($rdf.sym(node.id), doap("description"), undefined)[0].object.lang;
      html = html.replace('%langTagDesc%', langTagDesc != '' ? '@' + langTagDesc : '');
    } catch(err) {
      html = html.replace('%langTagDesc%', '');
    }
    try {
      var link = store.statementsMatching($rdf.sym(node.id), doap("homepage"), undefined)[0].object.value;
      html = html.replace('%link%', link);
    } catch(err) {
      html = html.replace('%link%', '');
    }
    try {
      var repo = store.statementsMatching($rdf.sym(node.id), doap("repository"), undefined)[0].object.value;
      html = html.replace('%repo%', repo);
    } catch(err) {
      html = html.replace('%repo%', '');
    }

  }

  info.attr('style', null)
  .html(html);
}



var circleSizeNormal = 10;
var circleSizeBig = 13;

var clickedNode = null;

var svg = d3.select('body').append('svg')
    .on('click', function(d) {clickSvg();});

var linesGroup = svg.append('g').attr('id', 'linesGroup');
var nodesGroup = svg.append('g').attr('id', 'nodesGroup');

var info = d3.select("body").append('div')
    .attr('class', 'info')
    .attr('style', 'display:none');


var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(50).id(function(d, i) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-200))

var doap = "http://usefulinc.com/ns/doap#"
var foaf = "http://xmlns.com/foaf/0.1/"
var rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
var skos = "http://www.w3.org/2004/02/skos/core#"

d3.select('html').attr('prefix',
'doap: ' + doap + '\n\
foaf: ' + foaf + '\n\
skos: ' + skos + '\n\
rdf: ' + rdf)

doap = $rdf.Namespace(doap)
foaf = $rdf.Namespace(foaf)
rdf = $rdf.Namespace(rdf)
skos = $rdf.Namespace(skos)

var store = $rdf.graph()
var timeout = 5000 // 5000 ms timeout
var fetcher = new $rdf.Fetcher(store, timeout)

var graph = {nodes: [], links:[]}

var localDateFile = "http://" + window.location.host + "/graph.ttl"

fetcher.nowOrWhenFetched(localDateFile, function(ok, body, xhr) {
    if (ok) {

      // fetch seeAlso
      //seeAlsos = store.statementsMatching($rdf.sym(window.location.origin), rdf['seeAlso'], undefined)
      seeAlsos = store.statementsMatching($rdf.sym('http://5th.ch/succotash'), rdf['seeAlso'], undefined) //dev purpose! ##################
      for(var i=0; i < seeAlsos.length; i++) {
        fetcher.nowOrWhenFetched(seeAlsos[i].object.value, function(ok, body, xhr) {});
      }


      nodesLinksFromRdfProperty(store, foaf('maker'), graph, $rdf.sym(localDateFile))
      nodesLinksFromRdfProperty(store, doap('programming-language'), graph, $rdf.sym(localDateFile))
      nodesLinksFromRdfProperty(store, skos('related'), graph, $rdf.sym(localDateFile))
      nodesLinksFromRdfProperty(store, skos('narrower'), graph, $rdf.sym(localDateFile))



      link = linesGroup.selectAll('.link')
          .data(graph.links)
          .enter().append('line')
          .attr('about', function(d) {return d.source;}) //subject resource/about
          .attr('property', function(d) {return d.uri;}) // predicate rel/property
          .attr('href', function(d) {return d.target;}) //object href/resource2
          .attr('class', 'link');

      node = nodesGroup.selectAll('.node')
          .data(graph.nodes)
          .enter().append('circle')
          .attr("r", circleSizeNormal)
          .attr('class', 'node')
          .attr('resource', function(d) {return d.id;})
          .attr('typeof', function(d) {return d.rdftype;})
          .on('click', function(d) {clickNode(d);})
          .on('mouseover', function(d) {mouseOverNode(d);})
          .on("mouseout", function(d) {mouseOutNode(d);})
           .call(d3.drag()
               .on("start", dragstarted)
               .on("drag", dragged)
               .on("end", dragended));

      simulation
          .nodes(graph.nodes)
          .on("tick", ticked);

      simulation.force("link")
          .links(graph.links);

      resize();
      d3.select(window).on("resize", resize);

      //focus node by requested URL
      d3.selectAll('.node').each(function(d) {
        if(window.location.hash && d.id.includes(window.location.hash)) {
          clickedNode = d;
          focusNodes(d);
        }
      });

    }
    else {
          console.log("Oops, something happened and couldn't fetch data");
    }
})
