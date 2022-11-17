#front #dojo #msw #test #mock #wip #talk

# Maîtriser les mocks de données en front !

## Introduction
### Qu'est ce qu'un mock ? 
Un mock est une simulation de ce qui se produirait dans un état normal, sans mock.

L'idée est de ne pas interroger directement un service mais de renvoyer une réponse simplifiée. Par simplifiée on entend le fait que l'on ne va pas redévelopper tout le comportement du service. La réponse est le plus souvent statique même si, comme nous le verrons par la suite, il peut y avoir du dynamisme et une logique très légère.

👍 Les intérêts sont multiples : 
- Pouvoir travailler hors connexion
- Simuler le front dans tous les cas possibles, souhaités et scénarisés (coucou les tests !)
- Avoir un front stable, sans être impacté par les changement de modèle, chute de webservices, etc

⚠️ Attention cependant : 
- Le front doit être toujours synchronisé avec les web services aussi bien au niveau des chemins d'accès aux ressources, qu'aux modèles des ressources
- Les mocks sont beaucoup plus rapides que les réponses des web services, une vision biaisée des perfs de l'application peut arriver. 

### A l'heure actuelle, comment mocke t-on ?
Il y a plusieurs façons de mocker. 

Des packages comme [json-server](https://www.npmjs.com/package/json-server) permettent de créer très rapidement et facilement une API REST en quelques minutes, qui viendra exposer des fichiers statiques en json par exemple. Il est possible évidemment de développer des interactions plus complexes. Cette technique est puissante, on redirige tous les appels vers un environnement que l'on peut maîtriser. Il y a quelques inconvénients, il faut lancer un serveur web en plus de notre application et une certaine logique existe pour débrancher vers le serveur de mock au lieu des vrais web services. De plus, la gestion des routes peut-être plus complexe. Si différents domaines peuvent être interrogés, on viendra taper dans tous les cas sur un seul serveur. On s'éloigne de plus en plus de la réalité de notre application en prod. On imite un comportement.

Une méthode encore plus simple consiste à créer des fichiers json au plus proche de nos composants et de les importer directement en dev. Très pratique pour développer nos besoins, mais impossible de partir en prod avec ça. En effet, les fichiers de mock seront poussés dans le build final et chaque composant / appel aura une mécanique spécifique pour, soit récupérer le json statique, soit appeler le web service. Avec cette méthode, on est encore plus loin de la réalité.

## MSW
Tout d'abord, qu'est ce qu'un service worker ? Un service worker agit comme un proxy entre une application web et votre navigateur. 
Il travaille dans un environnement cloisonné et a accès à des APIs plus bas niveau que l'application.

Web app -> Services workers -> Browser

On a souvent l'habitude de créer un serveur de mock sur lequel on tapera directement au lieu de taper sur les vrais services. Cela nous éloigne de la vraie implémentation. Il faut écrire du code pour expliquer qu'en local on tape sur tel URL, et une autre URL en environnement déployé, il faut maintenir cette logique, le code est pollué par une fonctionnalité non nécessaire à l'utilisateur.

Mock Service Worker permet d'intercepter certaines requêtes au niveau de la couche réseau de votre navigateur, via un service worker. 

Il fonctionne de façon totalement transparente en déclarant quelles routes doivent être interceptées, et ce qu'elles devront renvoyer. Il n'y a rien à faire dans l'implémentation fonctionnelle pour un appel mocké. Tout sera centralisé dans la configuration des mocks.

Tous les appels ne seront pas interceptés, seulement ceux déclarés dans le worker le seront.  

Bien évidemment, le code de mock ne sera pas dans le build final.

### Installation
[Doc officielle](https://mswjs.io/docs/getting-started/integrate/browser)
[Un projet complet d'exemple avec vitejs, msw et msw-ui, découpé par commit](https://github.com/johnmeunier/dojo-msw)

#### Front
```shell
npm install msw --save-dev
npm install cross-env --save-dev
npx msw init public/ --save
mkdir src/mocks
touch src/mocks/handlers.js
touch src/mocks/browser.js
```

Cross-env permet de supporter les variables d'environnements sur différentes plateformes (windows, mac, etc).

```js
// handlers.js
import { rest } from 'msw';
export const handlers = [
	rest.get('/quote', {
		"an": "awesome",
		"data": "quote"
	}),
];
```

```javascript
// src/mocks/browser.js
import { setupWorker } from 'msw'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```js
// src/index.js

// ...
if (process.env.REACT_APP_MOCK_ENABLED === 'true') {
	// eslint-disable-next-line global-require
	const { worker } = require('./mocks/browser');
	worker.start({
		onUnhandledRequest: 'warn',
	});
}
// ...
```

```json
// package.json
{
	"scripts" : {
		"start": "cross-env REACT_APP_MOCK_ENABLED=true react-scripts start",
	}
}
```

✅  En relançant votre commande `npm start` le service de mock devrait démarrer, si c'est bien le cas, vous allez voir dans la console de votre navigateur :

```
[MSW] Mocking enabled
```

[build: ajout de msw côté client](https://github.com/johnmeunier/dojo-msw/commit/a6111d3ea85d6efab63a2c88922e65862b5b7144)

#### Test
```shell
touch src/mocks/server.js
```

```js
// src/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```js
// src/setupTests.js
// ...
import { server } from 'mocks/server';

beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	jest.clearAllMocks();
	server.resetHandlers();
});
// ...
```


### Utilisation Front
####  Intercepter une requête : Request handler
##### Verb
- rest.get()
- rest.post()
- rest.put()
- rest.patch()
- rest.delete()
- rest.options()

Ces méthodes prennent deux paramètres : une URL et un callback que l'on détaillera dans la partie [[#Response resolver]].

Par exemple : 
```js

rest.get("https://une.url/:documentId", (req, res, ctx) => {
	//...
})

```

##### URL
- URL exacte :  `https://api.backend.dev/users`
- Path with wildcard :  `users/*`
- Path with parameters : `https://api.backend.dev/users/:userId` Le paramètre userId sera ensuite récupérable (req.params)
- Regexp : `/\/users\//`

#### Répondre à une requête : Response resolver
Voici un exemple complet que l'on va détailler : 
```js

rest.get("https://une.url/:documentId", (req, res, ctx) => {
	switch (req.params.documentId) {
		case 'id1':
			return res(ctx.status(200), ctx.json({"doc" : 1}));
		case 'id2':
			return res(ctx.status(200), ctx.json({"doc" : 2}));
		case 'id3':
			return res(ctx.status(200), ctx.json({"doc": 3}));
		default:
			return res(ctx.status(404));
		
		}
})

```

Le callback prend 3 paramètres :
| Parameter name                            | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| [req](https://mswjs.io/docs/api/request)  | Information sur la requête capturée        |
| [res](https://mswjs.io/docs/api/response) | Fonction pour créer le mock                |
| [ctx](https://mswjs.io/docs/api/context)  | Fonction de transformation pour la réponse |

La plupart du temps, il suffit de renseigner le statut et le contenu du body
```js
res(ctx.status(200), ctx.json({"id": 42}))
```

Dans cet exemple, on renvoie une 200 avec comme contenu un objet contenant simplement la clé `id` qui aura la valeur `42`.

Par exemple, vous pouvez utiliser un simple `fetch` dans votre projet : 

```javascript
fetch('https://swapi.dev/api/people/1').then(res => {
    res.json().then(data => console.log(data))
});
```

[feat: fetch basique](https://github.com/johnmeunier/dojo-msw/commit/eca6e3c4850af4af8b8509552480b1b90ac08ef9)

et essayer de le mocker.

[build: mock getPeople1](https://github.com/johnmeunier/dojo-msw/commit/28e72b91f3ab2f79d77275ea4e8a08113f9efce7)

##### Ajouter du délai
Il peut parfois être utile d'ajouter du délai pour simuler un spinner par exemple, avec le même exemple que précedemment : 

```js
res(ctx.status(200), ctx.delay(300), ctx.json({"id": 42}))
```

Un délai de 300ms sera ajouté à la réponse.

###### Autre chose qu'une 200
Le statut peut également être autre chose que 200. Vous pouvez donc simuler très facilement des cas d'erreur comme des 400, des 404 ou pire, des 500. vous pouvez également rendre plus précis des réponses ok avec des 204 par exemple. Pensez à ajouter le contenu de la réponse avec des précisions sur l'erreur, comme votre API le renverrait.

##### Organiser vos réponses
MSW propose d'utiliser un dossier `src/mocks/fixtures` pour stocker vos fichiers de données, au format json.

Par convention, nous stockons sous la forme `[verbHTTP][ressource].json`. 

Par exemple, si j'essaie de récupérer un devis (quote) : `getQuote.json`, si je souhaite mocker la réponse à une mise à jour d'un document : `putDocument.json`. Si beaucoup de verbes sont mockés pour un même appel, il ne faut pas hésiter à créer un dossier par ressource. 

```json
// src/mocks/fixtures/getQuote.json
{
	response: {
		"value": 42
	}
}
```

```js
rest.get(`${conf.apiEbusinessUrl}/quotes/:quoteId`, (req, res, ctx) =>
	res(ctx.status(200), ctx.json(getQuote)),
),
```

Préciser qu'il "faut" découper les handlers / fixtures selon le besoin. Voir exemple PEMA

##### Réponse complexe
Votre réponse peut être plus complexe. 

Vous pouvez par exemple renvoyer des résultats aléatoires : 

```js
import {getDocuments} from './fixtures/getDocuments'

// ...
rest.post(`${conf.apiEbusinessUrl}/insurance-quotes/:quoteId/search-documents`, (req, res, ctx) => {
	getDocuments.response.documents.sort(() => Math.random() - 0.5);
	return res(ctx.status(200), ctx.json(getDocuments));
}),
// ...
```

En fin de compte, vous pouvez faire ce que vous souhaitez dans la réponse.

##### Renseigner des headers
MSW vous propose évidement de renseigner des headers en passant à la méthode `ctx.set()` un objet.

``` javascript
ctx.set({
	'correlation-id': '2df53555-7058-4122-5c6d-000023c1681c',
	'feature': 'name=MY_PRODUCT',
})
```

##### Renvoyer une réponse différente au premier appel
Il est parfois utile d'envoyer qu'une seule fois une réponse, puis une réponse différentes les fois d'autres. 

Par exemple pour imiter un recalcul de tarification, qui devrait donc changer à chaque demande.

La méthode `res.once()` permet de le faire.

```js
rest.get("/quote/:id", (req, res, ctx) => {
		getQuote.anyValue = "1st time";
		return res.once(ctx.status(200), ctx.json(getQuote))
	}
),
rest.get("/quote/:id", (req, res, ctx) => {
		getQuote.anyValue = "2nd time";
		return res.once(ctx.status(200), ctx.json(getQuote))
	}
),
rest.get("/quote/:id", (req, res, ctx) => {
		getQuote.anyValue = "All others times";
		return res(ctx.status(200), ctx.json(getQuote))
	}
),
```

### Dans les tests 
Dans les tests, pourquoi ne pas mocker directement Axios ? Dans tous les cas il faut éviter de mocker une librairie. Vous créez une importante dépendance à cette librairie. Si par exemple vous souhaitez retourner sur fetch ou sur une autre librairie, vous devriez retravailler tous les tests.

Vous pouvez surcharger les mocks dans les tests spécifiquement 

```javascript
// monTest.steps.js
import { server } from 'mocks/server';

// ...
server.use(
	rest.put(`${conf.apiEbusinessUrl}/insurance-quotes/:quoteId`, (req, res, ctx) => res(ctx.status(200))),
	rest.post(`${conf.apiEbusinessUrl}/parameters`, (req, res, ctx) =>
		res(ctx.status(200), ctx.json(getParametersMachineDeductibleAmountList)),
	),
);
// ... 
```

Si vous faîtes des tests d'intégration avec du gherkin en utilisant par exemple jest-cucumber, tout prend sens.

Il est idéal d'intégrer ces surcharges dans des steps : 

```javascript
given('Je charge un devis en reprise', async () => {
	server.use(
		rest.get("/insurance-quotes/:quoteId", (req, res, ctx) => res(ctx.status(200), ctx.json(getQuoteReprise))),
	);
});
```

Et encore mieux si les données sont variabilisées et récupérées depuis un .feature.

```gherkin
Feature: Limite inférieure à la franchise

	Scenario Outline: Gestion de la validation du champ franchise
	Given Un devis rempli et une offre commerciale complète sont chargés avec une franchise limitée à "<minValue>"
	And J'accède à la page Tarif en tant que Siège,
	When Je renseigne pour le champ "Franchise" la valeur "<franchiseValue>"
	Then Le message d'erreur "<errorMessage>" lié à la valeur de la franchise "<status>" affichée
	Examples:
| minValue | franchiseValue | status | errorMessage |
| 500 | 400 | est | Montant mini: 500€ |
| 600 | 700 | n'est pas | Montant mini: 600€ |
| 500 | 1000.6 | est | La valeur doit être un nombre entier |
| 600 | 700 | n'est pas | La valeur doit être un nombre entier |
| 600 | 800.6 | est | La valeur doit être un nombre entier |
```

```javascript
const givenDevisWithFranchiseLimit = given => {
	given( /^Un devis rempli et une offre commerciale complète sont chargés avec une franchise limitée à "(.*)"$/, deductibleMinValue => {
		const offersCopy = cloneDeep(getOffers);
		set(offersCopy, deductibleMinValuePath, deductibleMinValue);
		server.use(
			rest.post("/insurancequotes/:quoteId", (req, res, ctx) => 
				res(ctx.status(200), ctx.json(getOffers)),
			),
			rest.get(`${conf.apiEbusinessUrl}/insurance-quotes/:quoteId`, (req, res, ctx) => 
				res(ctx.status(200), ctx.json(getQuote)),
			),
		);
	});
};
```

Dans cet exemple complet, on charge un devis via la première step Given. 
Ce devis vient d'un fichier json (getOffers). Tout le devis n'est pas stocké dans le .feature, ce serait bien trop lourd à gérer. Le fichier json est un devis générique, qui sera surchargé via les données renseignées dans le .feature.
On opère une copie de ce devis et on modifie une de ses clès en remplacant sa valeur par celle récupéré dans l'itération en cours de notre test, issue du .feature (deductibleMinValue).

## MSW-UI
MSW-UI est une extension qui fonctionne au dessus de MSW et qui permet de changer les mocks utilisés directement depuis le front, sans devoir relancer le serveur et sans interragir avec le code

Dans un premier temps, il faut ajouter le package en devDependencies : 

```shell
pnpm install msw-ui -D 
```

Il faut désormais exporter chaque scénario : 

```js
const getPeopleFr = rest.get("https://swapi.dev/api/people/1", (req, res, ctx) => {
	const getPeopleData = structuredClone(getPeople1);
	getPeopleData.name = "Luc Marcheur du ciel";
	return res(ctx.status(200), ctx.json(getPeopleData));
});

const getPeopleIt = rest.get("https://swapi.dev/api/people/1", (req, res, ctx) => {
	const getPeopleData = structuredClone(getPeople1);
	getPeopleData.name = "Lucas Camminatore del cielo";
	return res(ctx.status(200), ctx.json(getPeopleData));
});
```

Et les exporter sous la forme d'un objet, et non plus un tableau : 

```js
export const handlers = { getPeopleFr, getPeopleIt };
```

La configuration côté navigateur changé également un petit peu : 

```js
import { setupWorker } from "msw";
import { register } from "msw-ui";
import { handlers } from "./handlers";
export const worker = setupWorker();
register(worker, handlers);
```

Côté client, il suffit d'appeler la méthode `setScenario` pour choisir quel scénario sera utilisé, si cet méthode n'est pas utilisé au moins une fois, sur l'appel que l'on souhaite mocker, il ne sera pas mocké, voici un exemple complet d'une page : 

```js
import React, { useState, useEffect } from "react";
import { setScenario } from "msw-ui";

const App = () => {
	const [name, setName] = useState("");

	const retrievePeople1 = () => {
		fetch("https://swapi.dev/api/people/1").then((res) => {
			res.json().then((data) => setName(data.name));
		});
	};

	useEffect(() => {
		retrievePeople1();
	}, []);

	return (
		<div className="App">
			<h1>{name}</h1>
			<button
				onClick={() => {
					setScenario("getPeopleFr");
					retrievePeople1();
				}}> Fr version </button>
			<button
				onClick={() => {
					setScenario("getPeopleIt");
					retrievePeople1();
				}}> It version </button>
		</div>
	);
};

export default App;
```

[feat(msw): ajout de msw-ui](https://github.com/johnmeunier/dojo-msw/commit/371ebebb9bdad3a3276040fab6ce77af608ae19c)

## Et si on créait des scénarios complets ?
Maintenant que l'on sait créer des handlers uniques pour chaque appels, pourquoi ne pas créer des scénarios complets, correspondant à des états différents de notre application. De façon générique, voici quelques exemples pour un projets de gestions de contenus : 
- Je crée du nouveau contenu
- J'ai déjà créé du contenu
- Je n'ai pas les droits 
- Mes appels API partent en erreurs

Ces exemples sont très génériques, selon votre application, il existe plein de possibilité. 
Voici un exemple d'implémentation avec msw-ui : 

```javascript
// handlers.js
export const handlers = {
	getQuote: rest.get(`${conf.apiUrl}/insurance-quotes/:quoteId`, (req, res, ctx) =>
		res(ctx.delay(), ctx.status(200), ctx.json(getQuote)),
	),
	getQuoteReprise: rest.get(`${conf.apiUrl}/insurance-quotes/:quoteId`, (req, res, ctx) =>
		res(ctx.delay(), ctx.status(200), ctx.json(getQuoteReprise)),
	),
	getQuote500: rest.get(`${conf.apiUrl}/insurance-quotes/:quoteId`, (req, res, ctx) =>
		res(ctx.delay(), ctx.status(500), ctx.json(getQuote500))
	),
	getProducts: rest.get(`${conf.referentielProduitsUrl}/products`, (req, res, ctx) =>
		res(ctx.status(200), ctx.json(getProducts)),
	),
	// ...
}

export const mockNew : () => {
	['getQuote', 'getProducts'].forEach(id => setScenario(id));
}

export const mockReprise : () => {
	['getQuoteReprise', 'getProducts'].forEach(id => setScenario(id));
}

export const mockError : () => {
	['getQuote500', 'getProducts'].forEach(id => setScenario(id));
}
```

```javascript
// browser.js
import { setupWorker } from 'msw';
import { register } from 'msw-ui';
import { handlers, mockError } from './handlers';

export const worker = setupWorker();

register(worker, handlers);

mockError();
```

Dans ce scénario, l'application démarrera en erreur sur l'appel permettant de récupérer une `quote`.

Libre à vous de développer des dev tools, vous permettant de switcher à la volée entre ces scénarios.

Cette logique est également applicable si vous n'utilisez pas `msw-ui`.

## Jusqu'où doit-on aller dans les mocks
Comme vous l'avez compris, un mock est une réponse statique, sans intelligence ni logique métier. Cependant, le principe est de rendre nos applications durant le développement le plus utilisable possible, dans des conditions le plus proche possible de la production. 

Il ne faut en aucun cas écrire tout ce qu'une API pourrait faire, implémenter de la logique métier etc. 

Le plus compliqué est de réussir à écrire le moins de logique possible afin de rendre notre application fonctionnel, pour les démos ou simplement pour pouvoir développer sereinement. 

Un exemple simple, est par exemple de rendre mutable les données récupérés en `get` si elles peuvent être modifié par un `put` : 

```javascript
import getQuote from './fixtures/getQuote.json';

let quote = getQuote;

export const handlers = [
	rest.get(`${conf.apiEbusinessUrl}/insurance-quotes/:quoteId`, (req, res, ctx) =>
		res(ctx.status(200), ctx.json(quote)),
	),
	rest.put(`${conf.apiEbusinessUrl}/insurance-quotes/:quoteId`, (req, res, ctx) => {
		quote = JSON.parse(req.body).request;
		return res(ctx.status(200), ctx.json(quote));
	})
]
```

## Développer avant l'API
## Cohabitation avec l'authentification
Les services workers ont une spécificité : plusieurs ne peuvent être enregistrés sur le même scope. Cela peut poser plusieurs problèmes notamment si vous utilisez le service d'authentification [auth-worker](https://github.com/AxaGuilDEv/auth-worker)

Afin de remédier à ce problème, nous avons pris une décision radicale sur nos projets : ne pas lancer les mocks et l'authentification en même temps. 

Lorsque nous sommes en local, nous n'avons pas besoin de l'authentification, donc nous lançons seulement les mocks. Lorsque nous sommes sur un environnement déployé, les mocks ne sont pas lancés mais nous sommes authentifié. Cependant, avec cette configuration, nous sommes obligé de mocker tous les appels nécessitant de l'authentification. 

Dans les faits, en local, nous sommes obligés de mocker également les données d'authentification, parfois nécessaire à certains composants afin de connaître le profil de l'utilisateur connecté ou pour afficher ses informations par exemple. Cela dépendra de votre implémentation. De notre côté, nous avons créer un context qui stocke les données utilisateur et nous mockons ce contexte.

Par exemple côté front : 

```js
if (process.env.REACT_APP_MODE_LOCAL !== 'true') {
	const userinfos = await getUserInfos();
	setUser(userinfos);
} else {
	setUser({
		name: 'John Doe',
		type: '1',
	});
}
```
