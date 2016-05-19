'use strict';

export default function (sequelize, DataTypes) {
  const InterviewFollowUp = sequelize.define('InterviewFollowUp', {
    id: {
      type: DataTypes.INTEGER(14),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true
    },
    created_by:{
      type: DataTypes.INTEGER(14),
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'interview_follow_ups',
    timestamps: false,
    underscored: true,

    classMethods: {
      associate(models) {
        InterviewFollowUp.belongsTo(models.FollowUpOption,{
          foreignKey: 'follow_up_option_id'
        })
      }
    }
  });

  return InterviewFollowUp;
};

