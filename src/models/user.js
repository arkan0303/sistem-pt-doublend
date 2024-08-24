"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id_user: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );
  User.associate = function (models) {
    User.hasMany(models.Barang, {
      foreignKey: "id_user",
      as: "barangs",
    });

    User.hasMany(models.LogApproval, {
      foreignKey: "id_user",
      as: "logApprovals",
    });
  };
  return User;
};
