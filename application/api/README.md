# Sympl Chat GUI

## Development
### Requires:
Version >v2.0.0 of the Symbiont Assembly SDK, running >v4.3.0

`jq`
`sym` This can be installed from the SDK docs in customer portal

Install modules with `npm install`

### Building and running a local-network
`npm run build` 

This will run the build script `build.sh`. It will start a local-network named chat, publish the chat contract (located at `<git_dir>/application/api/`), then generate the routes to the api from a handlebars template file. If for some reason this fails, you can run `npm run wipe` which will run `sym local-network stop` and `sym local-network delete` on the local-network named chat. You can manually specify a different port by running `npm run build <port_number>`. This passes a `--port` argument into the local-network creation command. This script uses port 18888 as the default base port. 

### Running the Application Server
`npm start`

The application server can also be run on a different port or node by specifying parameters like the following: `npm start port=<port_num> node=<node_num>`. 

An example command would be: `npm start port=8082 node=1`.

### Testing
Testing is implemented with Mocha, Sinon and Chai, and can be run with the command:
`npm run test`

### UI

The UI uses some aspectes of the Javascript API (`fetch()` and websockets) which may not be supported in some browsers. The below list is the untested, non-exhaustive list of supported browsers (produced with info from [MDN](https://developer.mozilla.org)). It has been tested and works on Firefox 91.0.2 and Safari 14.1.2

Chrome >42
Edge >14
Firefox >39
Opera >29
Safari >10.1
Internet Explorer: NO
