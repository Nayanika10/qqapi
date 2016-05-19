
module.exports = function ClientModel(sequelize, DataTypes) {
  const Client = sequelize.define('Client', {
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
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(1000),
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Maximum length for description field is 1000',
        },
      },
      allowNull: false,
    },
    short_description: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for description field is 1000',
        },
      },
      allowNull: false,
    },
    pan_number: {
      type: DataTypes.STRING(10),
      validate: {
        len: {
          args: [0, 10],
          msg: 'Maximum length for pan_number field is 10',
        },
      },
    },
    pan_verified: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'pan_verified field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for pan_verified field is 1',
        },
      },
    },
    tan_number: {
      type: DataTypes.STRING(10),
      validate: {
        len: {
          args: [0, 10],
          msg: 'Maximum length for tan_number field is 10',
        },
      },
    },
    tan_verified: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'tan_verified field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for tan_verified field is 1',
        },
      },
    },
    service_tax_reg_number: {
      type: DataTypes.STRING(15),
      validate: {
        len: {
          args: [0, 15],
          msg: 'Maximum length for service_tax_reg_number field is 15',
        },
      },
    },
    service_tax_enabled: {
      type: DataTypes.STRING(15),
      validate: {
        isInt: {
          msg: 'service_tax_enabled field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for service_tax_enabled field is 1',
        },
      },
    },
    company_reg_name: {
      type: DataTypes.STRING(255),
      validate: {
        len: {
          args: [0, 255],
          msg: 'Maximum length for company_reg_name field is 255',
        },
      },
    },
    reg_address: {
      type: DataTypes.STRING(500),
      validate: {
        len: {
          args: [0, 500],
          msg: 'Maximum length for reg_address field is 500',
        },
      },
    },
    corp_address: {
      type: DataTypes.STRING(500),
      validate: {
        len: {
          args: [0, 500],
          msg: 'Maximum length for corp_address field is 500',
        },
      },
    },
    min_emp: {
      type: DataTypes.INTEGER(10),
      validate: {
        isInt: {
          msg: 'min_emp field should be an integer',
        },
        len: {
          args: [0, 10],
          msg: 'Maximum length for min_emp field is 10',
        },
      },
    },
    max_emp: {
      type: DataTypes.INTEGER(10),
      validate: {
        isInt: {
          msg: 'max_emp field should be an integer',
        },
        len: {
          args: [0, 10],
          msg: 'Maximum length for max_emp field is 10',
        },
      },
    },
    website: {
      type: DataTypes.STRING(500),
      validate: {
        len: {
          args: [0, 500],
          msg: 'Maximum length for website field is 500',
        }
      }
    },
    apple_store_link: {
      type: DataTypes.STRING(500),
      validate: {
        isInt: {
          msg: 'apple_store_link field should be an integer',
        },
        len: {
          args: [0, 500],
          msg: 'Maximum length for apple_store_link field is 500',
        },
      },
    },
    playstore_link: {
      type: DataTypes.STRING(500),
      validate: {
        isInt: {
          msg: 'playstore_link field should be an integer',
        },
        len: {
          args: [0, 500],
          msg: 'Maximum length for playstore_link field is 500',
        },
      },
    },
    windows_store_link: {
      type: DataTypes.STRING(500),
      validate: {
        isInt: {
          msg: 'windows_store_link field should be an integer',
        },
        len: {
          args: [0, 500],
          msg: 'Maximum length for windows_store_link field is 500',
        },
      },
    },
    published_status: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'published_status field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for published_status field is 1',
        },
      },
    },
    bd_mgr_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'bd_mgr_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for bd_mgr_id field is 11',
        },
      },
    },
    eng_mgr_id: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'eng_mgr_id field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for eng_mgr_id field is 11',
        },
      },
    },
    consultant_survey: {
      type: DataTypes.INTEGER(1),
      validate: {
        isInt: {
          msg: 'consultant_survey field should be an integer',
        },
        len: {
          args: [0, 1],
          msg: 'Maximum length for consultant_survey field is 1',
        },
      },
      defaultValue: 0,
    },
    consultant_survey_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    min_ctc: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'min_ctc field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for min_ctc field is 11',
        },
      },
      defaultValue: 0,
    },
    max_ctc: {
      type: DataTypes.INTEGER(11),
      validate: {
        isInt: {
          msg: 'max_ctc field should be an integer',
        },
        len: {
          args: [0, 11],
          msg: 'Maximum length for max_ctc field is 11',
        },
      },
      defaultValue: 3,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      validate: {
        len: {
          args: [0, 100],
          msg: 'Maximum length for bank_name field is 100',
        },
      },
    },
    branch: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for branch field is 50',
        },
      },
    },
    account_type: {
      type: DataTypes.INTEGER(1),
      validate: {
        len: {
          args: [0, 4],
          msg: 'Maximum length for account_type field is 4',
        },
      },
    },
    account_number: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for account_number field is 50',
        },
      },
    },
    ifsc: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for ifsc field is 50',
        },
      },
    },
    micr: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for micr field is 50',
        },
      },
    },
    msmed_enabled: {
      type: DataTypes.INTEGER(1),
      validate: {
        len: {
          args: [0, 1],
          msg: 'Maximum length for msmed_enabled field is 1',
        },
      },
    },
    msmed_number: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for msmed_number field is 50',
        },
      },
    },
    org_size: {
      type: DataTypes.INTEGER(11),
      validate: {
        len: {
          args: [0, 11],
          msg: 'Maximum length for org_size field is 11',
        },
      },
      defaultValue: 0,
    },
    entity_type_id: {
      type: DataTypes.INTEGER(4),
      validate: {
        len: {
          args: [0, 4],
          msg: 'Maximum length for entity_type_id field is 4',
        },
      },
      defaultValue: 0,
    },
    cin_id: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for cin_id field is 50',
        },
      },
      defaultValue: 0,
    },
    llp_id: {
      type: DataTypes.STRING(50),
      validate: {
        len: {
          args: [0, 50],
          msg: 'Maximum length for llp_id field is 50',
        },
      },
      defaultValue: 0,
    },
  }, {
    tableName: 'clients',
    timestamps: false,
    underscored: true,

    classMethods: {
      getTerminatedStatus(db, clientId) {
        return db.Client.find({
          where: {
            id: clientId,
          },
          attributes: ['termination_flag'],
        });
      },
      associate(models) {
        Client.hasMany(models.User);
        Client.hasMany(models.ClientPayment);
        Client.hasMany(models.ClientPaymentDesignation);
        Client.hasMany(models.ClientPreferredFunction);
        Client.hasMany(models.ClientPreferredIndustry);
        Client.hasMany(models.Follower);
        Client.belongsTo(models.User, {
          as: 'EngagementManager',
          foreignKey: 'eng_mgr_id',
          constraints: false,
        });

        Client.belongsTo(models.Group, {
          foreignKey: 'group_id',
        });

        Client.belongsTo(models.Industry, {
          foreignKey: 'industry_id',
        });

        Client.belongsTo(models.PaymentMethod, {
          foreignKey: 'payment_method_id',
        });

        Client.belongsTo(models.Logo, {
          foreignKey: 'logo_id',
        });

        Client.belongsTo(models.EntityType, {
          foreignKey: 'entity_type_id',
        });
      },
    },
  });

  return Client;
};
