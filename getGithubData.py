import rdflib, requests

graph = rdflib.Graph()
me = rdflib.URIRef("http://marcoko.ch/#i")
base = "http://succotash.5th.ch/#"

graph.parse('./data.ttl', format='turtle')

doap = rdflib.Namespace("http://usefulinc.com/ns/doap#")
foaf = rdflib.namespace.FOAF
rdf  = rdflib.namespace.RDF

ReposToFetch = graph.query(
    """SELECT ?project
       WHERE { ?project a :Project . }""")


githubReposUrl = "https://api.github.com/users/koma5/repos"
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
                        rdflib.URIRef(githubRepo['ssh_url']) ))

            graph.add(( repoToFetch['project'],
                        doap.repository,
                        rdflib.URIRef(githubRepo['html_url']) ))

            if(githubRepo['description'] != None):
                graph.add(( repoToFetch['project'],
                            doap.description,
                            rdflib.Literal(githubRepo['description']) ))

            graph.add(( repoToFetch['project'],
                        foaf.maker,
                        me))

            graph.add(( repoToFetch['project'],
                        rdf.type,
                        doap.Project ))



outputFile = open('data_github_enriched.ttl', 'wb')
outputFile.write(graph.serialize(format='turtle'))
outputFile.close()
