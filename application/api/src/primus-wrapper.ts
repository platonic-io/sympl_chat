import Primus from "primus";

export const create_primus = (server): Primus => {
  const primus = new Primus(server, {
    transformer: "websockets",
  });

  return primus;
};
