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

  if(node.id.includes(origin)) {
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

function getObjectRightLanguage(node, prop) {

  //Safari / Chrome
  var languages = navigator.languages != undefined ? navigator.languages : [ navigator.language ];

  for(var l = 0; l < languages.length; l++) {
    if(languages[l].indexOf('-') > 0) {
      languages[l] = languages[l].split('-')[0];
    }
  }

  returnData = {'string': undefined, 'lang' : undefined}

  try {
    strings = store.statementsMatching($rdf.sym(node.id), prop, undefined);
    dance:
    for(var l = 0; l < languages.length; l++) {
      for(var s = 0; s < strings.length; s++) {
        if(languages[l] == strings[s].object.lang) {
          returnData.string = strings[s].object.value;
          returnData.lang = strings[s].object.lang != '' ? '@' + strings[s].object.lang : '';
          break dance;
        }
        else {
          returnData.string = strings[s].object.value;
          returnData.lang = strings[s].object.lang != '' ? '@' + strings[s].object.lang : '';
        }
      }
    }
  } catch(err) {}
  return returnData;
}

function showInfo(node) {

  var infoTemplate = '{{#name}}<h1>{{name}}</h1>{{/name}}{{#langTagName}}<span class="langTagName">{{langTagName}} {{/langTagName}}</span> {{#uri}}<span class="uri"> &lt;{{uri}}&gt;</span>{{/uri}}\
  {{#rdfType}}<p>{{rdfType}} <span class="typeLabel">rdf:type</span></p>{{/rdfType}}\
  {{#image}}<img src="{{image}}" alt=""/>{{/image}}\
  {{#description}}<p class="description">{{description}}\
  {{#langTagDesc}}<span class="langTagDesc">{{langTagDesc}}</span>{{/langTagDesc}}</p>{{/description}}\
  <p>{{#links}}<a href="{{href}}" target="_blank">{{name}}</a> {{/links}}</p>';

  var infoData = {links : []};

  var o = getObjectRightLanguage(node, rdf('type'))
  infoData.type = o.string;

  if (infoData.type == doap('Project').value) { //doap:Project

    infoData.rdfType =  "doap:Project"
    infoData.uri = node.id;


    var o = getObjectRightLanguage(node, doap('name'))
    infoData.name = o.string;
    infoData.langTagName = o.lang ;

    var o = getObjectRightLanguage(node, doap("description"))
    infoData.description = o.string;
    infoData.langTagDesc = o.lang ;

    var o = getObjectRightLanguage(node, doap("homepage"))
    if (o.string != undefined) {
      infoData.links.push({
        name: "link",
        href: o.string
      });
    }

    var o = getObjectRightLanguage(node, doap("repository"))
    if (o.string != undefined) {
      infoData.links.push({
        name: "repo",
        href: o.string
      });
    }

  }

  else if (infoData.type == skos('Concept').value) { //skos:Concept

    infoData.uri = node.id;
    infoData.rdfType =  "skos:Concept";

    var o = getObjectRightLanguage(node, rdfs("label"))
    infoData.name = o.string;
    infoData.langTagName = o.lang ;

  }

  else if (infoData.type == foaf('Person').value) { //foaf:Person

    infoData.uri = node.id;
    infoData.rdfType =  "foaf:Person";

    var o = getObjectRightLanguage(node, foaf("name"))
    infoData.name = o.string;

    var o = getObjectRightLanguage(node, foaf("img"))
    infoData.image = o.string;

    var o = getObjectRightLanguage(node, foaf("homepage"))
    if (o.string != undefined) {
      infoData.links.push({
        name: "website",
        href: o.string
      });
    }

    var o = getObjectRightLanguage(node, foaf("weblog"))
    if (o.string != undefined) {
      infoData.links.push({
        name: "blog",
        href: o.string
      });
    }

  }


  else {

    infoData.uri = node.id;

    var o = getObjectRightLanguage(node, rdfs("label"))
    infoData.name = o.string;
    infoData.langTagName = o.lang ;

    var o = getObjectRightLanguage(node, dbo("abstract"))
    infoData.description = o.string;
    infoData.langTagDesc = o.lang ;

    var o = getObjectRightLanguage(node, rdf("type"))
    infoData.rdfType = o.string != undefined ? '<' + o.string + '>' : '';
  }

  Mustache.parse(infoTemplate);
  html = Mustache.render(infoTemplate, infoData);

  info.attr('style', null)
  .html(html);
}

var origin = "http://5th.ch/succotash";

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
var skos = "http://www.w3.org/2004/02/skos/core#"
var rdfs = "http://www.w3.org/2000/01/rdf-schema#"
var dbo = "http://dbpedia.org/ontology/"
var rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"

d3.select('html').attr('prefix',
'doap: ' + doap + '\n\
foaf: ' + foaf + '\n\
skos: ' + skos + '\n\
rdfs: ' + rdfs + '\n\
dbo: ' + dbo + '\n\
rdf: ' + rdf)

doap = $rdf.Namespace(doap)
foaf = $rdf.Namespace(foaf)
skos = $rdf.Namespace(skos)
rdfs = $rdf.Namespace(rdfs)
dbo = $rdf.Namespace(dbo)
rdf = $rdf.Namespace(rdf)

var store = $rdf.graph()
var timeout = 5000 // 5000 ms timeout
var fetcher = new $rdf.Fetcher(store, timeout)

var graph = {nodes: [], links:[]}

function buildGraph() {

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

var localDateFile = window.location.origin + window.location.pathname.replace('index.html', '') + "/graph.ttl"

fetcher.nowOrWhenFetched(localDateFile, function(ok, body, xhr) {
    if (ok) {

      // fetch seeAlso
      seeAlsos = store.statementsMatching($rdf.sym(origin), rdf['seeAlso'], undefined)
      for(var i=0; i < seeAlsos.length; i++) {
        fetcher.nowOrWhenFetched(seeAlsos[i].object.value, function(ok, body, xhr) {});
      }

      buildGraph();

    }
});
