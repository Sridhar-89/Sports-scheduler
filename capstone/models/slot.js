"use strict";
const { Op } = require("sequelize");
const { Model } = require("sequelize");
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
    static async getAll() {
      return this.findAll();
    }
    static async getdetails(sid) {
      return this.findOne({
        where: {
          id: sid,
        },
      });
    }
    static async updatesession(sid, venue, time, players, noofplayers) {
      return this.update(
        {
          time: time,
          venue: venue,
          players: players,
          noofplayers: noofplayers,
        },
        {
          where: {
            id: sid,
          },
        }
      );
    }
    static async addplayers(id, ar, count) {
      return this.update(
        {
          players: ar,
          noofplayers: count,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }
    static async removeplayers(id, ar, count) {
      return this.update(
        {
          players: ar,
          noofplayers: count,
        },
        {
          where: {
            id: id,
          },
        }
      );
    }

    static async previous(sportId) {
      // FILL IN HERE TO RETURN OVERDUE ITEMS

      const today = new Date();
      return this.findAll({
        where: {
          time: {
            [Op.lt]: today,
          },
          sportId: sportId,
        },
      });
    }
    static async upcoming(sportId) {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const today = new Date();
      return this.findAll({
        where: {
          time: {
            [Op.gt]: today,
          },
          sportId: sportId,
        },
      });
    }
    static async DeleteSport1(sportId) {
      return this.update(
        {
          cancel: true,
        },
        {
          where: {
            id: sportId,
          },
        }
      );
    }
  }
  slot.init(
    {
      time: DataTypes.DATE,
      venue: DataTypes.STRING,
      players: DataTypes.ARRAY(DataTypes.STRING),
      noofplayers: DataTypes.INTEGER,
      cancel: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "slot",
    }
  );
  return slot;
};
