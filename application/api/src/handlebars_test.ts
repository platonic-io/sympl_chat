import Handlebars from "handlebars";

const template = Handlebars.compile("{{foo}}")

console.log(template({"foo": "bar"}))

