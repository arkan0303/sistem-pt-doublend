"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("barang", "id_user", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Jika id_user adalah foreign key, tambahkan constraint berikut
    await queryInterface.addConstraint("barang", {
      fields: ["id_user"],
      type: "foreign key",
      name: "fk_user_barang", // Nama constraint (opsional)
      references: {
        table: "users",
        field: "id_user",
      },
      onDelete: "SET NULL",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("barang", "fk_user_barang");
    await queryInterface.removeColumn("barang", "id_user");
  },
};
