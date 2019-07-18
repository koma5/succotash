# succotash
This fancy website serves as my personal portfolio and puts on display the things I made. Because a tabular version was to lame I built a graph with colorful circles.

The graph is made from linked data which is accessible in many formats on my sparql endpoint called [icedbroccoli.5th.ch][broccoli]. JavaScript renders the graph on page-load with a cached specific cached sparql query.

The selection of the circles is bound to the #anchor of the page.

Because the site itself is a thing I made you can select the circle representing itself on itself [#succotash].

Which makes it possible to share the link to a specific node/circle.

The data available in multiple languages. JavaScript is selecting which language to display based on the locale of the browser.

![screenshot of succotash node #succotash selected](/succotash_screenshot.png?raw=true)

[#succotash]: http://5th.ch/succotash/#succotash
[broccoli]: https://icedbroccoli.5th.ch/dataset.html?tab=query&ds=/broccoli
