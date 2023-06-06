'use strict';
const { Op } = require("sequelize");
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class slot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      slot.belongsTo(models.sport, {
        foreignKey: "sportId",
      });
      slot.belongsTo(models.user, {
        foreignKey: "userId",
      });

    }
    static async getAll(){
      return this.findAll();
    }

    static async previous(userId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS

      const today = new Date();
      return this.findAll({
        where: {
          time: {
            [Op.lt]: today,
          },
          userId:userId,
        },
      });
    }
    static async upcoming(userId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const today = new Date();
      return this.findAll({
        where: {
          time: {
            [Op.gt]: today,
          },
          userId:userId,
        },
      });
    }

  }
  slot.init({
    time: DataTypes.DATE,
    venue: DataTypes.STRING,
    players: DataTypes.ARRAY(DataTypes.STRING),
    noofplayers: DataTypes.INTEGER,
    cancel: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'slot',
  });
  return slot;
};