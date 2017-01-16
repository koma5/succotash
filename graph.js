function nodesLinksFromRdfProperty(store, property, graph) {

  var matches = store.statementsMatching(undefined, property, undefined)
  for (var i=0; i<matches.length; i++) {
    match = matches[i]
    //console.log(match.subject.uri + " " + match.object.uri)
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
  info.attr('style', null).text(node.id);

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
}

function clickSvg() {
  clickedNode = null;
  unfocusNodes();
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

fetcher.nowOrWhenFetched("http://" + window.location.host + "/graph.ttl", function(ok, body, xhr) {
    if (ok) {

      nodesLinksFromRdfProperty(store, foaf('maker'), graph)
      nodesLinksFromRdfProperty(store, doap('programming-language'), graph)
      nodesLinksFromRdfProperty(store, skos('related'), graph)

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
    }
    else {
          console.log("Oops, something happened and couldn't fetch data");
    }
})
