"use strict";
module.exports = (sequelize, DataTypes) => {
  const Barang = sequelize.define(
    "Barang",
    {
      id_barang: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      kode_barang: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      nama_barang: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ukuran: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      jenis_barang: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Status persetujuan dari kepala_produksi
      status_kepala_produksi: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      // Status persetujuan dari manager
      status_manager: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
      // Status persetujuan dari direktur
      status_direktur: {
        type: DataTypes.STRING,
        defaultValue: null,
      },
    },
    {
      tableName: "barang",
      timestamps: true,
    }
  );

  Barang.associate = function (models) {
    Barang.hasMany(models.LogApproval, {
      foreignKey: "id_barang",
      as: "logApprovals",
    });
    Barang.belongsTo(models.User, {
      foreignKey: "id_user",
      as: "user",
    });
  };

  return Barang;
};
