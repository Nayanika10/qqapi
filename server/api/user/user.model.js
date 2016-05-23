

const crypto = require('crypto');
const salt = 'DYhG93b0fIxfs2guVoUubasdfajfkljasdjfaklsdjflakrfWwvniR2G0FgaC9mi';
const _ = require('lodash');

export default function (sequelize, DataTypes) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER(11),
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      validate: {
        len: {
          args: [0, 100],
          msg: 'Maximum length for name field is 100',
        },
      },
      allowNull: false,
    },
    firstname: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for firstname field is 50'
        }
      },
      allowNull: false
    },
    lastname: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for lastname field is 50'
        }
      },
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(32),
      validate: {
        len: {
          args: [0, 32],
          msg: 'Maximum length for username field is 32',
        },
      },
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(32),
      validate: {
        len: {
          args: [7, 32],
          msg: 'password field length should be between 7 and 32',
        },
      },
      allowNull: false,
    },
    number: {
      type: DataTypes.INTEGER(15),
      validate: {
        isInt: {
          msg: 'number field should be an integer',
        },
        len: {
          args: [0, 15],
          msg: 'Maximum length for number field is 15',
        },
      },
      allowNull: false,
    },
    is_active: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'is_active field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for is_active field is 1',
        },
      },
      allowNull: false,
      defaultValue: 1,
    },
    email_id: {
      type: DataTypes.STRING(64),
      validate: {
        len: {
          args: [0, 64],
          msg: 'Maximum length for email_id field is 64',
        },
      },
      allowNull: false,
    },
    consultant_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'consultant_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for consultant_id field is 11',
        },
      },
    },
    recruiter_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'recruiter_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for recruiter_id field is 11',
        },
      },
    },
    candidate_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'candidate_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for candidate_id field is 11',
        },
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: false,
    underscored: true,
    instanceMethods: {
      verifyPasswordAsync: function verifyPassword(password) {
        const hashedPass = crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
        return (hashedPass === this.password) ?
          _.pick(this.toJSON(), ['id']) : new Error('Check password!');
      },
      verifyPassword: function verifyPassword(password, cb) {
        const hashedPass = crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
        return (hashedPass === this.password) ?
          cb(null, this.toJSON()) : cb(new Error('Check password!'));
      },

      hashPassword: function hashPassword(password) {
        return crypto
          .createHash('md5')
          .update(salt + password)
          .digest('hex');
      },
    },

    classMethods: {
      associate(models) {
        User.belongsTo(models.Client, {
          foreignKey: 'client_id',
        });

        User.hasMany(models.UserTawktoToken);
        // User.belongsTo(models.Group, {
        //  foreignKey: 'group_id',
        // });
        //
        // User.hasMany(models.App);
        // User.hasMany(models.AccessToken);
        // User.hasMany(models.RefreshToken);
        // User.hasMany(models.ApplicantDownload);
        // User.hasMany(models.ApplicantState);
        // User.hasMany(models.ApplicantView);
        // User.hasMany(models.Comment);
        // User.hasMany(models.JobAllocation);
        // User.hasMany(models.JobDownload);
        // User.hasMany(models.JobView);
        // User.hasMany(models.Job);
        // User.hasMany(models.Notification);
        // User.hasMany(models.UsageLog);
        // User.hasMany(models.JobComment);
      },
    },

    hooks: {
      beforeCreate: function beforeCreate(instance) {
        if (instance.changed('password')) {
          instance
            .set('password', instance.hashPassword(instance.password));
        }
      },

      beforeUpdate: function beforeUpdate(instance) {
        if (instance.changed('password')) {
          instance
            .set('password', instance.hashPassword(instance.password));
        }
      },
    },
  });

  return User;
}

