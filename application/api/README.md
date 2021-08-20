# Sympl Chat GUI

## Development
### Requires:
Version >v2.0.0 of the Symbiont Assembly SDK, running >v4.3.0

`jq`
`sym` This can be installed from the SDK docs in customer portal

Install modules with `npm install`

### Building and running a mock-network
`npm run build` 

This will run the build script `build.sh`. It will start a mock-network named chat, publish the chat contract (located at `<git_dir>/`), then generate the routes to the api from a handlebars template file.

### Running the Application Server
`npm start`