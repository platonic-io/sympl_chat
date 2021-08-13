var primus = new Primus('http://localhost:8081/primus', { websockets: true });
primus.on('open', () => {
    console.log("test")
    primus.write({ "initial_message": 
                        { "username": localStorage["username"] } 
                })
})

primus.on("data", (data) => {
    console.log(data)
})
