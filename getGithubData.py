import rdflib, requests

graph = rdflib.Graph()
me = rdflib.URIRef("http://marcoko.ch/#i")
base = "http://succotash.5th.ch/#"

graph.parse('./data.ttl', format='turtle')

doap = rdflib.Namespace("http://usefulinc.com/ns/doap#")
foaf = rdflib.namespace.FOAF
rdf  = rdflib.namespace.RDF

ReposToFetch = graph.query(
    """SELECT ?name ?project
       WHERE { ?project :name ?name . }""")


githubReposUrl = "https://api.github.com/users/koma5/repos"
githubRepos = requests.get(githubReposUrl).json()


for githubRepo in githubRepos:
    for repoToFetch in ReposToFetch:
        if githubRepo['name'] == repoToFetch['name'].toPython():
            print(githubRepo['name'])

            graph.remove((repoToFetch['project'], None, None))

            newId = rdflib.URIRef(base + githubRepo['name'])

            graph.add(( newId,
                        doap.name,
                        rdflib.Literal(githubRepo['name']) ))

            graph.add(( newId,
                        doap.homepage,
                        rdflib.URIRef(githubRepo['html_url']) ))

            graph.add(( newId,
                        doap.repository,
                        rdflib.URIRef(githubRepo['ssh_url']) ))

            graph.add(( newId,
                        doap.repository,
                        rdflib.URIRef(githubRepo['clone_url']) ))

            if(githubRepo['description'] != None):
                graph.add(( newId,
                            doap.description,
                            rdflib.Literal(githubRepo['description']) ))

            graph.add(( newId,
                        foaf.maker,
                        me))

            graph.add(( newId,
                        rdf.type,
                        doap.Project ))



outputFile = open('data_github_enriched.ttl', 'wb')
outputFile.write(graph.serialize(format='turtle'))
outputFile.close()
