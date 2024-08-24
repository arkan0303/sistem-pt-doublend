"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("logapprovals", "role", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "unknown", // Default value if needed
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("logapprovals", "role");
  },
};
