# Manual

**Host de frontend por defecto: localhost:80**

## Cómo ejecutar los microservicios de forma simultánea (docker + docker-compose)

1. Tener docker instalado.
2. Abrir docker (para ejecutar la mv de docker).
3. Copiar el contenido `default_config.docker.toml` y pegarlo en un archivo llamado `config.docker.toml`.
4. Rellenar `config.docker.toml` con los datos necesarios. Por ejemplo: MONGODB_URI="mongodb+srv://username:password@cluster0.rfz8f.mongodb.net/".
5. `docker compose build`
6. `docker compose up`

**Si no funciona "docker compose" prueba con `docker-compose build` (con "-")**.

## Cómo ejecutar el frontend con docker

1. Tener docker instalado
2. Abrir docker (para ejecutar la mv de docker).
3. Navegar hacia el directorio del frontend del proyecto en un CLI.
4. `docker compose build`
5. `docker compose up`
6. Abrir la app en localhost:5173

**Si no funciona "docker compose" prueba con `docker-compose build` (con "-")**.

## Cómo ejecutar backend sin docker

1. Tener go instalado.
2. Copiar el contenido `default_config.toml` y pegarlo en un archivo llamado `config.toml`.
3. Abrir el directorio de microservicio (Por ejemplo: `cd ./gateway`).
4. Rellenar `config.toml` con los datos necesarios. Por ejemplo: MONGODB_URI="mongodb+srv://username:password@cluster0.rfz8f.mongodb.net/".
5. `go run main.go`

**La diferencia entre config.toml y config.docker.toml es que en uno llamamos el host de cada microservio por "localhost" y en el otro por el nombre del servicio en docker-compose.**

## Cómo ejecutar frontend sin docker

1. Tener Node.js instalado
2. Ejecutar 'npm install' en el directorio del frontend
3. 'npm run dev'
4. Navegar a <http://localhost:5173/>

Estructura del repositorio:

