

export default function (sequelize, DataTypes) {
  const State = sequelize.define('State', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      validate: {
        len: {
          args: [0, 255],
          msg: 'Maximum length for name field is 255',
        },
      },
    },
    parent_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'parent_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for parent_id field is 11',
        },
      },
    },
    lft: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'lft field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for lft field is 11',
        },
      },
    },
    rght: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'rght field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for rght field is 11',
        },
      },
    },
    config: {
      type: DataTypes.STRING(1000),
      validate: {
        len: {
          args: [0, 20],
          msg: 'Maximum length for color field is 20',
        },
      },
    },
    status: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'status field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for status field is 1',
        },
      },
      defaultValue: 1,
    },
    updated_on: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'states',
    timestamps: false,
    underscored: true,
    defaultScope: {
      where: { status: 1 },
    },

    classMethods: {
      associate(models) {
        State.belongsTo(models.State, {
          as: 'Parent',
          foreignKey: 'parent_id',
        });

        State.hasMany(models.ActionableState, {
          as: 'Actions',
          foreignKey: 'state_id',
        });

        State.hasMany(models.ApplicantState, {
          defaultScope: {
            order: 'id DESC',
          },
        });

        State.hasMany(models.State, {
          as: 'Childs',
          foreignKey: 'parent_id',
        });
        State.hasMany(models.FollowUpOption);
      },
    },
  });

  return State;
}
