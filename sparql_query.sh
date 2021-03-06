curl icedbroccoli.5th.ch/broccoli/query --silent -f -X POST -H 'accept: application/n-triples' --data-urlencode query@- <<EOF
PREFIX doap: <http://usefulinc.com/ns/doap#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dbr: <http://dbpedia.org/resource/>
PREFIX db: <http://dbpedia.org/>


DESCRIBE ?project ?dbr ?concept ?maker
FROM NAMED <http://icedbroccoli.5th.ch/broccoli#succotash>
FROM <http://icedbroccoli.5th.ch/broccoli#dbpedia> 
FROM <http://icedbroccoli.5th.ch/broccoli#koma5>
FROM NAMED <http://icedbroccoli.5th.ch/broccoli#code>
WHERE {
    GRAPH <http://icedbroccoli.5th.ch/broccoli#succotash> {
    	?project a doap:Project.
		OPTIONAL {?project ?someRef ?dbr .}
    	OPTIONAL {?project skos:related ?concept .}
        OPTIONAL { VALUES ?someRef { dbo:computingPlatform doap:programming-language }}
  	}
  	GRAPH ?g {?project foaf:maker ?maker .} #foaf maker is defined in #succotash and #code for some project
}
EOF

