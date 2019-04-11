import rdflib, requests, html, time

graph = rdflib.Graph()
me = rdflib.URIRef("http://marcoko.ch/#i")

graph.parse('./data.ttl', format='turtle')

doap = rdflib.Namespace("http://usefulinc.com/ns/doap#")
dbr = rdflib.Namespace("http://dbpedia.org/resource/")
dbo = rdflib.Namespace("http://dbpedia.org/ontology/")
foaf = rdflib.namespace.FOAF
rdf  = rdflib.namespace.RDF
rdfs  = rdflib.namespace.RDFS

graph.bind('foaf', foaf, override=True)

ReposToFetch = graph.query(
    """SELECT ?project
       WHERE { ?project a :Project . }""")


githubReposUrl = "https://api.github.com/users/koma5/repos?per_page=999"
githubRepos = requests.get(githubReposUrl).json()


for githubRepo in githubRepos:
    for repoToFetch in ReposToFetch:
        hashId = repoToFetch['project'].toPython().split('#')[1]
        if githubRepo['name'] == hashId:
            print(githubRepo['name'])


            graph.add(( repoToFetch['project'],
                        doap.name,
                        rdflib.Literal(hashId) ))

            if(githubRepo['homepage'] != ""):
                graph.add(( repoToFetch['project'],
                            doap.homepage,
                            rdflib.URIRef(githubRepo['homepage']) ))

            graph.add(( repoToFetch['project'],
                        doap.repository,
                        rdflib.URIRef(githubRepo['html_url']) ))

            if(githubRepo['description'] != None):
                graph.add(( repoToFetch['project'],
                            doap.description,
                            rdflib.Literal(githubRepo['description'], lang='en') ))

            graph.add(( repoToFetch['project'],
                        foaf.maker,
                        me))

            graph.add(( repoToFetch['project'],
                        rdf.type,
                        doap.Project ))

dbpediaResources = graph.query(
"""SELECT DISTINCT ?dbr
WHERE {
?s ?p ?dbr
FILTER regex(str(?dbr),'http://dbpedia.org/resource/','i')
}""")

tempGraph = rdflib.Graph()

""" #all at once
    #SQL Message: RC...: Returning incomplete results, query interrupted by result timeout.
query = "CONSTRUCT WHERE {\n"
i = 0

for resource in dbpediaResources:
    query += "<{0}> ?s{1} ?o{1} .\n".format(resource['dbr'], i)
    i += 1
query += '}'
print(query)

url = "http://dbpedia.org/sparql/"
p = {'query' : query, 'format' : 'text/turtle', 'timeout' : 3000000}
r = requests.get(url, params=p)
tempGraph.parse(data=r.text, format="turtle")
"""

# one at at a time every 15 seconds
for resource in dbpediaResources:
    print(resource['dbr'])

    url = "http://dbpedia.org/sparql/"
    q = "CONSTRUCT WHERE {{<{0}> ?s ?p .}}".format(resource['dbr'])
    p = {'query' : q, 'format' : 'text/turtle'}
    r = requests.get(url, params=p)
    tempGraph.parse(data=r.text, format="turtle")
    time.sleep(15)


#outputFile = open('db.ttl', 'wb')
#outputFile.write(tempGraph.serialize(format='turtle'))
#outputFile.close()"""
#tempGraph.parse('./db.ttl', format='turtle')

properties = [rdfs.label, dbo.abstract]

for prop in properties:
    for triple in tempGraph.triples((None, prop, None)):
        graph.add(triple)

for triple in tempGraph.triples((None, None, dbo.ProgrammingLanguage)):
    graph.add(triple)

outputFile = open('graph.ttl', 'wb')
outputFile.write(graph.serialize(format='turtle'))
outputFile.close()

outputFile = open('graph.rdf', 'wb')
outputFile.write(graph.serialize(format="pretty-xml", max_depth=2))
outputFile.close()
