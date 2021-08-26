//if you don't have a username yet
if(!localStorage.username && window.location.pathname !== "/") {
    window.location.href = "/";
}

let js_dir = "/assets/js"
let js_file = window.location.pathname + ".js"
if(js_file === "/.js") {
    js_file = "/index.js";
}
let includes = [
    {"src":`${js_dir}/api.js`},
    {"src":`${js_dir}${js_file}`, "defer": true}
]

for(let script_path of includes) {
    let script = document.createElement("script");
    script.src = script_path.src;
    if(script_path.defer) {
        script.defer ="defer";
    };
    document.head.appendChild(script);
}