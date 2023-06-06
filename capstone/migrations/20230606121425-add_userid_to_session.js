'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    
    await queryInterface.addColumn("slots", "userId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("slots", {
      fields: ["userId"],
      type: "foreign key",
      references: {
        table: "users",
        field: "id",
      },
    });

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};