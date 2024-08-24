"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("barang", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "", // Set default value to empty string
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("barang", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "dikirim", // Revert to old default value if rolling back
    });
  },
};
