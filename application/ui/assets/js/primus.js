var primus = new Primus('http://localhost:8081/primus', {websockets: true});


primus.on('open', () => {
    console.log("test")
})

primus.on("data", (data) => {
    console.log(data)
})