"use strict";
module.exports = (sequelize, DataTypes) => {
  const LogApproval = sequelize.define(
    "LogApproval",
    {
      id_log_approval: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      id_barang: {
        type: DataTypes.INTEGER,
        references: {
          model: "barang",
          key: "id_barang",
        },
        allowNull: false,
      },
      id_user: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id_user",
        },
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tanggal: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "logapprovals",
      timestamps: true,
    }
  );

  LogApproval.associate = function (models) {
    LogApproval.belongsTo(models.Barang, {
      foreignKey: "id_barang",
      as: "barang",
    });

    LogApproval.belongsTo(models.User, {
      foreignKey: "id_user",
      as: "user",
    });
  };

  return LogApproval;
};
