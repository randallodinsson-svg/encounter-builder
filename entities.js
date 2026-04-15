// entities.js — placeholder entity registry

(function () {
  const Entities = {
    list: [],
    start() {
      console.log("Entities — online.");
    },
    update(dt) {},
  };

  APEX.register("entities", Entities);
})();
