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

function moreInfo(node) {
  info.text(node.id);
}

var width = 960,
    height = 600;

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

var info = d3.select("body").append('div')
    .attr('class', 'info');


var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().distance(50).id(function(d, i) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));


var doap = $rdf.Namespace("http://usefulinc.com/ns/doap#")
var foaf = $rdf.Namespace("http://xmlns.com/foaf/0.1/")
var rdf = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
var skos = $rdf.Namespace("http://www.w3.org/2004/02/skos/core#")

var store = $rdf.graph()
var timeout = 5000 // 5000 ms timeout
var fetcher = new $rdf.Fetcher(store, timeout)

var graph = {nodes: [], links:[]}

fetcher.nowOrWhenFetched("http://" + window.location.host + "/data_github_enriched.ttl", function(ok, body, xhr) {
    if (ok) {

      nodesLinksFromRdfProperty(store, foaf('maker'), graph)
      nodesLinksFromRdfProperty(store, doap('programming-language'), graph)
      nodesLinksFromRdfProperty(store, skos('related'), graph)

      var link = svg.selectAll('.link')
          .data(graph.links)
          .enter().append('line')
          .attr('uri', function(d) {return d.uri;})
          .attr('class', 'link');

      var node = svg.selectAll('.node')
          .data(graph.nodes)
          .enter().append('circle')
          .attr("r", 7)
          .attr('class', 'node')
          .attr('uri', function(d) {return d.id;})
          .attr('rdftype', function(d) {return d.rdftype;})
          .on('mouseover', function(d) {
            d3.select(this).attr('r', 10);
            moreInfo(d)})
          .on("mouseout", function() {
            d3.select(this).attr('r', 7);})
           .call(d3.drag()
               .on("start", dragstarted)
               .on("drag", dragged)
               .on("end", dragended));

      simulation
          .nodes(graph.nodes)
          .on("tick", ticked);

      simulation.force("link")
          .links(graph.links);

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

    }
    else {
          console.log("Oops, something happened and couldn't fetch data");
    }
})
