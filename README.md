# Chat smart contract

## Introduction

This smart contract repository is a sample "Chat" `symPL` contract. Hereby included are:
- the smart contract `hello.sympl`
- the contract definition `contract.yaml`
- A thorough suite of tests to validate the smart contract in various ways

## Tests structure

The Chat contract is equipped with a thorough set of tests:

- chat_model_test performs model testing against chat_model
- coverage_test performs basic interface regression testing
- demo_test tests a plausible customer demo
- spec_test stress tests the contract
- events_test tests the event system

## Contributing 

Anyone is welcome to contribute to this repository, be it in the form of features, bug fixes, documentation or additional
tests. 
Please create a branch of your own and submit for merge via merge request. A codeowner will be assigned your merge request
and provide feedback/merge it. 

## Running tests

Requirements:
- Install the [pytest plugin](https://iportal.symbiont.io/sdk_docs/docs/testing/index/index.html)
- Have a mock-network running (we recommend using `sym` to get a mock network up and running quickly)

Steps: 
- Change directory to the root of this repository
- Run the following command:
```shell
pytest test/<test file name>.py --network-config=~/.symbiont/assembly-dev/mock-network/default/network-config.json --contract-path=./
```