```bash
├── clientexample
├── docker-compose.yml
├── docs
│   ├── component__Diagramas_de_Componentes.png
│   ├── deployment__Diagrama_de_Despliegue.png
│   ├── Gateway.postman_collection.json
│   ├── ifml.json
│   ├── UML.mdzip
│   └── UML.mdzip.bak
├── MEMORIA - PRÁCTICA 2.pdf
├── MEMORIA - PRÁCTICA 3.pdf
├── README.md
└── src
    ├── backend
    │   ├── auth
    │   │   ├── config
    │   │   │   └── auth_config.go
    │   │   ├── Dockerfile
    │   │   ├── docs
    │   │   │   ├── docs.go
    │   │   │   ├── swagger.json
    │   │   │   └── swagger.yaml
    │   │   ├── go.mod
    │   │   ├── go.sum
    │   │   ├── handler
    │   │   │   └── auth_handler.go
    │   │   ├── main.go
    │   │   ├── model
    │   │   │   └── auth_model.go
    │   │   ├── README.md
    │   │   └── router
    │   │       └── auth_router.go
    │   ├── comment
    │   │   ├── config
    │   │   │   └── comment_config.go
    │   │   ├── database
    │   │   │   └── comment_database.go
    │   │   ├── Dockerfile
    │   │   ├── docs
    │   │   │   ├── docs.go
    │   │   │   ├── swagger.json
    │   │   │   └── swagger.yaml
    │   │   ├── go.mod
    │   │   ├── go.sum
    │   │   ├── handler
    │   │   │   └── comment_handler.go
    │   │   ├── main.go
    │   │   ├── model
    │   │   │   └── comment_model.go
    │   │   └── router
    │   │       └── comment_router.go
    │   ├── default_config.docker.toml
    │   ├── default_config.toml
    │   ├── docker-compose.yml
    │   ├── entry
    │   │   ├── config
    │   │   │   └── entry_config.go
    │   │   ├── database
    │   │   │   └── entry_database.go
    │   │   ├── Dockerfile
    │   │   ├── docs
    │   │   │   ├── docs.go
    │   │   │   ├── swagger.json
    │   │   │   └── swagger.yaml
    │   │   ├── go.mod
    │   │   ├── go.sum
    │   │   ├── handler
    │   │   │   └── entry_handler.go
    │   │   ├── main.go
    │   │   ├── model
    │   │   │   └── entry_model.go
    │   │   └── router
    │   │       └── entry_router.go
    │   ├── gateway
    │   │   ├── config
    │   │   │   └── gateway_config.go
    │   │   ├── Dockerfile
    │   │   ├── docs
    │   │   │   ├── docs.go
    │   │   │   ├── swagger.json
    │   │   │   └── swagger.yaml
    │   │   ├── go.mod
    │   │   ├── go.sum
    │   │   ├── handler
    │   │   │   ├── gateway_health.go
    │   │   │   └── gateway_proxy.go
    │   │   ├── main.go
    │   │   ├── middleware
    │   │   │   └── gateway_middleware.go
    │   │   └── router
    │   │       └── gateway_router.go
    │   ├── Makefile
    │   ├── media
    │   │   ├── config
    │   │   │   └── media_config.go
    │   │   ├── database
    │   │   │   └── media_database.go
    │   │   ├── Dockerfile
    │   │   ├── docs
    │   │   │   ├── docs.go
    │   │   │   ├── swagger.json
    │   │   │   └── swagger.yaml
    │   │   ├── go.mod
    │   │   ├── go.sum
    │   │   ├── handler
    │   │   │   └── media_handler.go
    │   │   ├── main.go
    │   │   ├── model
    │   │   │   └── model_media.go
    │   │   └── router
    │   │       └── media_router.go
    │   ├── swagger-config.json
    │   ├── version
    │   │   ├── config
    │   │   │   └── version_config.go
    │   │   ├── database
    │   │   │   └── version_database.go
    │   │   ├── Dockerfile
    │   │   ├── docs
    │   │   │   ├── docs.go
    │   │   │   ├── swagger.json
    │   │   │   └── swagger.yaml
    │   │   ├── go.mod
    │   │   ├── go.sum
    │   │   ├── handler
    │   │   │   └── version_handler.go
    │   │   ├── main.go
    │   │   ├── model
    │   │   │   └── version_model.go
    │   │   └── router
    │   │       └── version_router.go
    │   └── wiki
    │       ├── config
    │       │   └── wiki_config.go
    │       ├── database
    │       │   └── wiki_database.go
    │       ├── Dockerfile
    │       ├── docs
    │       │   ├── docs.go
    │       │   ├── swagger.json
    │       │   └── swagger.yaml
    │       ├── go.mod
    │       ├── go.sum
    │       ├── handler
    │       │   └── wiki_handler.go
    │       ├── main.go
    │       ├── model
    │       │   └── wiki_model.go
    │       └── router
    │           └── wiki_router.go
    └── frontend
        ├── deno.lock
        ├── docker-compose.yml
        ├── Dockerfile
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── public
        │   └── vite.svg
        ├── src
        │   ├── api
        │   │   ├── Api.js
        │   │   ├── CommentApi.js
        │   │   ├── EntryApi.js
        │   │   ├── MediaApi.js
        │   │   ├── VersionApi.js
        │   │   └── WikiApi.js
        │   ├── App.jsx
        │   ├── components
        │   │   ├── Comentario.jsx
        │   │   ├── ConfirmationModal.jsx
        │   │   ├── EntradaCard.jsx
        │   │   ├── Footer.jsx
        │   │   ├── Header.jsx
        │   │   ├── SearchResultsList.jsx
        │   │   ├── ToastMessage.jsx
        │   │   ├── VersionCard.jsx
        │   │   ├── Version.jsx
        │   │   └── WikiCard.jsx
        │   ├── context
        │   │   ├── ToastContext.jsx
        │   │   └── ToastProvider.jsx
        │   ├── layout
        │   │   └── MainLayout.jsx
        │   ├── main.jsx
        │   ├── pages
        │   │   ├── AdvancedSearchPage.jsx
        │   │   ├── EntradaPage.jsx
        │   │   ├── FormVersionPage.jsx
        │   │   ├── FormWikiPage.jsx
        │   │   ├── HomePage.jsx
        │   │   ├── VersionPage.jsx
        │   │   └── WikiPage.jsx
        │   └── styles
        │       └── theme.js
        └── vite.config.js

85 directories, 207 files
```
