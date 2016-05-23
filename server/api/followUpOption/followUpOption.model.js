'use strict';

export default function (sequelize, DataTypes) {
  const FollowUpOption = sequelize.define('FollowUpOption', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    name: DataTypes.STRING(50),
    description: DataTypes.STRING(50),
    class: DataTypes.STRING(50)
  }, {
    tableName: 'follow_up_options',
    timestamps: false,
    underscored: true,

    classMethods: {
      associate(models) {

      }
    }
  });

  return FollowUpOption;
};

