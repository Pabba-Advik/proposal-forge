# Enterprise Proposal Generation Platform
  
This is a project built using [cursor](https://cursor.dev) as its backend.
   
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `cursor` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [cursor Auth](https://auth.cursor.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [cursor docs](https://docs.cursor.dev/) for more information on how to develop with cursor.
* If you're new to cursor, the [Overview](https://docs.cursor.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.cursor.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.cursor.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `cursor/router.ts` file. We split these routes into a separate file from `cursor/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
# proposal-forge

## 👥 Team Members

| Name            | Role         | GitHub                           |
|-----------------|--------------|----------------------------------|
| Pabba Advik     | React Dev    | [@Pabba-Advik](https://github.com/Pabba-Advik) |
| Nanda Kishor    | Java Dev     | [@Nandakishor900](https://github.com/Nandakishor900) |
| Samanth Vajjala | Python  Dev  | [@SamanthVajjala](https://github.com/SamanthVajjala)|
