module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("logapprovals", "id_user", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id_user",
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("logapprovals", "id_user");
  },
};
