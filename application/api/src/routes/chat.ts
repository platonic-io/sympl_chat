import Handlebars, { template } from 'handlebars';
import { chat } from '../assembly-wrapper';
import Koa from 'koa';
import * as fs from 'fs';

//register a helper to convert the js function names from
//camelCase to lowercase and underscore
Handlebars.registerHelper('underscore', (item : string) => {
    return item.toString().replace( /([A-Z])/g, "_$1").toLowerCase()
})

Handlebars.registerHelper('person', (item : string) => {
    return item.toString().includes("member") || item.toString().includes("owner")
})

//generate the Handlebars template
const assembly_routes = Handlebars.compile(fs.readFileSync(`${__dirname}/chat.ts.hbs`).toString())

//create an object to pass to the template
let function_meta = {"functions" : []}

//get all the function names (from the imported model)
const chat_function_names = Object.getOwnPropertyNames(Object.getPrototypeOf(chat))
    .filter(func_name => func_name != "teardown" && func_name != "constructor");

//get the actual js code of the contract (this is so we can get the parameter names)
const contract_definition = fs.readFileSync(`${__dirname}/../../@assembly/contract.js`).toString();

//poplate the function meta data with json that looks like:
/* 
{
    functions : [
        {"name" : "myFunctionName", "parameters" : ["myFunctionParameters"...]}
    ]    
}
*/
for(let i in chat_function_names) {    
    let name = chat_function_names[i];
    let regex = new RegExp(`async ${name}\\((.*)\\)`, 'g');
    //push the new function meta object
    function_meta["functions"].push({
        "name" : chat_function_names[i],
        //read the actual code and use a regex and .split() to extract the parameter names
         parameters : [...contract_definition.matchAll(regex)][0][1].split(',')
                        .filter(param => param != "keyAlias")
                        .map(Function.prototype.call, String.prototype.trim)
    });
}

//generate the template and write it to a file
const template_chat_routes :string = assembly_routes(function_meta)
fs.writeFileSync(`${__dirname}/generated_chat.ts`, template_chat_routes);

//import from the newly created file and export the modules
import { assembly_api } from './generated_chat';
export const chat_routes : Koa = assembly_api;
