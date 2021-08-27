# Sympl Chat GUI

## Development
### Requires:
Version >v2.0.0 of the Symbiont Assembly SDK, running >v4.3.0

`jq`
`sym` This can be installed from the SDK docs in customer portal

Install modules with `npm install`

### Building and running a mock-network
`npm run build` 

This will run the build script `build.sh`. It will start a mock-network named chat, publish the chat contract (located at `<git_dir>/application/api/`), then generate the routes to the api from a handlebars template file. If for some reason this fails, you can run `npm run wipe` which will run `sym mock-network stop` and `sym mock-network delete` on the mock-network named chat. You can manually specify a different port by running `npm run build <port_number>`. This passes a `--port` argument into the mock-network creation command. This script uses port 18888 as the default base port. 

### Running the Application Server
`npm start`

### Testing
Testing is implemented with Mocha, Sinon and Chai, and can be run with the command:
`npm run test`