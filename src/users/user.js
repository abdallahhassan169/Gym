import { fileURLToPath } from "url";
import { join, dirname, extname } from "path";
import fs from "fs";
import {} from "dotenv/config";
import pool from "../../db/index.js";

export const user_by_id = async (req, res) => {
  try {
    console.log("Fetching types data...");
    const user_id = req.query.user_id;
    const date = new Date();

    //selecting data

    const { rows } = await pool.query(
      `   
select u.* , t.name as type_name,
 s.name as sport_name
 from "Gym".users u join
 "Gym".sports s on s.id = u.id_sport join
 "Gym".user_type t on t.id = id_user_type
 where u.id =($1)
 
 `,
      [user_id]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const user_scan = async (req, res) => {
  try {
    const date = new Date();
    const code = req.body.code;
    console.log(code);
    const user_id = req.query.user_id;
    //selecting data

    const { rows } = await pool.query(
      `   
select * from "Gym".users 
 where qr_code_name = ($1)
 `,
      [code]
    );

    console.log(rows, "rows");
    //mapping and cast the date
    if (rows[0]?.reg_end_date > date) {
      console.log(rows[0].reg_end_date > date);
      console.log(rows[0].reg_end_date, date);
      const new_classes_num = parseInt(rows[0].classes_num) - 1;
      const { log } = await pool.query(
        `   
          INSERT INTO "Gym".users_log(
	 user_id, "time")
	VALUES ((select id from "Gym".users where qr_code =($1) ) , (CURRENT_TIMESTAMP ))
 
 `,
        [code]
      );

      if (rows[0].classes_num > 0) {
        const { update } = await pool.query(
          `   
update   "Gym".users set classes_num =($1)
 where qr_code = ($2) returning id
 `,
          [new_classes_num, code]
        );
      }

      res.send({ id: String(rows[0].id), exist: true });
    } else {
      console.log(rows);
      res.send(
        rows[0]?.id
          ? { id: String(rows[0]?.id), exist: false }
          : { exist: false }
      );
    }
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const users = async (req, res) => {
  try {
    console.log("Fetching users data...");
    const query = req.query.query;
    const type = req.query.type;
    const limit = req.query.limit;
    const offset = req.query.offset;
    const sport = req.query.sport;
    //selecting data

    const { rows } = await pool.query(
      `   
SELECT u.* , s.name as sport_name ,
    t.name as type_name
	FROM "Gym"."users" u 
    JOIN "Gym"."user_type" t
     ON u.id_user_type = t.id
     join "Gym".sports s on
     u.id_sport = s.id
     WHERE
   ( u.name like '%'||($1)||'%' or
    u.phone like '%'||($1)||'%'or
     u.email like '%'||($1)||'%' or
     t.name like '%'||($1)||'%'
    ) and
     id_sport = ($4)
    order by id desc
    LIMIT ($2) OFFSET($3)  ; `,
      [query, 20, offset, sport]
    );
    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const users_logs = async (req, res) => {
  try {
    console.log(" users data...");
    const query = req.query.query;
    //selecting data
    const { rows } = await pool.query(
      `
      select u.name,u.phone, ul.* from "Gym"."users_log" ul join
       "Gym"."users" u on u.id = ul.user_id  
       where u.name like concat('%',cast(($1) as text) ,'%')
        and (cast (time as date) ) between cast(($2) as date) and cast(($5) as date)
        
        order by id desc limit ($3) offset ($4)
  ; `,
      [query, req.query.from, req.query.limit, req.query.offset, req.query.to]
    );

    //mapping and cast the date

    res.json(rows);
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};

export const add_user = async (req, res) => {
  try {
    console.log(req.body.data, "jsonData");

    const imageFile = req?.file ?? null;
    const jsonData = JSON.parse(req.body.data);
    const dataString = JSON.stringify(jsonData);
    const date = Date.now();
    const data = [
      jsonData.name,
      jsonData.email,
      jsonData.phone,
      jsonData.birth_day,
      jsonData.id_user_type,
      dataString,
      `${date}`,
      jsonData.id_sport,
      0,
    ];
    if (imageFile) {
      const extension = extname(imageFile?.originalname); // Get the file extension

      // Rename the uploaded file with the extension
      const newFileName = `${imageFile?.filename}${extension}`;
      const newFilePath = join(
        dirname(fileURLToPath(import.meta.url)),
        "user_images",
        newFileName
      );
      data.push(newFilePath);
      fs.renameSync(imageFile?.path, newFilePath);
    } else data.push(null);
    //selecting data

    const { rows } = await pool.query(
      `   
INSERT INTO "Gym".users(
	 name, email, phone, birth_day,  id_user_type ,qr_code , qr_code_name,id_sport, classes_num , img)
	VALUES ($1, $2,  $3, $4 , $5 ,$6 ,$7,$8,$9 , $10)  returning id `,
      data
    );

    console.log(data);
    //selecting data

    //mapping and cast the date

    res.json("add succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};
export const registration = async (req, res) => {
  try {
    console.log("Fetching users data...");

    //selecting data
    const date = new Date();
    const { rows } = await pool.query(
      `
      update "Gym".users set reg_start_date = ($1) ,  reg_end_date = ($2) ,  classes_num = ($3) , cost = ($4)
      where id = ($5) returning "Gym".users.name
 `,
      [
        req.body.reg_start_date,
        req.body.reg_end_date,
        req.body.classes_num,
        req.body.cost,
        req.body.id,
      ]
    );
    const { sub } = await pool.query(
      `
     INSERT INTO "Gym"."Finanace"(
	 client_name,  cost, id_type , date )
	VALUES (($1), ($2), ($3) , ($4));
 `,
      [rows[0].name, req.body.cost, 2, date.toISOString().slice(0, 10)]
    );
    res.json("updated succefully");
  } catch (error) {
    console.error("Error fetching visit_visitors data:", error);
    res.status(500).send("Server error");
  }
};
