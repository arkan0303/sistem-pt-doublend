"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("barang", "status_kepala_produksi", {
      type: Sequelize.STRING,
      defaultValue: null,
    });
    await queryInterface.addColumn("barang", "status_manager", {
      type: Sequelize.STRING,
      defaultValue: null,
    });
    await queryInterface.addColumn("barang", "status_direktur", {
      type: Sequelize.STRING,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("barang", "status_kepala_produksi");
    await queryInterface.removeColumn("barang", "status_manager");
    await queryInterface.removeColumn("barang", "status_direktur");
  },
};
