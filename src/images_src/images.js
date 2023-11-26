import {} from "dotenv/config";
import process from "process";
import pool from "../../db/index.js";
import fs from "fs";
export const qrs = async (req, res) => {
  try {
    const user_id = req.query.id;

    //selecting data

    const { rows } = await pool.query(
      `   
select qr_code_name from "Gym".users where id = ($1) `,
      [user_id]
    );
    console.log(rows);
    //mapping and cast the date

    res.sendFile(`${process.cwd()}/qrs/${rows[0]?.qr_code_name}`);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const user_image = async (req, res) => {
  try {
    const user_id = req.query.id;

    //selecting data

    const { rows } = await pool.query(
      `   
select img from "Gym".users where id = ($1) `,
      [user_id]
    );
    console.log(rows);
    //mapping and cast the date

    res.sendFile(`${rows[0]?.img}`);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};
