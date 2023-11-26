import {} from "dotenv/config";

import pool from "../../db/index.js";

export const types = async (req, res) => {
  try {
    console.log("Fetching types data...");

    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym".user_type `
    );
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const sports = async (req, res) => {
  try {
    console.log("Fetching types data...");

    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym".sports `
    );
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};
