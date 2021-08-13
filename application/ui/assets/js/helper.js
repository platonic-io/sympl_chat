let js_dir = "/assets/js"
let includes = [
    {"src":"/primus/primus.js"},
    {"src":`${js_dir}/api.js`},
    {"src":`${js_dir}/primus.js`, "defer": true}
]

for(let script_path of includes) {
    let script = document.createElement("script");
    script.src = script_path.src;
    if(script_path.defer) {
        script.defer =true;
    };
    document.head.appendChild(script);
}