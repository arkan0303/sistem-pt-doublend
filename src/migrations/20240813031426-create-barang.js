"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("barang", {
      id_barang: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      kode_barang: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nama_barang: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ukuran: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      jenis_barang: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jumlah: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "dikirim",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("barang");
  },
};
