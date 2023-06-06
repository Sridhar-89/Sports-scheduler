'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      sport.belongsTo(models.user, {
        foreignKey: "userId",
      });

      sport.hasMany(models.slot, {
        foreignKey: "sportId",
      });

    }
    static async getall(id){
      return this.findAll({
        where:{
          userId:id
        }
      })
    }
    static async getdetails(id){
      return this.findAll({
        where:{
          id:id
        }
      })
    }
    static async getallsports(){
      return this.findAll()
    }
  }
  sport.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'sport',
  });
  return sport;
};