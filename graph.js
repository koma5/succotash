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

function ticked() {
  link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
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
      d3.select(this).attr('r', 10)
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
    d3.select(this).attr('class', " node").attr('r', 7);
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

var clickedNode = null;

var svg = d3.select('body').append('svg')
    .on('click', function(d) {clickSvg();});

var info = d3.select("body").append('div')
    .attr('class', 'info')
    .attr('style', 'display:none');


var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(50).id(function(d, i) { return d.id; }))
    .force("charge", d3.forceManyBody())


var doap = $rdf.Namespace("http://usefulinc.com/ns/doap#")
var foaf = $rdf.Namespace("http://xmlns.com/foaf/0.1/")
var rdf = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
var skos = $rdf.Namespace("http://www.w3.org/2004/02/skos/core#")

var store = $rdf.graph()
var timeout = 5000 // 5000 ms timeout
var fetcher = new $rdf.Fetcher(store, timeout)

var graph = {nodes: [], links:[]}

fetcher.nowOrWhenFetched("http://" + window.location.host + "/graph.ttl", function(ok, body, xhr) {
    if (ok) {

      nodesLinksFromRdfProperty(store, foaf('maker'), graph)
      nodesLinksFromRdfProperty(store, doap('programming-language'), graph)
      nodesLinksFromRdfProperty(store, skos('related'), graph)

      link = svg.selectAll('.link')
          .data(graph.links)
          .enter().append('line')
          .attr('about', function(d) {return d.source;}) //subject resource/about
          .attr('property', function(d) {return d.uri;}) // predicate rel/property
          .attr('href', function(d) {return d.target;}) //object href/resource2
          .attr('class', 'link');

      node = svg.selectAll('.node')
          .data(graph.nodes)
          .enter().append('circle')
          .attr("r", 7)
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
