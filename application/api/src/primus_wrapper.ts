import Primus from 'primus';

export const create_primus = (server) : Primus => {
    const primus = new Primus(server, {
        transformer: "websockets"
    })
    
    primus.on('connection', function(spark) {
        console.log('hi')
        spark.write('hi')
    })

    return primus;
}